# 🧪 Stripe Testing Guide - DechBar App

**Version:** 1.0  
**Last Updated:** 2026-01-20  
**Author:** DechBar Team

---

## 📋 OVERVIEW

Kompletní guide pro testování Stripe integrace v DechBar App.

---

## 🔑 ENVIRONMENT SETUP

### **1. Vytvoř `.env.local` soubor**

V root složce `/Users/DechBar/dechbar-app/` vytvoř `.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
VITE_SUPABASE_ANON_KEY=tvůj-anon-key

# Stripe (TEST MODE)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S3fAuK7en1dcW6HjYNfiXau...

# App URL (local development)
VITE_APP_URL=http://localhost:5173
```

### **2. Získej Stripe Keys**

1. Otevři **Stripe Dashboard**: https://dashboard.stripe.com
2. Přepni na **Test Mode** (toggle vpravo nahoře)
3. Jdi na **Developers → API keys**
4. Zkopíruj:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...` (používá se v Edge Functions)

---

## 🚀 DEPLOYMENT EDGE FUNCTIONS

### **3. Deploy Supabase Edge Functions**

```bash
# Přejdi do projektu
cd /Users/DechBar/dechbar-app

# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy stripe-webhooks
supabase functions deploy stripe-webhooks
```

### **4. Nastavit Environment Variables v Supabase**

V **Supabase Dashboard → Project Settings → Edge Functions**:

```bash
STRIPE_SECRET_KEY=sk_test_51S3fAuK7en1dcW6HjYNfiXau...
STRIPE_WEBHOOK_SECRET=whsec_... (získáš v kroku 6)
SUPABASE_URL=https://iqyahebbteiwzwyrtmns.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tvůj-service-role-key
VITE_APP_URL=http://localhost:5173
```

---

## 🔗 WEBHOOK SETUP

### **5. Install Stripe CLI (pro lokální testing)**

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

### **6. Forward Webhooks (Local Testing)**

```bash
# Forward webhooks to local Edge Function
stripe listen --forward-to https://iqyahebbteiwzwyrtmns.supabase.co/functions/v1/stripe-webhooks
```

Zkopíruj **webhook signing secret** (začíná `whsec_...`) a přidej do Supabase env variables.

### **7. Register Webhook Endpoint (Production)**

V **Stripe Dashboard → Developers → Webhooks**:

1. Klikni **"Add endpoint"**
2. Endpoint URL: `https://iqyahebbteiwzwyrtmns.supabase.co/functions/v1/stripe-webhooks`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Zkopíruj **Signing secret** → Přidej do Supabase env

---

## 🧪 TESTING CHECKOUT FLOW

### **8. Start Dev Server**

```bash
cd /Users/DechBar/dechbar-app
npm run dev
```

Otevři http://localhost:5173

### **9. Test Stripe Checkout**

1. Naviguj na **Pricing Page** (nebo Landing Page s pricing cards)
2. Klikni na **"Začít měsíčně"** nebo **"Začít ročně"**
3. Měl by se otevřít **Stripe Checkout** page

### **10. Use Test Card Numbers**

V Stripe Checkout použij testovací karty:

**✅ Successful Payment:**
```
Card number: 4242 4242 4242 4242
Expiry: 12/34 (jakékoliv budoucí datum)
CVC: 123 (jakékoliv 3 čísla)
ZIP: 12345
```

**❌ Declined Payment:**
```
Card number: 4000 0000 0000 0002
```

**⏳ Requires Authentication (3D Secure):**
```
Card number: 4000 0027 6000 3184
```

Více testovacích karet: https://stripe.com/docs/testing

---

## ✅ PRICING CARDS UI TESTING CHECKLIST

### **Frontend Components Testing:**

#### **1. Billing Toggle Component**
- [ ] Toggle zobrazuje "Měsíčně" a "Ročně" buttons
- [ ] Kliknutí na button přepne billing interval
- [ ] Gold slider se animuje mezi buttons
- [ ] Na mobile (< 390px) zobrazuje "Měsíc" a "Rok" (zkrácené texty)
- [ ] Discount badge "(-50 %)" je viditelný na desktop
- [ ] Keyboard navigation funguje (Tab, Enter)
- [ ] Active button má dark text na gold background

#### **2. Pricing Cards Layout**
- [ ] Desktop (> 1280px): 3 karty vedle sebe
- [ ] Tablet (768px - 1279px): 2 karty nebo responsive scroll
- [ ] Mobile (< 768px): 1 karta na řádek, vertical stack
- [ ] Glassmorphism background je viditelný
- [ ] Karty mají správné shadows a hover effects
- [ ] SMART karta má gold glow (highlighted)

#### **3. Card Content**
- [ ] Badge "OBLÍBENÉ" (SMART) nebo "PREMIUM" (AI COACH) je v top-right rohu
- [ ] Title + subtitle jsou správně zobrazené
- [ ] Price se mění při přepnutí billing toggle:
  - Monthly: 249 Kč/měsíc (SMART), 490 Kč/měsíc (AI COACH)
  - Annual: 125 Kč/měsíc (SMART), 245 Kč/měsíc (AI COACH)
- [ ] Savings badge je viditelný pouze pro annual billing
- [ ] Features list má gold dot bullets nebo checkmark icons
- [ ] CTA button má správný text a funkci

#### **4. Interactive States**
- [ ] Hover na kartě: Karta se zvedne (translateY), shadow se zvětší
- [ ] Focus na CTA button: Teal outline je viditelný
- [ ] Kliknutí na FREE tier: Otevře auth modal
- [ ] Kliknutí na SMART/AI COACH: Inicializuje Stripe checkout
- [ ] Loading state: Button zobrazuje "Načítání..." během checkout
- [ ] Error state: Error message se zobrazí pod button

#### **5. Responsive Breakpoints**
Test na všech viewport widths:
- [ ] 320px (Narrow Mobile): Vše je čitelné, žádné overflow
- [ ] 375px (iPhone SE)
- [ ] 390px (iPhone 12/13)
- [ ] 768px (iPad Portrait)
- [ ] 1024px (iPad Landscape)
- [ ] 1280px (Desktop)
- [ ] 1920px (Wide Desktop)

#### **6. Accessibility**
- [ ] Keyboard navigation: Tab prochází billing toggle → všechny CTA buttons
- [ ] Screen reader: Aria-labels jsou správně nastavené
- [ ] Focus indicators: Teal ring (2px) je viditelný
- [ ] Color contrast: Text splňuje WCAG AA (4.5:1 min)
- [ ] Reduced motion: Animace jsou vypnuté (prefers-reduced-motion)

---

## ✅ STRIPE CHECKOUT FLOW TESTING

### **Scenario 1: Monthly SMART Subscription**
1. [ ] Přepni billing toggle na "Měsíčně"
2. [ ] Klikni "Začít →" na SMART kartě
3. [ ] Verify: Price ID je `price_1Sra65K7en1dcW6HC63iM7bf`
4. [ ] Verify: Stripe Checkout otevře s cenou 249 Kč/měsíc
5. [ ] Zadej test kartu: 4242 4242 4242 4242
6. [ ] Verify: Redirect na `/checkout/success`
7. [ ] Verify: Membership v DB má `billing_interval: 'monthly'`

### **Scenario 2: Annual SMART Subscription**
1. [ ] Přepni billing toggle na "Ročně"
2. [ ] Verify: Savings badge "Ušetříš 1 494 Kč ročně" je viditelný
3. [ ] Klikni "Začít →" na SMART kartě
4. [ ] Verify: Price ID je `price_1SraHbK7en1dcW6HjYNfiXau`
5. [ ] Verify: Stripe Checkout otevře s cenou 1,500 Kč/rok (125 Kč/měsíc)
6. [ ] Zadej test kartu: 4242 4242 4242 4242
7. [ ] Verify: Redirect na `/checkout/success`
8. [ ] Verify: Membership v DB má `billing_interval: 'annual'`

### **Scenario 3: Monthly AI COACH Subscription**
1. [ ] Přepni billing toggle na "Měsíčně"
2. [ ] Klikni "Získat AI Coache →" na AI COACH kartě
3. [ ] Verify: Price ID je `price_1SraCSK7en1dcW6HFkmAbdIL`
4. [ ] Verify: Stripe Checkout otevře s cenou 490 Kč/měsíc
5. [ ] Zadej test kartu: 4242 4242 4242 4242
6. [ ] Verify: Redirect na `/checkout/success`
7. [ ] Verify: Membership v DB má `plan: 'AI_COACH'`, `billing_interval: 'monthly'`

### **Scenario 4: Annual AI COACH Subscription**
1. [ ] Přepni billing toggle na "Ročně"
2. [ ] Verify: Savings badge "Ušetříš 2 940 Kč ročně" je viditelný
3. [ ] Klikni "Získat AI Coache →" na AI COACH kartě
4. [ ] Verify: Price ID je `price_1SraIaK7en1dcW6HsYyN0Aj9`
5. [ ] Verify: Stripe Checkout otevře s cenou 2,940 Kč/rok (245 Kč/měsíc)
6. [ ] Zadej test kartu: 4242 4242 4242 4242
7. [ ] Verify: Redirect na `/checkout/success`
8. [ ] Verify: Membership v DB má `plan: 'AI_COACH'`, `billing_interval: 'annual'`

### **Scenario 5: Cancelled Checkout**
1. [ ] Klikni na jakékoliv CTA
2. [ ] V Stripe Checkout klikni "← Zpět" nebo zavři okno
3. [ ] Verify: Redirect na `/checkout/cancel`
4. [ ] Verify: Cancel page zobrazuje empathetic message
5. [ ] Verify: "Zpět na ceník →" button funguje
6. [ ] Verify: Žádná platba nebyla provedena v Stripe Dashboard

### **Scenario 6: Declined Card**
1. [ ] Klikni na jakékoliv CTA
2. [ ] Zadej declined test kartu: 4000 0000 0000 0002
3. [ ] Verify: Stripe zobrazí error "Your card was declined"
4. [ ] Verify: User zůstává v Stripe Checkout s možností zkusit jinou kartu
5. [ ] Verify: Žádná platba nebyla provedena

---

## ✅ SUCCESS/CANCEL PAGES TESTING

### **Success Page (`/checkout/success`)**
- [ ] Green success icon s pulse animací je viditelný
- [ ] Title: "Platba byla úspěšná!"
- [ ] "Co dál?" sekce zobrazuje 3 kroky s číslovanými kroužky
- [ ] CTA "Přejít do členské sekce →" naviguje na `/app`
- [ ] CTA "Zpět na úvod" naviguje na `/`
- [ ] Confirmation details zobrazují ✓ checklist
- [ ] Session ID je viditelný (debug info)

### **Cancel Page (`/checkout/cancel`)**
- [ ] Teal info icon (ne warning icon) je viditelný
- [ ] Title: "Platba nebyla dokončena"
- [ ] Empathetic message (ne negativní)
- [ ] CTA "Zpět na ceník →" naviguje na `/#pricing`
- [ ] CTA "Zpět na úvod" naviguje na `/`
- [ ] FAQ sekce zobrazuje 4 otázky a odpovědi
- [ ] Support contact info je viditelný

---

## ✅ DATABASE VERIFICATION

### **After Successful Payment:**

1. ✅ **Check Supabase Database**
   ```sql
   SELECT * FROM memberships WHERE user_id = 'tvůj-user-id';
   ```
   
   Mělo by být:
   - `plan`: 'SMART' nebo 'AI_COACH'
   - `status`: 'active'
   - `billing_interval`: 'monthly' nebo 'annual'
   - `stripe_subscription_id`: 'sub_...'
   - `expires_at`: Datum za 1 měsíc (monthly) nebo 1 rok (annual)

2. ✅ **Check Stripe Dashboard**
   - Jdi na **Payments** → mělo by být "Succeeded"
   - Jdi na **Subscriptions** → mělo by být "Active"

3. ✅ **Check Webhook Logs**
   - V terminálu (pokud používáš `stripe listen`) uvidíš:
     ```
     🔔 Webhook received: checkout.session.completed
     🔔 Webhook received: customer.subscription.created
     ✅ Subscription created: SMART (monthly)
     ```

---

## 🐛 TROUBLESHOOTING

### **Problem: Checkout Session Fails**

**Error:** "Failed to create checkout session"

**Solution:**
1. Check Edge Function logs:
   ```bash
   supabase functions logs create-checkout-session
   ```
2. Verify Stripe keys v `.env.local`
3. Check user is authenticated (logged in)

---

### **Problem: Webhook Not Received**

**Error:** Supabase membership not updated after payment

**Solution:**
1. Check webhook signing secret v Supabase env
2. Verify webhook endpoint URL je správná
3. Check webhook logs:
   ```bash
   supabase functions logs stripe-webhooks
   ```

---

### **Problem: User Redirected to Cancel Page**

**Solution:**
- User klikl "Back" v Stripe Checkout
- Tohle je normální chování
- User může zkusit checkout znovu

---

## 📊 TEST SCENARIOS

### **Scenario 1: Monthly SMART Membership**

```typescript
// Test parameters
priceId: 'price_1Sra65K7en1dcW6HC63iM7bf'
interval: 'monthly'
amount: 249 CZK

// Expected result
- Stripe charges 249 CZK/month
- DB: plan = 'SMART', billing_interval = 'monthly'
- Subscription renews every month
```

### **Scenario 2: Annual AI COACH Membership**

```typescript
// Test parameters
priceId: 'price_1SraIaK7en1dcW6HsYyN0Aj9'
interval: 'annual'
amount: 2,940 CZK

// Expected result
- Stripe charges 2,940 CZK/year (245 Kč/month)
- DB: plan = 'AI_COACH', billing_interval = 'annual'
- Subscription renews every year
- User saves 2,940 Kč (50%)
```

### **Scenario 3: Payment Failure**

```typescript
// Use declined card: 4000 0000 0000 0002

// Expected result
- Payment fails
- User stays on Stripe Checkout with error
- DB: No changes (membership stays ZDARMA)
- Webhook: invoice.payment_failed event
```

### **Scenario 4: Subscription Cancellation**

```typescript
// In Stripe Dashboard → Subscriptions → Cancel

// Expected result
- Webhook: customer.subscription.deleted
- DB: plan = 'ZDARMA', status = 'expired'
- User loses access to premium features
```

---

## 🚀 READY FOR PRODUCTION?

### **Checklist Before Going Live:**

- [ ] Test all 4 scenarios výše
- [ ] Verify webhooks fungují (subscription.created, updated, deleted)
- [ ] Test payment renewal (wait 1 month in test mode)
- [ ] Test failed payment handling
- [ ] Switch to **Live Mode** Stripe keys
- [ ] Update webhook endpoint to production URL
- [ ] Test on production with real bank card (small amount)
- [ ] Monitor first real transactions

---

## 📚 RESOURCES

- **Stripe Testing Docs:** https://stripe.com/docs/testing
- **Test Cards:** https://stripe.com/docs/testing#cards
- **Webhook Events:** https://stripe.com/docs/api/events/types
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

**Happy Testing!** 🧪🚀

*Last updated: 2026-01-20*
