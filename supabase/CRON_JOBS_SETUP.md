# 📅 CRON JOBS - Challenge 2026-03

Automatické joby pro aktivaci/deaktivaci SMART trial během březnové výzvy.

---

## 🎯 TIMELINE

| Datum | Čas | Job | Popis |
|-------|-----|-----|-------|
| **1.3.2026** | 00:00 | `activate-smart-trial` | Aktivuje SMART trial pro všechny eligible users |
| **22.3.2026** | 00:00 | `deactivate-smart-trial` | Deaktivuje všechny trial memberships |

---

## 🚀 SETUP V SUPABASE DASHBOARD

### 1️⃣ Nejprve deployni Edge Functions ✅ HOTOVO!

```bash
# ✅ UŽ DEPLOYED NA DEV
supabase functions deploy activate-smart-trial
supabase functions deploy deactivate-smart-trial
```

---

### 2️⃣ Vytvoř CRON JOB v Supabase Dashboard

**⚠️ KRITICKÉ: pg_cron běží v UTC timezone!**
- 1.3.2026 00:00 CET = **28.2.2026 23:00 UTC**
- 22.3.2026 00:00 CET = **21.3.2026 23:00 UTC**

**Cesta:** Supabase Dashboard → SQL Editor → New Query

**COPY & PASTE tento SQL:**

```sql
-- =====================================================
-- CRON JOBS SETUP - Challenge 2026-03
-- =====================================================

-- Vytvoř extension (pokud neexistuje)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- JOB 1: Aktivace SMART trial (1.3.2026 00:00 CET)
-- =====================================================

SELECT cron.schedule(
  'activate-smart-trial-2026-03',
  '0 23 28 2 *',  -- 28.2. 23:00 UTC = 1.3. 00:00 CET
  $$
  SELECT
    net.http_post(
      url := 'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/activate-smart-trial',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig'
      ),
      body := jsonb_build_object('trigger', 'cron-scheduled')
    ) AS request_id;
  $$
);

-- =====================================================
-- JOB 2: Deaktivace SMART trial (22.3.2026 00:00 CET)
-- =====================================================

SELECT cron.schedule(
  'deactivate-smart-trial-2026-03',
  '0 23 21 3 *',  -- 21.3. 23:00 UTC = 22.3. 00:00 CET
  $$
  SELECT
    net.http_post(
      url := 'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/deactivate-smart-trial',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig'
      ),
      body := jsonb_build_object('trigger', 'cron-scheduled')
    ) AS request_id;
  $$
);

-- =====================================================
-- OVĚŘENÍ
-- =====================================================

-- Zobraz oba joby
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname LIKE '%smart-trial%'
ORDER BY jobname;

-- Expected output:
-- jobname: activate-smart-trial-2026-03, schedule: 0 23 28 2 *, active: true
-- jobname: deactivate-smart-trial-2026-03, schedule: 0 23 21 3 *, active: true
```

**Klikni:** ▶️ **Run**

---

## 🧪 TESTOVÁNÍ (DŮLEŽITÉ!)

### Manuální trigger (v DEV):

```bash
# Test aktivace
curl -X POST \
  'https://YOUR_DEV_SUPABASE_URL/functions/v1/activate-smart-trial' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'

# Test deaktivace
curl -X POST \
  'https://YOUR_DEV_SUPABASE_URL/functions/v1/deactivate-smart-trial' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'
```

### Kontrola výsledků:

```sql
-- Kolik eligible users?
SELECT COUNT(*) FROM challenge_registrations
WHERE challenge_id = 'challenge-2026-03'
  AND smart_trial_eligible = true
  AND smart_trial_activated_at IS NULL;

-- Kolik aktivovaných?
SELECT COUNT(*) FROM memberships
WHERE plan = 'SMART'
  AND type = 'trial'
  AND status = 'active';

-- Detail aktivovaných
SELECT 
  m.user_id,
  m.plan,
  m.status,
  m.started_at,
  m.expires_at,
  cr.smart_trial_activated_at
FROM memberships m
JOIN challenge_registrations cr ON cr.user_id = m.user_id
WHERE m.plan = 'SMART'
  AND m.type = 'trial'
  AND m.status = 'active';
```

---

## 🔄 SPRÁVA CRON JOBS

### Zobrazit všechny joby:
```sql
SELECT * FROM cron.job ORDER BY jobid;
```

### Smazat job (pokud potřebuješ opravit):
```sql
SELECT cron.unschedule('activate-smart-trial-2026-03');
SELECT cron.unschedule('deactivate-smart-trial-2026-03');
```

### Zobrazit historii běhů:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname LIKE '%smart-trial%'
)
ORDER BY start_time DESC
LIMIT 20;
```

---

## ⚠️ DŮLEŽITÉ POZNÁMKY

1. **Timezone:** pg_cron běží v UTC! Pokud chceš 00:00 CET (Prague), nastav cron na **23:00 předchozího dne UTC**.
   - 1.3. 00:00 CET = 28.2. 23:00 UTC → Cron: `0 23 28 2 *`
   - 22.3. 00:00 CET = 21.3. 23:00 UTC → Cron: `0 23 21 3 *`

2. **PROD vs DEV:** Nezapomeň vytvořit joby v obou Supabase projektech!

3. **Monitoring:** Po spuštění zkontroluj `cron.job_run_details` a logy Edge Functions v Supabase Dashboard.

4. **Rollback:** Pokud aktivace selže, můžeš manuálně deaktivovat:
   ```sql
   UPDATE memberships
   SET status = 'expired'
   WHERE plan = 'SMART' AND type = 'trial' AND status = 'active';
   ```

---

## 📞 CO DĚLAT PŘI PROBLÉMECH?

1. **Job neběží?**
   - Zkontroluj `cron.job` → `schedule` (správný cron expression?)
   - Zkontroluj `cron.job_run_details` → error log

2. **Edge Function failuje?**
   - Supabase Dashboard → Edge Functions → Logs
   - Zkontroluj `SUPABASE_SERVICE_ROLE_KEY` v Environment Variables

3. **Users nemají trial?**
   - Zkontroluj `challenge_registrations.smart_trial_eligible`
   - Manuálně spusť Edge Function přes curl (viz testování)

---

**Vytvořeno:** 2026-01-28  
**Autor:** AI Agent  
**Účel:** Automatická aktivace/deaktivace SMART trial pro březnovou výzvu 2026
