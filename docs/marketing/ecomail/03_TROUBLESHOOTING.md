# 🔧 Ecomail Troubleshooting Guide

**Last Updated:** 4. února 2026  
**Status:** Based on real production issues  
**See Master:** [00_MASTER.md](./00_MASTER.md)

---

## 🚀 QUICK DIAGNOSTICS

### **Is Everything Working?** (30 seconds)

```sql
-- Run all at once:

-- 1. Queue health
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM ecomail_sync_queue;
-- Expected: pending=0-10, failed=0, completed=311+

-- 2. CRON jobs active?
SELECT jobname, active FROM cron.job WHERE jobname LIKE '%ecomail%';
-- Expected: All active = true

-- 3. Recent sync activity
SELECT MAX(processed_at) as last_sync FROM ecomail_sync_queue;
-- Expected: Within last 3 minutes

-- 4. Any errors?
SELECT COUNT(*) FROM ecomail_failed_syncs;
-- Expected: 0
```

**All green?** ✅ System healthy!  
**Any red?** ⚠️ Read sections below.

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue #1: Queue Filling Up (>50 pending items)**

**Symptoms:**
```sql
SELECT COUNT(*) FROM ecomail_sync_queue WHERE status = 'pending';
-- Returns: 100+ items
```

**Diagnosis:**
```
1. Check Edge Function logs:
   Supabase → Edge Functions → sync-to-ecomail → Logs
   
2. Look for errors:
   ❌ "ECOMAIL_API_KEY not configured"
   ❌ "Failed to add contact: ..."
   ❌ Network timeout
```

**Solutions:**

**A) Edge Function not running:**
```sql
-- Verify CRON is active
SELECT * FROM cron.job WHERE jobname = 'ecomail-sync-every-3-minutes';
-- If active = false:
SELECT cron.schedule(...); -- Re-schedule CRON
```

**B) API errors:**
```bash
# Test Ecomail API manually
curl -X GET https://api2.ecomailapp.cz/lists \
  -H "key: f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59"

# Expected: JSON with 5 lists
# If error: API key invalid or Ecomail down
```

**C) Rate limit hit:**
```sql
-- Check recent activity
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as events_per_minute
FROM ecomail_sync_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- If >100 events/minute → hitting rate limit
-- Solution: Reduce BATCH_SIZE in Edge Function
```

**D) Manually trigger sync:**
```bash
curl -X POST https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4Njk3OTgsImV4cCI6MjA1MjQ0NTc5OH0.aMqEJlh6Yg8TrUJLEVH7EgqO5gLN8TRgmJzEHbNZcl8" \
  -H "Content-Type: application/json"
```

---

### **Issue #2: Contact Not Appearing in Ecomail**

**Symptoms:**
User registered, but not visible in Ecomail dashboard.

**Diagnosis:**
```sql
-- 1. Was event queued?
SELECT * FROM ecomail_sync_queue 
WHERE email = 'user@example.com'
ORDER BY created_at DESC;

-- Expected: At least 1 row with event_type='contact_add'

-- 2. What's the status?
-- If status='pending': Wait 3 minutes
-- If status='completed': Contact should be in Ecomail
-- If status='failed': Check last_error
```

**Solutions:**

**A) Event never queued (trigger not working):**
```sql
-- Verify trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trigger_queue_ecomail_on_challenge_registration';

-- If missing: Re-run SQL from archive/ECOMAIL_DB_SETUP.md
```

**B) Event queued but not processed:**
```sql
-- Check if Edge Function ran recently
SELECT MAX(processed_at) FROM ecomail_sync_queue;
-- If >5 minutes ago: CRON not running

-- Re-schedule CRON:
-- (Copy from archive/ECOMAIL_SETUP_CRON.txt)
```

**C) Event completed but contact not in Ecomail:**
```sql
-- Check payload
SELECT payload FROM ecomail_sync_queue 
WHERE email = 'user@example.com' 
AND event_type = 'contact_add';

-- Verify list_id is correct (5 or 6)
-- Verify contact.email matches
```

**D) Check Ecomail directly:**
```
1. Login: https://app.ecomailapp.cz/
2. Contacts → Search for email
3. If found: Success! (might be in different list)
4. If not found: API call failed (check Edge Function logs)
```

---

### **Issue #3: Duplicate Contacts**

**Symptoms:**
```sql
SELECT email, COUNT(*) as duplicates
FROM ecomail_sync_queue
WHERE event_type = 'contact_add'
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;

-- Returns: 80+ emails sent multiple times
```

**Status:** ✅ **Not a problem!**

**Explanation:**
Ecomail API uses `update_existing: true`, which automatically deduplicates:
- First call: Creates contact
- Subsequent calls: Update existing contact (no duplicate)

**Verification:**
Check Ecomail dashboard - should have only 1 entry per email. ✅ Confirmed (231 unique).

---

### **Issue #4: Missing Users (3 users)**

**Symptoms:**
```sql
SELECT au.email
FROM auth.users au
LEFT JOIN ecomail_sync_queue esq ON au.id = esq.user_id
WHERE esq.id IS NULL;

-- Returns: 3 emails
```

**Identified Users:**
- `test-final@gmail.com`
- `jana.hartm1@seznam.cz`
- `kvetinka.j@seznam.comcu`

**Diagnosis:**
```sql
-- Check if they have challenge_registrations
SELECT * FROM challenge_registrations 
WHERE email IN ('test-final@gmail.com', 'jana.hartm1@seznam.cz', 'kvetinka.j@seznam.comcu');

-- If empty: They registered differently (direct Supabase Auth, not via /vyzva)
```

**Solution: Manual Sync**
```sql
-- Queue them for sync
INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
SELECT 
  id as user_id,
  email,
  'contact_add' as event_type,
  jsonb_build_object(
    'list_name', 'REG',
    'list_id', '6',
    'contact', jsonb_build_object(
      'email', email,
      'name', '',
      'custom_fields', '{}'::jsonb
    ),
    'tags', '["MAGIC_LINK_SENT"]'::jsonb
  ) as payload
FROM auth.users
WHERE email IN ('test-final@gmail.com', 'jana.hartm1@seznam.cz', 'kvetinka.j@seznam.comcu');

-- Wait 3 minutes, verify synced
```

---

### **Issue #5: Tags Not Applied**

**Symptoms:**
Contact in Ecomail, but no tags visible.

**Diagnosis:**
```sql
-- 1. Were tags queued?
SELECT * FROM ecomail_sync_queue 
WHERE email = 'user@example.com' 
AND (
  event_type = 'tag_add' 
  OR payload->'tags' IS NOT NULL
);

-- 2. Check payload of contact_add
SELECT payload->'tags' FROM ecomail_sync_queue
WHERE email = 'user@example.com' AND event_type = 'contact_add';
```

**Common Causes:**
- ✅ Tags sent in `contact_add` payload (correct approach)
- ❌ Tags sent as separate `tag_add` (inefficient)
- ❌ Tag name mismatch (case-sensitive!)
- ❌ Tag doesn't exist in Ecomail dashboard

**Solution:**
```
1. Verify tag exists in Ecomail:
   Settings → Tags → Search for tag name
   
2. If missing: Create tag in dashboard first

3. Re-send contact with tags:
   (Use manual sync query from Issue #4)
```

---

### **Issue #6: Edge Function Errors**

**Where to Look:**
```
Supabase Dashboard → Edge Functions → sync-to-ecomail → Logs
Filter: "error" or "failed"
```

**Common Errors:**

**A) "ECOMAIL_API_KEY not configured"**
```bash
# Fix: Set secret
supabase secrets set ECOMAIL_API_KEY="f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59"

# Verify
supabase secrets list
```

**B) "Failed to add contact: ..."**
```
Check API response in logs
Common causes:
- Invalid email format
- Missing required fields
- List ID doesn't exist
- API rate limit
```

**C) "relation ecomail_sync_queue does not exist"**
```
Tables not created!
Fix: Run SQL from archive/ECOMAIL_DB_SETUP.md in Supabase SQL Editor
```

---

## 🔍 DEBUG QUERIES (Copy-Paste Ready)

### **Full Queue Analysis**
```sql
SELECT 
  event_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest,
  AVG(retry_count) as avg_retries
FROM ecomail_sync_queue
GROUP BY event_type, status
ORDER BY count DESC;
```

### **Recent Activity (Last Hour)**
```sql
SELECT 
  id,
  email,
  event_type,
  status,
  created_at,
  processed_at,
  EXTRACT(EPOCH FROM (processed_at - created_at)) as processing_seconds
FROM ecomail_sync_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 20;
```

### **Failed Syncs Detail**
```sql
SELECT 
  email,
  event_type,
  last_error,
  retry_count,
  created_at
FROM ecomail_sync_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### **Dead Letter Queue**
```sql
SELECT 
  email,
  event_type,
  error_message,
  failed_at,
  requires_manual_review
FROM ecomail_failed_syncs
ORDER BY failed_at DESC;
```

---

## 🛠️ MANUAL OPERATIONS

### **Re-sync Single User**
```sql
-- Force re-sync for specific user
INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
SELECT 
  au.id,
  au.email,
  'contact_add',
  jsonb_build_object(
    'list_name', 'REG',
    'list_id', '6',
    'contact', jsonb_build_object(
      'email', au.email,
      'custom_fields', p.metadata || jsonb_build_object('KP_VALUE', p.metadata->'kp_value')
    ),
    'tags', ARRAY['MAGIC_LINK_SENT', 'MAGIC_LINK_CLICKED']::jsonb
  )
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'user@example.com';
```

### **Bulk Re-sync All Users**
```sql
-- ⚠️ Use with caution! Creates 231 queue items.
INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
SELECT 
  au.id,
  au.email,
  'contact_add',
  jsonb_build_object(
    'list_name', 'REG',
    'list_id', '6',
    'contact', jsonb_build_object('email', au.email)
  )
FROM auth.users au;

-- Will process over ~23 minutes (231 items, 50/run, every 3 min)
```

### **Manually Trigger Edge Function**
```bash
# Bypass CRON, run immediately
curl -X POST https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4Njk3OTgsImV4cCI6MjA1MjQ0NTc5OH0.aMqEJlh6Yg8TrUJLEVH7EgqO5gLN8TRgmJzEHbNZcl8" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔄 RECOVERY PROCEDURES

### **Scenario: CRON Stopped Working**

**Symptoms:** Queue filling up, last sync >10 minutes ago.

**Fix:**
```sql
-- 1. Check current CRON
SELECT * FROM cron.job WHERE jobname LIKE '%ecomail%';

-- 2. If active=false, re-schedule:
SELECT cron.schedule(
  'ecomail-sync-every-3-minutes',
  '*/3 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);

-- 3. Verify
SELECT * FROM cron.job WHERE jobname = 'ecomail-sync-every-3-minutes';
-- Expected: active = true
```

---

### **Scenario: All Syncs Failing**

**Symptoms:** 
```sql
SELECT COUNT(*) FROM ecomail_sync_queue WHERE status = 'failed';
-- Returns: 50+
```

**Diagnosis:**
```sql
-- What's the error?
SELECT last_error, COUNT(*) 
FROM ecomail_sync_queue 
WHERE status = 'failed' 
GROUP BY last_error;
```

**Common Errors:**

**"ECOMAIL_API_KEY not configured"**
```bash
# Fix
supabase secrets set ECOMAIL_API_KEY="f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59"

# Redeploy Edge Function
supabase functions deploy sync-to-ecomail
```

**"Failed to add contact: Unauthorized"**
```
API key expired or invalid.
1. Login to Ecomail dashboard
2. Settings → API → Generate new key
3. Update Supabase secret
4. Redeploy Edge Function
```

**"Network timeout"**
```
Ecomail API down.
1. Check: https://status.ecomailapp.cz/ (if exists)
2. Wait for service restoration
3. Failed items will auto-retry
```

---

### **Scenario: Contact in Wrong List**

**Symptoms:** User in UNREG but should be in REG.

**Fix:**
```sql
-- Queue list move
INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
VALUES (
  'user-uuid',
  'user@example.com',
  'list_move',
  jsonb_build_object(
    'from_list_name', 'UNREG',
    'from_list', '5',
    'to_list_name', 'REG',
    'to_list', '6',
    'tags', ARRAY['MAGIC_LINK_CLICKED']::jsonb
  )
);

-- Wait 3 minutes, verify in Ecomail
```

---

## 📊 MONITORING QUERIES

### **Daily Health Check**
```sql
-- Save as "Ecomail Health Check" in Supabase SQL Editor
SELECT 
  'Pending Items' as metric,
  COUNT(*) FILTER (WHERE status = 'pending') as value,
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'pending') = 0 THEN '✅ OK'
    WHEN COUNT(*) FILTER (WHERE status = 'pending') < 50 THEN '⚠️ Watch'
    ELSE '🚨 Alert'
  END as status
FROM ecomail_sync_queue

UNION ALL

SELECT 
  'Failed Items',
  COUNT(*) FILTER (WHERE status = 'failed'),
  CASE 
    WHEN COUNT(*) FILTER (WHERE status = 'failed') = 0 THEN '✅ OK'
    ELSE '🚨 Alert'
  END
FROM ecomail_sync_queue

UNION ALL

SELECT 
  'Dead Letter Queue',
  COUNT(*),
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ OK'
    ELSE '⚠️ Review'
  END
FROM ecomail_failed_syncs

UNION ALL

SELECT 
  'Last Sync',
  EXTRACT(EPOCH FROM (NOW() - MAX(processed_at)))::INTEGER,
  CASE 
    WHEN MAX(processed_at) > NOW() - INTERVAL '5 minutes' THEN '✅ OK'
    WHEN MAX(processed_at) > NOW() - INTERVAL '10 minutes' THEN '⚠️ Watch'
    ELSE '🚨 Alert'
  END
FROM ecomail_sync_queue;
```

---

## 🆘 EMERGENCY CONTACTS

### **Ecomail Support**
- **Email:** podpora@ecomailapp.cz
- **Telefon:** +420 222 747 552
- **Pracovní doba:** Po-Pá 9:00-17:00

### **Critical Issues Escalation**
```
1. Queue >500 pending → Email tech lead immediately
2. Failed syncs >100 → Investigate blocking issue
3. Ecomail API down >1 hour → Contact Ecomail support
4. Data loss suspected → DO NOT DELETE, escalate
```

---

## 🧪 TESTING SCENARIOS

### **Test 1: End-to-End Registration**
```
1. Open: https://dechbar.cz/vyzva
2. Fill email: test-e2e-{timestamp}@example.com
3. Measure KP: 25s
4. Click "Registrovat zdarma"
5. Wait 30s
6. Check queue:
   SELECT * FROM ecomail_sync_queue 
   WHERE email LIKE 'test-e2e-%'
   ORDER BY created_at DESC;
7. Expected: status='pending' or 'completed'
8. Wait 3 minutes
9. Check Ecomail dashboard → UNREG list
10. Cleanup:
    DELETE FROM challenge_registrations WHERE email LIKE 'test-e2e-%';
    DELETE FROM ecomail_sync_queue WHERE email LIKE 'test-e2e-%';
```

---

### **Test 2: List Movement**
```sql
-- Simulate magic link click (move UNREG → REG)
INSERT INTO ecomail_sync_queue (email, event_type, payload) VALUES (
  'test-move@example.com',
  'list_move',
  '{"from_list_name": "UNREG", "from_list": "5", "to_list_name": "REG", "to_list": "6"}'::jsonb
);

-- Wait 3 minutes
-- Check Ecomail: Should be in REG list, not in UNREG
```

---

## 📚 USEFUL LINKS

- **Ecomail API Docs:** https://ecomailczv2.docs.apiary.io/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **PostgreSQL CRON:** https://github.com/citusdata/pg_cron

---

## ✅ BEFORE YOU ASK FOR HELP

**Run this checklist:**

- [ ] Checked queue health query (pending/failed counts)
- [ ] Checked Edge Function logs (any errors?)
- [ ] Checked CRON jobs active (all true?)
- [ ] Tested Ecomail API manually (curl command)
- [ ] Checked if contact exists in Ecomail dashboard
- [ ] Read this troubleshooting guide
- [ ] Waited at least 3 minutes for sync

**Still stuck?** Contact tech lead with:
1. Screenshots of queries results
2. Edge Function logs (last 20 lines)
3. Specific email address having issue
4. What you tried already

---

**Status:** ✅ Based on real production debugging

*Last updated: 4. února 2026*
