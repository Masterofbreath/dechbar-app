# 🔍 Jak Zkontrolovat Tracking - Quick Guide

**Vytvořeno:** 2026-01-28  
**Účel:** Ověř že Google Analytics a Ecomail tracking fungují

---

## 🎯 METODA 1: Browser DevTools (Nejrychlejší)

### 1. Otevři stránku
```bash
npm run dev
# Open: http://localhost:5173/vyzva
```

### 2. Otevři DevTools (F12)
- Chrome/Edge: F12 nebo Ctrl+Shift+I
- Mac: Cmd+Option+I

### 3. Console Tab
Měl bys vidět:

```javascript
// ✅ SPRÁVNĚ - Tyto zprávy znamenají že tracking funguje:
ecotrack('newTracker', ...)  // Ecomail inicializován
ecotrack('trackPageView')    // Pageview odeslán
```

**Pokud vidíš errory typu "ecotrack is not defined"** → tracking nefunguje ❌

### 4. Network Tab
1. Clear (ikona 🚫)
2. Reload stránku (F5)
3. Filter: "cloudfront" nebo "google"

**Měl bys vidět:**
- ✅ Request na: `d2dpiwfhf3tz0r.cloudfront.net` (Ecomail)
- ✅ Request na: `google-analytics.com/g/collect` (GA)
- Status: `200 OK` nebo `204 No Content`

---

## 🎯 METODA 2: Google Analytics Real-Time

### 1. Login do GA
```
https://analytics.google.com/
Account: DechBar
Property: G-LVJSDXT0L6
```

### 2. Navigate to Real-Time
```
Reports → Real-time → Overview
```

### 3. Test
1. Open: http://localhost:5173/vyzva
2. Reload několikrát (F5)
3. Click na různé stránky

**Měl bys vidět:**
- ✅ Active users: 1 (tvoje session)
- ✅ Page views: zvyšují se při reload
- ✅ Events: page_view

**Pokud nevidíš nic** → GA tracking nefunguje ❌

---

## 🎯 METODA 3: Ecomail Dashboard (Ověření emailu)

### 1. Zaregistruj test email
```
Email: tvuj-real-email@gmail.com
KP: 25 (nebo klidně 0)
Source: hero_cta
```

### 2. Check Database
```sql
-- Open Supabase SQL Editor
SELECT * FROM ecomail_sync_queue 
WHERE email = 'tvuj-email@gmail.com' 
ORDER BY created_at DESC 
LIMIT 1;

-- Měl bys vidět:
-- event_type: 'contact_add'
-- status: 'pending'
-- payload: {...}
```

### 3. Trigger Sync Worker
```bash
# Pokud je deployed:
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/sync-to-ecomail \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Pokud NENÍ deployed:
# Zatím se nic nestane - sync queue jen čeká
```

### 4. Check Email Inbox
- ✅ Měl by přijít email s magic linkem
- Subject: "Potvrzení registrace" (nebo podobně)
- From: noreply@nrlqzighwaeuxcicuhse.supabase.co (Supabase)

**Pokud email nepřišel:**
- Check spam folder
- Check Supabase → Authentication → Logs
- Možná rate limit (Supabase omezuje emaily)

---

## 🎯 METODA 4: Ecomail Tracking (Po deployi)

### 1. Login to Ecomail
```
https://app.ecomailapp.cz/
Account: dechbar
```

### 2. Navigate to Tracking
```
Tracking → Události → Poslední události
```

### 3. Test Page View
1. Open: http://localhost:5173/vyzva
2. Reload několikrát
3. Check Ecomail dashboard

**Měl bys vidět:**
- Event: page_view
- URL: /vyzva
- Timestamp: právě teď

**NOTE:** Ecomail tracking může mít delay 5-10 minut!

---

## ⚠️ COMMON ISSUES

### Issue 1: "ecotrack is not defined"
**Příčina:** Tracking script se nenačetl  
**Fix:** 
1. Check `index.html` - je tam Ecomail script?
2. Check browser console - jsou tam errory?
3. Check Network tab - načetl se `ecmtr-2.4.2.js`?

### Issue 2: GA nevidí traffic
**Příčina:** Ad blocker nebo Consent Mode  
**Fix:**
1. Disable ad blocker (uBlock Origin, AdBlock)
2. Check browser console - jsou tam GA errory?
3. Try incognito mode

### Issue 3: Email nepřišel
**Příčina:** Supabase rate limit nebo spam filter  
**Fix:**
1. Check Supabase → Authentication → Logs
2. Wait 1-2 minuty (může mít delay)
3. Check spam folder
4. Try jiný email (Gmail vs Outlook)

### Issue 4: Sync queue roste, nic se neděje
**Příčina:** Edge Functions nejsou deployed  
**Fix:**
```bash
# Deploy sync worker
supabase functions deploy sync-to-ecomail --project-ref DEV

# Test manually
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-to-ecomail
```

---

## ✅ CHECKLIST - Vše funguje?

- [ ] Console: Vidím `ecotrack(...)` zprávy
- [ ] Network: Vidím requesty na cloudfront + google-analytics
- [ ] GA Real-Time: Vidím svou session (Active users: 1)
- [ ] Email: Přišel mi magic link po registraci
- [ ] Database: Vidím záznam v `ecomail_sync_queue`
- [ ] Ecomail: Vidím page_view events (po 5-10 min)

**Pokud všechno ✅ → Tracking funguje perfektně! 🎉**

---

## 🐛 DEBUGGING PŘÍKAZY

```bash
# 1. Check if tracking scripts loaded
curl -I http://localhost:5173 | grep -i "content-type"

# 2. Check Supabase logs (auth emails)
# Login to Supabase Dashboard → Logs → Authentication

# 3. Check sync queue
# Supabase SQL Editor:
SELECT 
  email, 
  event_type, 
  status, 
  created_at,
  last_error
FROM ecomail_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;

# 4. Check Edge Function logs
# Supabase Dashboard → Edge Functions → sync-to-ecomail → Logs

# 5. Test Ecomail API manually
curl -X GET https://api2.ecomailapp.cz/lists \
  -H "key: f21989cee8af4357bf3859e17a7bbb46b7eca7272050d7711a7afc9a09068c59"
```

---

**Quick Test Summary:**
1. Open `/vyzva` → Check Console for `ecotrack`
2. Register email → Check inbox for magic link
3. Check DB → `SELECT * FROM ecomail_sync_queue`
4. Open GA Real-Time → Should see 1 active user

**Máš problém?** Send screenshot + error message!
