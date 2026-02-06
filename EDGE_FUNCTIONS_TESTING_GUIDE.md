# 🧪 Edge Functions Testing Guide

## ✅ DEPLOYMENT STATUS

Obě Edge Functions jsou **LIVE** na DEV Supabase:
- ✅ `activate-smart-trial`
- ✅ `deactivate-smart-trial`

**Dashboard:** https://supabase.com/dashboard/project/nrlqzighwaeuxcicuhse/functions

---

## 🧪 TEST 1: Základní funkčnost (bez dat)

Obě funkce vrací správné response při prázdné DB:

```bash
# Activate (očekáváno: 0 activated)
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/activate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'

# Response:
# {"success":true,"activated":0,"failed":0,"results":[],"message":"No eligible users found",...}

# Deactivate (očekáváno: 0 deactivated)
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/deactivate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'

# Response:
# {"success":true,"deactivated":0,"failed":0,"results":[],"message":"No active trial memberships found",...}
```

✅ **Result:** Fungují správně!

---

## 🧪 TEST 2: S testovacími daty

### KROK 1: Vytvoř testovací registraci

**Otevři:** Supabase Dashboard → SQL Editor → **New Query**

**Vlož a spusť:**

```sql
-- Vytvoř fake testovacího uživatele pro challenge
DO $$
DECLARE
  test_user_id UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  
  -- Vlož registraci (pokud neexistuje)
  INSERT INTO challenge_registrations (
    user_id,
    challenge_id,
    magic_link_sent_at,
    magic_link_clicked_at,
    onboarding_completed_at,
    smart_trial_eligible,
    smart_trial_expires_at,
    metadata
  ) VALUES (
    test_user_id,
    'challenge-2026-03',
    '2026-02-15T10:00:00+01:00',
    '2026-02-15T10:05:00+01:00',
    '2026-02-15T10:10:00+01:00',
    true,
    '2026-03-21T23:59:59+01:00',
    jsonb_build_object(
      'kp_value', 25,
      'source', 'manual-test',
      'name', 'Test User'
    )
  )
  ON CONFLICT (user_id, challenge_id) DO NOTHING;
  
  RAISE NOTICE 'Test user created/exists: %', test_user_id;
  
END $$;

-- Ověř
SELECT * FROM challenge_registrations 
WHERE challenge_id = 'challenge-2026-03';
```

---

### KROK 2: Test aktivace

```bash
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/activate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'
```

**Očekávaný response:**
```json
{
  "success": true,
  "activated": 1,
  "failed": 0,
  "results": [
    {
      "success": true,
      "userId": "a0000000-0000-0000-0000-000000000001"
    }
  ],
  "timestamp": "2026-01-28T..."
}
```

---

### KROK 3: Ověř v DB

```sql
-- Zkontroluj membership
SELECT * FROM memberships 
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Expected:
-- plan: SMART
-- type: trial
-- status: active
-- expires_at: 2026-03-21T23:59:59+01:00

-- Zkontroluj challenge_registrations
SELECT 
  user_id,
  smart_trial_eligible,
  smart_trial_activated_at
FROM challenge_registrations
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Expected:
-- smart_trial_activated_at: NOT NULL (čas aktivace)
```

---

### KROK 4: Test deaktivace

```bash
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/deactivate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'
```

**Očekávaný response:**
```json
{
  "success": true,
  "deactivated": 1,
  "failed": 0,
  "results": [
    {
      "success": true,
      "userId": "a0000000-0000-0000-0000-000000000001",
      "membershipId": "..."
    }
  ],
  "timestamp": "2026-01-28T..."
}
```

---

### KROK 5: Ověř deaktivaci

```sql
-- Zkontroluj membership (mělo by být expired)
SELECT * FROM memberships 
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Expected:
-- status: expired
-- metadata.expired_at: NOT NULL
-- metadata.reason: 'trial-ended'
```

---

## 🧹 CLEANUP (Smazání test dat)

```sql
-- Smaž test membership
DELETE FROM memberships 
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Reset challenge_registrations
UPDATE challenge_registrations 
SET smart_trial_activated_at = NULL
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Nebo smaž úplně
DELETE FROM challenge_registrations 
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';
```

---

## 📊 Monitoring Queries

```sql
-- Kolik eligible users čeká na aktivaci?
SELECT COUNT(*) FROM challenge_registrations
WHERE challenge_id = 'challenge-2026-03'
  AND smart_trial_eligible = true
  AND smart_trial_activated_at IS NULL;

-- Kolik trial memberships je aktivních?
SELECT COUNT(*) FROM memberships
WHERE plan = 'SMART'
  AND type = 'trial'
  AND status = 'active';

-- Detail všech trial memberships
SELECT 
  m.user_id,
  m.plan,
  m.status,
  m.started_at,
  m.expires_at,
  cr.smart_trial_activated_at,
  cr.metadata->>'name' as user_name
FROM memberships m
LEFT JOIN challenge_registrations cr ON cr.user_id = m.user_id
WHERE m.plan = 'SMART' AND m.type = 'trial'
ORDER BY m.created_at DESC;
```

---

## 🔍 Troubleshooting

### Problem: "column does not exist"
- **Příčina:** Chybí `challenge_registrations` table
- **Fix:** Spusť migraci z `supabase/migrations/`

### Problem: "relation does not exist"
- **Příčina:** Chybí `modules` nebo `memberships` table
- **Fix:** Zkontroluj migrační skripty

### Problem: "Failed to fetch eligible users"
- **Příčina:** RLS policy blokuje přístup
- **Fix:** Edge Function používá SERVICE_ROLE_KEY → mělo by fungovat

### Problem: Trial se neaktivuje
- **Debug:**
  1. Zkontroluj Supabase Dashboard → Edge Functions → Logs
  2. Zkontroluj `smart_trial_eligible = true`
  3. Zkontroluj `smart_trial_activated_at IS NULL`

---

## ✅ NEXT STEPS

Až budou funkce otestované na reálných datech:

1. **Vytvoř CRON joby** (viz `CRON_JOBS_SETUP.md`)
2. **Deploy na PROD** (až po kompletním testování!)
3. **Nastav monitoring** (alerts pro failed activations)

---

**Last Updated:** 2026-01-28  
**Status:** ✅ Deployed & Basic Tested  
**Env:** DEV Supabase
