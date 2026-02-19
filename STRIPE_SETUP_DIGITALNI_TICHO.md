# Stripe Setup: Digitální Ticho (990 Kč)

**Manuální kroky pro nastavení Stripe platby**

---

## 1. Přihlášení do Stripe Dashboard

**URL:** https://dashboard.stripe.com

**Account:** DechBar (použij production account)

---

## 2. Vytvoření Product

**Navigation:** Products → + Add Product

**Vyplň:**
```
Product name: Digitální ticho
Description: 21denní audio program strukturovaného klidu (REŽIM)
Statement descriptor: DECHBAR TICHO (max 22 znaků - zobrazí se na výpisu)
```

**Metadata (optional):**
```
module_id: digitalni-ticho
category: rezim-audio
duration: 21-days
format: audio
```

---

## 3. Vytvoření Price

**Type:** One-time payment

**Vyplň:**
```
Amount: 990
Currency: CZK (Czech Koruna)
Billing period: One time
```

**Tax behavior:** 
```
Exclusive (cena BEZ DPH - pokud jsi v OSS režimu)
```

**Price ID:**
Po uložení zkopíruj Price ID (začíná `price_`):
```
price_xxxxxxxxxxxxxxxxxxxxx
```

---

## 4. Přidání Price ID do .env.local

**Soubor:** `/Users/DechBar/dechbar-app/.env.local`

**Přidej řádek:**
```bash
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_xxxxxxxxxxxxxxxxxxxxx
```

**IMPORTANT:** Never commit `.env.local` to Git!

---

## 5. Test Mode vs. Production Mode

### Test Mode (development)

**Stripe Dashboard:** Toggle na "Test mode" (vlevo nahoře)

**Test Card:**
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (např. 12/28)
CVC: Any 3 digits (např. 123)
ZIP: Any 5 digits (např. 12345)
```

**Test Apple Pay:**
- Ve Safari na macOS/iOS
- Apple Pay se objeví automaticky
- V test mode funguje bez platby

### Production Mode (live)

**Stripe Dashboard:** Toggle na "Production" (vlevo nahoře)

**Live Payment Methods:**
- Real cards (Visa, Mastercard, Amex)
- Apple Pay (iOS, macOS Safari)
- Google Pay (Chrome, Android)

---

## 6. Webhook Setup (CRITICAL!)

**Navigation:** Developers → Webhooks → + Add endpoint

**Endpoint URL:**
```
https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhooks
```

**Events to listen:**
```
✅ payment_intent.succeeded
✅ payment_intent.payment_failed
✅ checkout.session.completed
```

**Webhook signing secret:**
Po vytvoření zkopíruj `whsec_xxxxx` a přidej do Supabase secrets:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 7. Testing Checkout Flow

### Local Development

1. **Start dev server:**
   ```bash
   cd /Users/DechBar/dechbar-app
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:5173/digitalni-ticho
   ```

3. **Click CTA:** "Odemkni program →"

4. **Stripe modal should open** (dark mode styled)

5. **Fill test card:** `4242 4242 4242 4242`

6. **Complete payment**

7. **Should redirect to:** `/digitalni-ticho/dekujeme`

### Production Testing

**PŘED nasazením na PROD:**
- [ ] Otestuj na PREVIEW (test branch Vercel deploy)
- [ ] Zkontroluj Stripe webhooks fungují
- [ ] Verify success page redirect
- [ ] Test Apple Pay (iOS Safari)
- [ ] Test Google Pay (Chrome)

---

## 8. Troubleshooting

### Checkout session fails to create

**Error:** "No client secret returned"

**Možné příčiny:**
1. Price ID není nastaven v `.env.local`
2. Stripe API keys nejsou platné
3. Edge Function `create-checkout-session` není deployed

**Fix:**
```bash
# Check .env.local
cat .env.local | grep STRIPE

# Check Supabase Edge Functions
cd /Users/DechBar/dechbar-app
supabase functions deploy create-checkout-session
```

### Modal se neotevře

**Možné příčiny:**
1. `clientSecret` je `null`
2. PaymentModal import chybí
3. Stripe.js failed to load

**Fix:**
- Check console (F12)
- Verify PaymentModal import
- Check network tab (Stripe.js loaded?)

### Payment succeeds but no redirect

**Možné příčiny:**
1. Success URL není správná
2. Stripe webhook nedorazil
3. Edge Function error

**Fix:**
- Check Stripe Dashboard → Payments → Event logs
- Check Supabase Edge Functions logs
- Verify success URL: `/digitalni-ticho/dekujeme`

---

## 9. Monitoring & Analytics

### Stripe Dashboard

**Sleduj:**
- Total revenue (daily/weekly)
- Successful payments
- Failed payments (+ důvody)
- Refunds (pokud někdo zruší)

### Google Analytics (optional)

**Events to track:**
```javascript
// CTA click
gtag('event', 'cta_click', {
  page: 'digitalni_ticho',
  location: 'hero'
});

// Checkout started
gtag('event', 'begin_checkout', {
  value: 990,
  currency: 'CZK',
  items: ['digitalni-ticho']
});

// Purchase completed
gtag('event', 'purchase', {
  value: 990,
  currency: 'CZK',
  transaction_id: 'stripe_payment_id'
});
```

---

## 10. Support & Maintenance

### Common User Questions

**"Kdy dostanu přístup?"**
→ V den startu (1.3.2026) na email

**"Můžu zrušit?"**
→ Ano, kdykoliv do startu (1.3.2026)

**"Jak to funguje offline?"**
→ Po startu dostaneš download link (MP3 soubory)

### Customer Support Email Template

```
Subject: Digitální ticho - Potvrzení nákupu

Ahoj!

Děkujeme za nákup programu Digitální ticho.

✅ Tvoje platba 990 Kč byla úspěšná.
📅 Program startuje 1.3.2026.
📧 V den startu ti pošleme přístup na tento e-mail.

Co tě čeká:
- 21 nahrávek (21 × 15 min)
- Tech minimal + Film ambient
- Offline přístup (download)

Příprava:
- Sluchátka (doporučujeme over-ear)
- Tiché místo (15 min bez rušení)
- Hlasitost drž níž (ambient funguje v pozadí)

Otázky? Napiš na podpora@dechbar.cz

Ať to dýchá,
Tým DechBar
```

---

**Last Updated:** 2026-02-17  
**Version:** 1.0
