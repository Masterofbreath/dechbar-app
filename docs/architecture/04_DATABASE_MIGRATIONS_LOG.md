# Database Migrations Log

**Purpose:** Complete tracking of all schema changes for safe PROD deployment  
**Format:** Chronological log with status tracking  
**Usage:** Review before every PROD deployment

---

## 📊 MIGRATION STATUS LEGEND

| Status | Description |
|--------|-------------|
| ✅ DEV | Applied to DEV environment |
| ✅ TEST | Applied to TEST environment |
| ✅ PROD | Applied to PROD environment |
| ⏳ Pending | Not yet applied |
| ❌ Failed | Migration failed (see notes) |
| 🔄 Rollback | Migration was rolled back |

---

## 2026-01-26: Challenge Registration System

**Migration File:** `supabase/migrations/20260126000000_add_challenge_registrations.sql`

**Author:** AI Agent (Claude Sonnet 4.5)  
**Jira Ticket:** N/A (MVP feature)  
**Created:** 2026-01-26  
**Applied:** 2026-01-27

### **Status:**
- ✅ DEV (applied 2026-01-27 11:06)
- ⏳ TEST (pending)
- ⏳ PROD (pending)

### **Changes:**

#### **Tables Added:**

1. **`challenge_registrations`**
   - Purpose: Track registrations into time-limited challenges
   - Columns: 10 total (id, user_id, email, kp_value, conversion_source, smart_trial_eligible, smart_trial_activated_at, onboarding_completed, onboarding_completed_at, created_at)
   - Indexes: 4 (user, email, conversion_source, smart_trial)
   - RLS: Enabled (users see own data)

2. **`kp_measurements`**
   - Purpose: Historical tracking of breath hold (kontrolní pauza) measurements
   - Columns: 7 total (id, user_id, kp_value, measurement_date, measurement_context, notes, created_at)
   - Indexes: 3 (user, date, context)
   - RLS: Enabled (users see own data)

#### **Tables Modified:**

1. **`profiles`**
   - Added: `metadata` JSONB DEFAULT '{}'::jsonb
   - Purpose: Store onboarding data, motivations, health profile, symptoms
   - Impact: Non-breaking (nullable with default)

2. **`memberships`**
   - Added: `metadata` JSONB DEFAULT '{}'::jsonb
   - Added: `billing_interval` TEXT
   - Added: `amount_czk` INTEGER
   - Purpose: Trial tracking, billing info, LTV tracking
   - Impact: Non-breaking (nullable columns)

### **Testing Checklist:**

- [x] Local dev tested (localhost:5173)
- [ ] DEV environment tested (test.dechbar.cz)
- [ ] Challenge registration flow tested
- [ ] KP measurement flow tested
- [ ] Magic link flow tested
- [ ] Onboarding flow tested
- [ ] RLS policies verified
- [ ] No data loss
- [ ] Rollback plan ready

### **Rollback Plan:**

```sql
-- If needed, drop tables
DROP TABLE IF EXISTS kp_measurements CASCADE;
DROP TABLE IF EXISTS challenge_registrations CASCADE;

-- Remove added columns
ALTER TABLE profiles DROP COLUMN IF EXISTS metadata;
ALTER TABLE memberships DROP COLUMN IF EXISTS metadata;
ALTER TABLE memberships DROP COLUMN IF EXISTS billing_interval;
ALTER TABLE memberships DROP COLUMN IF EXISTS amount_czk;
```

### **Dependencies:**

- Frontend: `src/platform/api/challenge.ts`
- Frontend: `src/modules/public-web/components/challenge/*`
- Edge Functions: `supabase/functions/activate-smart-trial/`
- Edge Functions: `supabase/functions/deactivate-smart-trial/`

### **Post-Deployment Verification:**

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('challenge_registrations', 'kp_measurements');

-- Check columns added
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'metadata';

-- Test insert
INSERT INTO challenge_registrations (user_id, email, kp_value, conversion_source)
VALUES (auth.uid(), 'test@example.com', 25, 'hero_cta');

-- Cleanup test data
DELETE FROM challenge_registrations WHERE email = 'test@example.com';
```

---

## 2026-01-28: Ecomail Sync Queue (MANUAL)

**Migration File:** MANUAL (not in `supabase/migrations/`)  
**SQL Location:** `docs/marketing/ECOMAIL_DB_SETUP.md`

**Author:** AI Agent (Claude Sonnet 4.5)  
**Jira Ticket:** N/A (Marketing integration)  
**Created:** 2026-01-28  
**Applied DEV:** ✅ 2026-01-28 13:00 (manual execution)

### **Status:**
- ✅ DEV (applied 2026-01-28, tested ✅)
- ⏳ TEST (pending)
- ⏳ PROD (pending)

### **Why Manual?**

This migration MUST be run manually because:
1. Not part of standard migration flow (marketing-specific)
2. Depends on `challenge_registrations`, `profiles`, `memberships` existing
3. Contains complex trigger functions (best reviewed before execution)
4. Requires Ecomail API key configuration (secrets)

### **Changes:**

#### **Tables Added:**

1. **`ecomail_sync_queue`**
   - Purpose: Queue-based resilience for Ecomail API calls
   - Columns: 11 total (id, user_id, email, event_type, payload, status, retry_count, max_retries, last_error, created_at, processed_at, next_retry_at)
   - Indexes: 4 (status, email, created_at, next_retry)
   - RLS: Enabled (users see own, admins see all)

2. **`ecomail_failed_syncs`**
   - Purpose: Dead letter queue for permanently failed syncs
   - Columns: 11 total (id, original_queue_id, user_id, email, event_type, payload, error_message, retry_history, failed_at, requires_manual_review, resolved_at, resolved_by)
   - Indexes: 2 (failed_at, requires_review)
   - RLS: Enabled (admins only)

#### **Triggers Added:**

1. **`trigger_queue_ecomail_on_challenge_registration`**
   - Table: `challenge_registrations`
   - Event: AFTER INSERT
   - Function: `queue_ecomail_on_challenge_registration()`
   - Purpose: Sync to Ecomail when magic link sent

2. **`trigger_queue_ecomail_on_auth_confirmed`**
   - Table: `auth.users`
   - Event: AFTER UPDATE OF `email_confirmed_at`
   - Function: `queue_ecomail_on_auth_confirmed()`
   - Purpose: Move contact from UNREG → REG list

3. **`trigger_queue_ecomail_on_onboarding_complete`**
   - Table: `profiles`
   - Event: AFTER UPDATE OF `metadata`
   - Function: `queue_ecomail_on_onboarding_complete()`
   - Purpose: Add ONBOARDING_COMPLETE tag + motivations

4. **`trigger_queue_ecomail_on_membership_change`**
   - Table: `memberships`
   - Event: AFTER INSERT OR UPDATE
   - Function: `queue_ecomail_on_membership_change()`
   - Purpose: Sync trial/tariff changes

#### **Functions Added:**

1. **`queue_ecomail_on_challenge_registration()`**
   - Lines: 130-172 in ECOMAIL_DB_SETUP.md
   - Language: PL/pgSQL
   - Security: DEFINER

2. **`queue_ecomail_on_auth_confirmed()`**
   - Lines: 175-200
   - Language: PL/pgSQL
   - Security: DEFINER

3. **`queue_ecomail_on_onboarding_complete()`**
   - Lines: 202-243
   - Language: PL/pgSQL
   - Security: DEFINER

4. **`queue_ecomail_on_membership_change()`**
   - Lines: 245-333
   - Language: PL/pgSQL
   - Security: DEFINER

5. **`get_ecomail_sync_health()`** (Utility)
   - Lines: 402-424
   - Purpose: Health check metrics (last 24h)
   - Returns: pending_count, processing_count, failed_count, oldest_pending, avg_processing_time

### **Prerequisites:**

Before running this migration:

1. ✅ `challenge_registrations` table exists (2026-01-26 migration)
2. ✅ `profiles.metadata` column exists
3. ✅ `memberships.metadata` column exists
4. ✅ Ecomail API key obtained
5. ✅ Ecomail lists created (5 lists)
6. ⏳ Edge Functions ready for deployment

### **Deployment Steps:**

1. **Open Supabase SQL Editor:**
   - DEV: https://supabase.com/dashboard/project/[DEV_PROJECT]/sql
   - PROD: https://supabase.com/dashboard/project/[PROD_PROJECT]/sql

2. **Copy entire SQL from:**
   - `docs/marketing/ECOMAIL_DB_SETUP.md` (lines 49-449)

3. **Paste into SQL Editor and Run**

4. **Verify execution:**
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'ecomail%';
   
   -- Check triggers
   SELECT trigger_name FROM information_schema.triggers
   WHERE trigger_name LIKE '%ecomail%';
   
   -- Test health function
   SELECT * FROM get_ecomail_sync_health();
   ```

5. **Configure Supabase Secrets:**
   ```bash
   supabase secrets set ECOMAIL_API_KEY="[KEY]" --project-ref [PROJECT]
   supabase secrets set ECOMAIL_LIST_UNREG="5" --project-ref [PROJECT]
   supabase secrets set ECOMAIL_LIST_REG="6" --project-ref [PROJECT]
   supabase secrets set ECOMAIL_LIST_ENGAGED="7" --project-ref [PROJECT]
   supabase secrets set ECOMAIL_LIST_PREMIUM="8" --project-ref [PROJECT]
   supabase secrets set ECOMAIL_LIST_CHURNED="9" --project-ref [PROJECT]
   ```

### **Testing Checklist:**

- [ ] Tables created successfully
- [ ] Triggers active
- [ ] Functions executable
- [ ] RLS policies working
- [ ] Test challenge registration → queue event created
- [ ] Test magic link → list move queued
- [ ] Test onboarding complete → tags queued
- [ ] Test trial activation → queue event created
- [ ] Edge Function can poll queue
- [ ] Failed syncs go to dead letter queue
- [ ] Health function returns data

### **Rollback Plan:**

```sql
-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_challenge_registration ON challenge_registrations;
DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_auth_confirmed ON auth.users;
DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_onboarding_complete ON profiles;
DROP TRIGGER IF EXISTS trigger_queue_ecomail_on_membership_change ON memberships;

-- Drop functions
DROP FUNCTION IF EXISTS queue_ecomail_on_challenge_registration();
DROP FUNCTION IF EXISTS queue_ecomail_on_auth_confirmed();
DROP FUNCTION IF EXISTS queue_ecomail_on_onboarding_complete();
DROP FUNCTION IF EXISTS queue_ecomail_on_membership_change();
DROP FUNCTION IF EXISTS get_ecomail_sync_health();

-- Drop tables
DROP TABLE IF EXISTS ecomail_failed_syncs CASCADE;
DROP TABLE IF EXISTS ecomail_sync_queue CASCADE;
```

### **Dependencies:**

- API: `src/platform/api/ecomail.ts` (wrapper)
- Edge Functions: `supabase/functions/sync-to-ecomail/` ✅ deployed
- Edge Functions: `supabase/functions/ecomail-webhook-handler/` ✅ deployed
- Edge Functions: `supabase/functions/batch-sync-engagement/` ✅ deployed
- Ecomail Account: Lists created (see `docs/marketing/ecomail/00_MASTER.md`)

### **Post-Deployment Verification:**

```sql
-- 1. Verify structure
SELECT * FROM get_ecomail_sync_health();

-- 2. Test trigger manually
INSERT INTO challenge_registrations (user_id, email, kp_value, conversion_source, smart_trial_eligible)
VALUES (auth.uid(), 'test-trigger@example.com', 30, 'hero_cta', true);

-- 3. Check queue item created
SELECT * FROM ecomail_sync_queue WHERE email = 'test-trigger@example.com' ORDER BY created_at DESC LIMIT 1;

-- Expected: 1 row with status='pending', event_type='contact_add'

-- 4. Cleanup
DELETE FROM challenge_registrations WHERE email = 'test-trigger@example.com';
DELETE FROM ecomail_sync_queue WHERE email = 'test-trigger@example.com';
```

---

## 📚 FUTURE MIGRATIONS

### Planned (Q1 2026):

- **Referral System** (tables: `referrals`, `referral_rewards`)
- **Exercise Sessions** (table: `exercise_sessions`)
- **AI Conversations** (table: `ai_conversations`)
- **Achievements** (tables: `achievements`, `user_achievements`)

---

## 🔗 RELATED DOCS

- [03_DATABASE.md](./03_DATABASE.md) - Complete database schema
- [Ecomail Master](../marketing/ecomail/00_MASTER.md) - Ecomail integration (current state)
- [Ecomail Architecture](../marketing/ecomail/01_ARCHITECTURE.md) - System design
- [Ecomail DB Setup SQL](../marketing/ecomail/archive/ECOMAIL_DB_SETUP.md) - Original SQL (reference only)

---

*Last updated: 2026-01-28*
