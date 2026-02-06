# 🧪 COMPLETE TESTING GUIDE - Challenge Flow

Kompletní testovací checklist pro celý flow výzvy.

---

## 🎯 PŘEHLED FLOW

```
Landing /vyzva 
  → KP měření 
  → Email submit 
  → Magic link (email) 
  → Onboarding (/onboarding) 
  → Thank you (/dekujeme-za-registraci)
  → Challenge button (DnesPage)
```

---

## ✅ TEST 1: LANDING PAGE + KP MĚŘENÍ

### 1.1 Otevři landing page
```
http://localhost:5173/vyzva
```

**Očekávané:**
- ✅ Hero section s email inputem
- ✅ Interactive mockup (iPhone demo)
- ✅ Žádné errory v konzoli

### 1.2 Klikni na "Změř kontrolní pauzu" v mockupu
**Očekávané:**
- ✅ Otevře se KP měření modal
- ✅ Instrukce "Nadechni se, pak pomalu vydechni..."
- ✅ Časovač se spustí

### 1.3 Změř KP (simuluj)
**Kroky:**
1. Spusť měření
2. Počkej alespoň 15s
3. Ukonči měření

**Očekávané:**
- ✅ Zobrazí se výsledek (např. "25s")
- ✅ Automaticky se otevře Email modal
- ✅ Modal zobrazuje tvé KP (např. "25s")
- ✅ Placeholder "tvuj@email.cz"

---

## ✅ TEST 2: MAGIC LINK REGISTRACE

### 2.1 Zadej email
```
test-challenge-001@example.com
```

**Očekávané:**
- ✅ Tlačítko "Vstoupit do výzvy"
- ✅ Loading state po kliknutí
- ✅ Success message: "Magic link odeslán!"

### 2.2 Zkontroluj konzoli/network
**Dev Tools → Network → Filtr: "sendChallengeMagicLink"**

**Očekávané:**
```json
{
  "success": true,
  "message": "Magic link odeslán! Zkontroluj svůj e-mail."
}
```

### 2.3 Zkontroluj Supabase
**Supabase Dashboard → Table Editor → `challenge_registrations`**

**Očekávané:**
| user_id | challenge_id | magic_link_sent_at | smart_trial_eligible |
|---------|--------------|-------------------|---------------------|
| abc-123 | challenge-2026-03 | 2026-01-28... | true |

### 2.4 Získej magic link URL (DEV workaround)
**Supabase Dashboard → Authentication → Users → [tvůj user] → Metadata**

Nebo manuálně vytvoř:
```
http://localhost:5173/onboarding#access_token=FAKE_TOKEN_FOR_DEV
```

**Pro PROD:** Magic link přijde emailem

---

## ✅ TEST 3: ONBOARDING PAGE

### 3.1 Otevři onboarding URL
```
http://localhost:5173/onboarding
```

**Očekávané:**
- ✅ Nadpis "Vítej ve výzvě! 🎉"
- ✅ Tvoje KP: "25s" (z předchozího měření)
- ✅ Form:
  - Jméno
  - Motivace (6 možností)
  - Heslo
  - Potvrzení hesla

### 3.2 Vyplň onboarding
**Data:**
- Jméno: `Jan Testák`
- Motivace: Zlepšit zdraví, Zvýšit výkon
- Heslo: `test123`
- Potvrzení: `test123`

**Očekávané:**
- ✅ Tlačítko "Dokončit registraci"
- ✅ Loading state po odeslání
- ✅ Redirect na `/dekujeme-za-registraci`

### 3.3 Zkontroluj DB
**Supabase → `challenge_registrations`**

**Očekávané:**
| onboarding_completed_at | metadata |
|------------------------|----------|
| 2026-01-28 12:34:56 | `{"name": "Jan Testák", "motivations": [...]}` |

**Supabase → `profiles`**

**Očekávané:**
| full_name |
|-----------|
| Jan Testák |

---

## ✅ TEST 4: THANK YOU PAGE

### 4.1 Automatický redirect
Po dokončení onboardingu → automatický redirect

**Očekávané URL:**
```
http://localhost:5173/dekujeme-za-registraci
```

**Očekávané:**
- ✅ Nadpis "Jsi registrovaný, Jan! 🎉"
- ✅ Timeline:
  - 26. února 2026 - Otevření aplikace
  - 1. března 2026 - Start výzvy
  - SMART Bonus (pokud registered before 28.2.)
- ✅ Info o emailech (7 dní, 3 dny, 1 den před startem)

### 4.2 Zkontroluj SMART trial eligibility
**SQL v Supabase:**
```sql
SELECT 
  user_id,
  smart_trial_eligible,
  smart_trial_activated_at,
  metadata->>'name' as name
FROM challenge_registrations
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-challenge-001@example.com')
LIMIT 1;
```

**Očekávané:**
| smart_trial_eligible | smart_trial_activated_at |
|---------------------|-------------------------|
| true | NULL (aktivuje se 1.3.) |

---

## ✅ TEST 5: CHALLENGE BUTTON V DNES PAGE

### 5.1 Přihlaš se do aplikace
```
http://localhost:5173/app
```

**Login:** `test-challenge-001@example.com`
**Heslo:** `test123`

### 5.2 Ověř DnesPage
**Očekávané:**
- ✅ Greeting "Ahoj, Jan!"
- ✅ **Challenge Banner** (pokud je mezi 1.3. - 21.3.):
  ```
  🎯 Březnová Dechová Výzva
  Den X z 21
  [Pokračovat ve výzvě]
  ```
- ✅ SMART Exercise Button
- ✅ Doporučené protokoly (RÁNO, RESET, NOC)

### 5.3 Zkontroluj access control
**Dev Tools → Konzole:**
```javascript
// Mělo by být vidět z hooku:
useChallengeAccess() => {
  hasAccess: true,
  accessType: "before_app_launch" | "during_challenge" | "after_challenge",
  loading: false
}
```

---

## ✅ TEST 6: EDGE FUNCTIONS (CRON SIMULATION)

### 6.1 Manuální test aktivace (před 1.3.)
**Terminal:**
```bash
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/activate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'
```

**Očekávané:**
```json
{
  "success": true,
  "activated": 1,
  "failed": 0,
  "results": [
    {
      "success": true,
      "userId": "abc-123"
    }
  ]
}
```

### 6.2 Ověř memberships v DB
**SQL:**
```sql
SELECT 
  user_id,
  plan,
  status,
  type,
  billing_interval,
  purchased_at,
  expires_at,
  metadata->>'is_trial' as is_trial
FROM memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test-challenge-001@example.com')
LIMIT 1;
```

**Očekávané:**
| plan | status | type | is_trial | expires_at |
|------|--------|------|----------|------------|
| SMART | active | subscription | true | 2026-03-21 23:59:59 |

### 6.3 Manuální test deaktivace (po 21.3.)
**Terminal:**
```bash
curl -X POST \
  'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/deactivate-smart-trial' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig" \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"manual-test"}'
```

**Očekávané:**
```json
{
  "success": true,
  "deactivated": 1,
  "failed": 0,
  "results": [
    {
      "success": true,
      "userId": "abc-123",
      "membershipId": "xyz-789"
    }
  ]
}
```

---

## ✅ TEST 7: CRON JOBS

### 7.1 Zkontroluj že joby existují
**SQL:**
```sql
SELECT 
  jobid,
  jobname,
  schedule,
  active
FROM cron.job 
WHERE jobname LIKE '%smart-trial%'
ORDER BY jobname;
```

**Očekávané:**
| jobname | schedule | active |
|---------|----------|--------|
| activate-smart-trial-2026-03 | 0 23 28 2 * | true |
| deactivate-smart-trial-2026-03 | 0 23 21 3 * | true |

### 7.2 Zobraz historii (pokud už běžely)
**SQL:**
```sql
SELECT 
  j.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.status,
  jrd.return_message
FROM cron.job_run_details jrd
JOIN cron.job j ON j.jobid = jrd.jobid
WHERE j.jobname LIKE '%smart-trial%'
ORDER BY jrd.start_time DESC
LIMIT 10;
```

---

## ✅ TEST 8: ERROR HANDLING

### 8.1 Test duplicitní registrace
**Kroky:**
1. Vrať se na `/vyzva`
2. Změř KP znovu
3. Použij **stejný email** jako před tím

**Očekávané:**
- ✅ Error message: "Tento email je už zaregistrovaný"

### 8.2 Test invalid email
**Kroky:**
1. Zadej: `invalid-email`
2. Klikni submit

**Očekávané:**
- ✅ Error message: "Zadej platný e-mail"

### 8.3 Test onboarding bez KP
**Kroky:**
1. Otevři `/onboarding` přímo (bez magic link)

**Očekávané:**
- ✅ Redirect zpět na `/vyzva`

---

## 🎯 QUICK TEST CHECKLIST

- [ ] CRON joby vytvořeny v Supabase
- [ ] Landing page /vyzva načítá
- [ ] KP měření funguje v mockupu
- [ ] Email modal se otevře po KP
- [ ] Magic link se odešle (check DB)
- [ ] Onboarding page funguje
- [ ] Thank you page zobrazuje info
- [ ] Challenge button viditelný v DnesPage (pro registrované)
- [ ] Edge Functions aktivují/deaktivují trialy
- [ ] CRON joby jsou active v DB

---

## 🐛 TROUBLESHOOTING

### Problem: "Magic link hook not defined"
**Fix:** Zkontroluj že `useChallengeMagicLink` je exportován v `@/hooks/useChallenge`

### Problem: "Column 'started_at' doesn't exist"
**Fix:** Edge Function používá `purchased_at`, ne `started_at`

### Problem: "Check constraint violation"
**Fix:** Membership type musí být `'subscription'` s `billing_interval: 'monthly'`

### Problem: CRON job neběží
**Fix:** Zkontroluj timezone (pg_cron běží v UTC!)

---

## 📊 SUCCESS METRICS

Po dokončení všech testů:
- ✅ 0 errors v konzoli
- ✅ 100% SQL scriptů úspěšných
- ✅ Edge Functions vrací success
- ✅ CRON joby active
- ✅ User může dokončit celý flow

---

**Poslední update:** 2026-01-28
**Verze:** 1.0
