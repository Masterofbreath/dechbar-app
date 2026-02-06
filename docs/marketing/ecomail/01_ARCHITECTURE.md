# 🏗️ Ecomail Architecture

**Last Updated:** 4. února 2026  
**Status:** ✅ Production (Live)  
**See Master:** [00_MASTER.md](./00_MASTER.md)

---

## 📐 SYSTEM OVERVIEW

```mermaid
graph TB
    subgraph Frontend
        WebApp[Web App /vyzva]
    end
    
    subgraph Supabase
        Auth[Supabase Auth]
        DB[(PostgreSQL)]
        Queue[(ecomail_sync_queue)]
        EdgeFn[Edge Function sync-to-ecomail]
        CRON[CRON Job every 3 min]
    end
    
    subgraph Ecomail
        API[Ecomail API]
        Lists[Contact Lists]
    end
    
    WebApp -->|signInWithOtp| Auth
    Auth -->|INSERT user| DB
    DB -->|Trigger| Queue
    CRON -->|Poll| EdgeFn
    EdgeFn -->|SELECT pending| Queue
    EdgeFn -->|POST /lists/subscribe| API
    API -->|Add contact| Lists
    EdgeFn -->|UPDATE status=completed| Queue
```

---

## 🗄️ DATABASE SCHEMA

### **Table: ecomail_sync_queue**

**Purpose:** Offline resilience queue - ensures no data loss if Ecomail API unavailable.

**Columns (12):**
```sql
CREATE TABLE ecomail_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'contact_add', 'contact_update', 'list_move',
    'tag_add', 'tag_remove', 'metrics_update',
    'trial_activated', 'trial_expired', 'tariff_changed'
  )),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);
```

**Indexes:**
- `idx_ecomail_sync_queue_status` ON status
- `idx_ecomail_sync_queue_email` ON email
- `idx_ecomail_sync_queue_created_at` ON created_at
- `idx_ecomail_sync_queue_next_retry` ON next_retry_at WHERE status='failed'

---

### **Table: ecomail_failed_syncs**

**Purpose:** Dead letter queue - failed syncs after 3 retry attempts.

**Columns (14):**
```sql
CREATE TABLE ecomail_failed_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_queue_id UUID,
  user_id UUID,
  email TEXT,
  event_type TEXT,
  payload JSONB,
  error_message TEXT,
  retry_history JSONB,
  failed_at TIMESTAMPTZ DEFAULT NOW(),
  requires_manual_review BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current Status:** 0 failed syncs ✅

---

## ⚡ TRIGGERS (4 Active)

### **1. trigger_queue_ecomail_on_challenge_registration**

**Table:** `challenge_registrations`  
**Event:** AFTER INSERT  
**Function:** `queue_ecomail_on_challenge_registration()`

**What it does:**
```
User registers → INSERT challenge_registrations
    ↓
Trigger fires → Call function
    ↓
INSERT ecomail_sync_queue:
  - event_type: 'contact_add'
  - payload: { list_name: 'UNREG', contact: {...}, tags: [...] }
```

---

### **2. trigger_queue_ecomail_on_auth_confirmed**

**Table:** `auth.users`  
**Event:** AFTER UPDATE OF email_confirmed_at  
**Function:** `queue_ecomail_on_auth_confirmed()`

**What it does:**
```
User clicks magic link → email_confirmed_at updated
    ↓
Trigger fires
    ↓
INSERT ecomail_sync_queue:
  - event_type: 'list_move'
  - payload: { from_list: 'UNREG', to_list: 'REG' }
```

---

### **3. trigger_queue_ecomail_on_onboarding_complete**

**Table:** `profiles`  
**Event:** AFTER UPDATE OF metadata  
**Function:** `queue_ecomail_on_onboarding_complete()`

**What it does:**
```
User completes onboarding → metadata updated
    ↓
Trigger fires (if metadata->'onboarding_completed' = true)
    ↓
INSERT ecomail_sync_queue:
  - event_type: 'contact_update'
  - payload: { add_tags: ['ONBOARDING_COMPLETE'], custom_fields: {...} }
```

---

### **4. trigger_queue_ecomail_on_membership_change**

**Table:** `memberships`  
**Event:** AFTER INSERT OR UPDATE  
**Function:** `queue_ecomail_on_membership_change()`

**What it does:**
```
User purchases SMART/AI_COACH → INSERT/UPDATE memberships
    ↓
Trigger fires
    ↓
INSERT ecomail_sync_queue:
  - event_type: 'tariff_changed'
  - payload: { 
      add_tags: ['TARIF_SMART'], 
      remove_tags: ['TARIF_ZDARMA'],
      move_to_list: 'PREMIUM'
    }
```

---

## 🔌 EDGE FUNCTIONS

### **sync-to-ecomail (Main Worker)**

**File:** `supabase/functions/sync-to-ecomail/index.ts` (632 lines)

**Purpose:** Process sync queue and call Ecomail API.

**Flow:**
```typescript
1. SELECT pending/failed items (LIMIT 50)
2. For each item:
   - Set status = 'processing'
   - Call Ecomail API based on event_type
   - If success: status = 'completed', processed_at = NOW()
   - If fail: retry_count++, next_retry_at = exponential backoff
   - If max_retries: Move to ecomail_failed_syncs
3. Return stats { processed, succeeded, failed }
```

**Event Types Handled:**
- `contact_add` → POST /lists/{id}/subscribe
- `contact_update` → POST /lists/{id}/subscribe (update_existing=true)
- `list_move` → POST /lists/{to}/subscribe + POST /lists/{from}/unsubscribe
- `tag_add` → POST /lists/{id}/subscribe (with tags array)
- `tag_remove` → ⚠️ Not supported by Ecomail API v2 (logged + skipped)
- `trial_activated` → POST /lists/{id}/subscribe (with trial tags)
- `trial_expired` → POST /lists/{id}/subscribe (with expired tags)
- `tariff_changed` → POST /lists/{id}/subscribe (with tariff tags)
- `metrics_update` → POST /lists/{id}/subscribe (with custom_fields)

**Rate Limiting:** 600ms delay between requests (100 req/min limit)

---

### **ecomail-webhook-handler (Inbound)**

**File:** `supabase/functions/ecomail-webhook-handler/index.ts` (179 lines)

**Purpose:** Receive webhooks from Ecomail (email opened, clicked, unsubscribed).

**Status:** ✅ Deployed, not yet used (no webhooks configured in Ecomail).

---

### **batch-sync-engagement (Metrics)**

**File:** `supabase/functions/batch-sync-engagement/index.ts` (269 lines)

**Purpose:** Bulk update engagement metrics every 6 hours.

**What it syncs:**
- HOURS_BREATHED (calculated from exercise_sessions)
- EXERCISES_COMPLETED (count)
- LAST_EXERCISE_DATE (max date)
- CURRENT_STREAK (calculated)
- Engagement tags (NONE, LOW, MEDIUM, HIGH)
- KP category tags (CRITICAL, POOR, AVERAGE, GOOD, EXCELLENT)

**Status:** ✅ Deployed, CRON active (0 */6 * * *)

---

## ⏱️ CRON JOBS

### **1. ecomail-sync-every-3-minutes**

```sql
SELECT cron.schedule(
  'ecomail-sync-every-3-minutes',
  '*/3 * * * *',  -- Every 3 minutes
  $$
  SELECT net.http_post(
    url := 'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);
```

**Status:** ✅ Active  
**Last Run:** 4.2.2026 17:18  
**Frequency:** Every 3 minutes  
**Purpose:** Process pending sync queue items

---

### **2. ecomail-bulk-resync**

```sql
SELECT cron.schedule(
  'ecomail-bulk-resync',
  '0 */6 * * *',  -- Every 6 hours at :00
  $$
  SELECT jsonb_agg(DISTINCT tag ORDER BY tag) 
  FROM (...);
  $$
);
```

**Status:** ✅ Active  
**Frequency:** Every 6 hours (00:00, 06:00, 12:00, 18:00)  
**Purpose:** Bulk engagement metrics + tag sync

---

### **3. activate-smart-trial-2026-03-01**

```sql
SELECT cron.schedule(
  'activate-smart-trial-2026-03-01',
  '0 0 1 3 *',  -- March 1, 2026 at 00:00
  $$ ... $$
);
```

**Status:** ✅ Active (one-time execution)  
**Run Date:** 1. března 2026, 00:00  
**Purpose:** Activate SMART trial for eligible users

---

## 🔄 DATA FLOW (Detailed)

### **Flow 1: User Registration**

```
1. User visits /vyzva landing page
2. Fills email + measures KP
3. Clicks "Registrovat zdarma"
    ↓
4. Frontend: signInWithOtp(email)
    ↓
5. Supabase Auth: Send magic link email
    ↓
6. INSERT challenge_registrations:
   - user_id: auth.uid()
   - email: user's email
   - kp_value: measured KP
   - conversion_source: 'hero_cta'
   - smart_trial_eligible: true (if before deadline)
    ↓
7. Trigger: queue_ecomail_on_challenge_registration()
    ↓
8. INSERT ecomail_sync_queue:
   {
     event_type: 'contact_add',
     email: user's email,
     payload: {
       list_name: 'UNREG',
       list_id: '5',
       contact: {
         email: user's email,
         name: '',
         custom_fields: {
           KP_VALUE: measured KP,
           CONVERSION_SOURCE: 'hero_cta'
         }
       },
       tags: ['MAGIC_LINK_SENT', 'CHALLENGE_REGISTERED']
     }
   }
    ↓
9. CRON (within 3 min): Edge Function processes queue
    ↓
10. Edge Function: POST Ecomail API
    ↓
11. Ecomail: Contact added to UNREG list (ID: 5)
    ↓
12. UPDATE queue: status = 'completed'
    ↓
✅ Contact synced!
```

---

### **Flow 2: Magic Link Clicked**

```
1. User clicks magic link in email
    ↓
2. Supabase Auth: Verify token
    ↓
3. UPDATE auth.users: email_confirmed_at = NOW()
    ↓
4. Trigger: queue_ecomail_on_auth_confirmed()
    ↓
5. INSERT ecomail_sync_queue:
   {
     event_type: 'list_move',
     payload: {
       from_list_name: 'UNREG',
       from_list: '5',
       to_list_name: 'REG',
       to_list: '6',
       tags: ['MAGIC_LINK_CLICKED']
     }
   }
    ↓
6. Edge Function: Move contact UNREG → REG
    ↓
✅ Contact in REG list!
```

---

## 🔐 SECURITY

### **API Key Storage**
```
✅ Stored in Supabase Secrets (server-side only)
❌ NEVER in frontend code
❌ NEVER in git repository
```

### **Access Control**
```sql
-- Only Edge Functions can read queue (via SERVICE_ROLE_KEY)
-- Users cannot access ecomail_sync_queue directly (RLS)
```

### **Rate Limiting**
```typescript
// Built into Edge Function
const BATCH_SIZE = 50; // Max per run
const DELAY_MS = 600; // Between requests (100/min = 1 per 600ms)
```

---

## 📈 PERFORMANCE

### **Current Capacity**
```
Sync queue: 50 items per 3 minutes = 1000 items/hour
Ecomail API: 100 requests/minute = 6000 requests/hour
Bottleneck: CRON frequency (*/3), not API rate limit
```

### **Optimization Options**
```
1. Increase CRON frequency: */1 (every minute)
   → Capacity: 3000 items/hour
   
2. Increase BATCH_SIZE: 100 (stay under rate limit)
   → Capacity: 2000 items/hour (*/3 CRON)
   
3. Parallel workers: 2 Edge Functions
   → Capacity: 2000 items/hour (*/3 CRON)
```

**Current load:** 311 events in 23 minutes (13.5 events/min) ✅ Well below capacity.

---

## 🔄 ERROR HANDLING

### **Retry Strategy**
```typescript
const RETRY_DELAYS = [0, 30000, 300000]; // 0s, 30s, 5min

Attempt 1: Immediate (0s delay)
Attempt 2: After 30s
Attempt 3: After 5min
Attempt 4+: Move to Dead Letter Queue
```

### **Error Categories**

| Error | Retry? | Action |
|-------|--------|--------|
| Network timeout | ✅ Yes | Exponential backoff |
| Rate limit (429) | ✅ Yes | Wait 60s |
| Invalid API key (401) | ❌ No | Alert admin |
| Invalid data (400) | ❌ No | Log + DLQ |
| Contact exists (409) | ✅ Yes | Use update_existing=true |

---

## 🧪 MONITORING

### **Health Metrics**
```sql
-- Run daily
SELECT * FROM get_ecomail_queue_status();

-- Returns:
-- pending_count: 0
-- processing_count: 0
-- completed_count: 311
-- failed_count: 0
-- oldest_pending: NULL
-- avg_processing_time: ~2 seconds
```

### **Edge Function Logs**
```
Location: Supabase Dashboard → Edge Functions → sync-to-ecomail → Logs

Key messages to look for:
✅ "[Sync] 🚀 Starting Ecomail sync..."
✅ "[Sync] ℹ️ No items to process"
✅ "[Sync] 📦 Processing X items"
✅ "[Sync] ✅ Completed: X succeeded, 0 failed"

🚨 Red flags:
❌ "[Sync] ❌ Fatal error: ..."
❌ "ECOMAIL_API_KEY not configured"
❌ "Failed to add contact: ..."
```

---

## 🔧 MAINTENANCE

### **Regular Tasks**

**Daily (1 minute):**
```sql
-- Check for pending/failed items
SELECT status, COUNT(*) FROM ecomail_sync_queue GROUP BY status;
-- Expected: All 'completed'
```

**Weekly (5 minutes):**
```sql
-- Review sync stats
SELECT 
  DATE(created_at) as date,
  COUNT(*) as events
FROM ecomail_sync_queue
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

**Monthly (15 minutes):**
```sql
-- Cleanup old completed items (optional)
DELETE FROM ecomail_sync_queue 
WHERE status = 'completed' 
AND processed_at < NOW() - INTERVAL '30 days';
```

---

## 🚀 DEPLOYMENT

### **Prerequisites**
- [x] Supabase project created
- [x] Database tables created (ecomail_sync_queue, ecomail_failed_syncs)
- [x] Triggers created (4 triggers)
- [x] Edge Functions deployed (3 functions)
- [x] Secrets configured (6 secrets)
- [x] CRON jobs scheduled (3 jobs)
- [x] Ecomail lists created (5 lists)

### **Verify Deployment**
```bash
# 1. Check Edge Functions deployed
supabase functions list

# 2. Check secrets set
supabase secrets list

# 3. Test sync
curl -X POST https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# 4. Check queue processed
# Run SQL: SELECT COUNT(*) FROM ecomail_sync_queue WHERE status='completed';
```

---

## 📚 RELATED DOCS

- **[00_MASTER.md](./00_MASTER.md)** - Credentials + current state
- **[02_TAXONOMY.md](./02_TAXONOMY.md)** - Lists, tags, fields
- **[03_TROUBLESHOOTING.md](./03_TROUBLESHOOTING.md)** - Debug guide

---

**Status:** ✅ Production ready, running smoothly

*Last verified: 4. února 2026*
