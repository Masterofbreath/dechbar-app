# 💳 Stripe — Kompletní průvodce pro DechBar App

> **Pro AI agenty:** Přečti celý dokument před prací se Stripe. 
> Obsahuje vše co potřebuješ — od vytvoření produktu po testování.

---

## 📋 Přehled

DechBar App používá Stripe pro:
- **Jednorázové platby** — produkty jako "Digitální ticho" (990 Kč)
- **Subscriptions** — plánované (SMART, AI COACH membership)
- **Embedded Checkout** — Stripe formulář přímo v modalu, ne přesměrování

### Klíčový flow

```
Uživatel klikne "Koupit"
  → EmailInputModal (pro hosty — zachycení emailu pro remarketing)
  → Edge Function create-checkout-session
  → Stripe vytvoří Checkout Session → vrátí clientSecret
  → PaymentModal s EmbeddedCheckout
  → Po platbě: Stripe → Webhook → stripe-webhooks Edge Function
  → uloží do user_modules, pošle magic link, přidá do Ecomail
```

---

## 🔑 API Klíče

### Kde najít klíče

Stripe CLI (pokud je přihlášen):
```bash
stripe config --list
```

Stripe Dashboard: https://dashboard.stripe.com/apikeys

### TEST vs LIVE

| | TEST | LIVE |
|---|---|---|
| Publishable Key | `pk_test_51S3eJ5...` | `pk_live_51S3eJ5...` |
| Secret Key | `sk_test_51S3eJ5...` | `sk_live_51S3eJ5...` |
| Platby | Falešné (testovací karty) | Skutečné peníze |
| Kde | `localhost`, DEV Supabase | PROD Supabase, dechbar.cz |

### Konfigurace v projektu

**`.env.local`** (localhost + DEV):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51S3eJ5...
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_1T2asNK...  # TEST price
```

**`.env.production`** (Vercel + PROD):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51S3eJ5...
VITE_STRIPE_PRICE_DIGITALNI_TICHO=price_1T2SBJK...  # LIVE price
```

**DEV Supabase secrets:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # pro stripe listen
```

**PROD Supabase secrets:**
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # pro live webhook endpoint
```

---

## 📦 Produkty a ceny

### Aktuální produkty

| Produkt | LIVE Price ID | TEST Price ID | Cena |
|---|---|---|---|
| Program REŽIM - Digitální ticho | `price_1T2SBJK0OYr7u1q9HkiaSKYY` | `price_1T2asNK0OYr7u1q9VEmHDEme` | 990 Kč |
| Série: Příběh | _(zatím neaktivní)_ | — | 390 Kč |
| Série: Vedení | _(zatím neaktivní)_ | — | 390 Kč |
| Série: Ticho | _(zatím neaktivní)_ | — | 390 Kč |

### Jak vytvořit nový produkt (pomocí Stripe CLI)

```bash
# 1. Vytvořit produkt
stripe products create \
  --name "Název produktu" \
  --description "Popis produktu" \
  --api-key sk_test_...   # nebo sk_live_... pro LIVE

# Výstup obsahuje: "id": "prod_XXXXX"

# 2. Vytvořit cenu (990 Kč = 99000 haléřů)
stripe prices create \
  --product prod_XXXXX \
  --unit-amount 99000 \
  --currency czk \
  --api-key sk_test_...

# Výstup obsahuje: "id": "price_XXXXX"
```

**Předplatné (recurring):** místo jednorázové ceny přidej parametr:
```bash
-d "recurring[interval]=month"   # měsíční
# nebo
-d "recurring[interval]=year"    # roční
```
Příklad: SMART 249 Kč/měsíc → `--unit-amount 24900` + `-d "recurring[interval]=month"`.

Podrobný přehled modulů, cen a nastavení Stripe (subscription, Výzvy 290 Kč, Akademie): **[STRIPE_MODULES_NASTAVENI.md](./STRIPE_MODULES_NASTAVENI.md)**.

Po vytvoření:
1. Ulož Price ID do `.env.local` (TEST) nebo `.env.production` (LIVE)
2. V DB `modules` nastav `stripe_price_id` (sloupec podle skutečné schématu; u nás je identifikátor `id`, ne `slug`)

### Jak aktualizovat cenu produktu v DB

```sql
-- V nové migraci (modules se identifikují sloupcem id):
UPDATE public.modules
SET stripe_price_id = 'price_NEW_ID_HERE'
WHERE id = 'digitalni-ticho';
```

---

## 🔌 Edge Functions

### `create-checkout-session`

**URL:** `https://[PROJECT_REF].supabase.co/functions/v1/create-checkout-session`

**Metoda:** POST (bez JWT verifikace — povoleno pro hosty)

**Body:**
```json
{
  "priceId": "price_1T2asNK...",
  "moduleId": "digitalni-ticho",
  "uiMode": "embedded",
  "email": "user@example.com",
  "successUrl": "https://dechbar.cz/digitalni-ticho/dekujeme",
  "cancelUrl": "https://dechbar.cz/digitalni-ticho"
}
```

**Response:**
```json
{
  "clientSecret": "cs_test_...",
  "session_id": "cs_test_..."
}
```

### `stripe-webhooks`

**Zpracovává tyto eventy:**
- `checkout.session.completed` — po úspěšné platbě:
  1. Vytvoří/najde uživatele (nebo guest záznam)
  2. Uloží do `user_modules` (zpřístupní produkt)
  3. Pošle magic link emailem (pro nové uživatele)
  4. Přidá `product_purchased` event do `ecomail_sync_queue`

---

## 🪝 Webhooks

### PROD webhook endpoint

V Stripe Dashboardu → Developers → Webhooks:
- Endpoint: `https://iqyahebbteiwzwyrtmns.supabase.co/functions/v1/stripe-webhooks`
- Events: `checkout.session.completed`, `payment_intent.succeeded`

### DEV / Localhost

Pro testování na localhostu používáme `stripe listen` — forwarduje eventy na DEV Supabase:

```bash
# Stripe TEST klíč najdeš příkazem: stripe config --list
stripe listen \
  --forward-to https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/stripe-webhooks \
  --api-key sk_test_51S3eJ5...   # viz stripe config --list
```

Webhook secret pro `stripe listen` získáš takto:
```bash
stripe listen --print-secret --api-key sk_test_...
# → whsec_xxxx...
# Ulož do DEV Supabase secrets: STRIPE_WEBHOOK_SECRET
```

---

## 🧪 Testování plateb

### Testovací karty

| Karta | Číslo | Chování |
|---|---|---|
| Úspěšná platba | `4242 4242 4242 4242` | Okamžitě projde |
| 3D Secure | `4000 0025 0000 3155` | Vyžaduje autentizaci |
| Zamítnutá | `4000 0000 0000 0002` | Platba zamítnuta |
| Nedostatek prostředků | `4000 0000 0000 9995` | Insufficient funds |

Datum expiraci: libovolné budoucí (např. `12/30`), CVC: libovolné 3 číslice

### Celý testovací flow

```bash
# Terminál 1 — dev server
cd dechbar-app && npm run dev

# Terminál 2 — webhook listener (klíč viz: stripe config --list)
stripe listen \
  --forward-to https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/stripe-webhooks \
  --api-key sk_test_51S3eJ5...
```

1. Otevři `localhost:5173/digitalni-ticho`
2. Klikni "Koupit za 990 Kč"
3. Zadej email (nebo přihlásit se)
4. Vyplň testovací kartu `4242 4242 4242 4242`, libovolné datum + CVC
5. Klikni "Zaplatit"
6. Stripe zavolá webhook → DEV Supabase zpracuje platbu

### Sledování logů

```bash
# Stripe eventy v reálném čase
stripe logs tail --api-key sk_test_...

# Sledovat konkrétní session
stripe checkout sessions retrieve cs_test_XXX --api-key sk_test_...
```

---

## 🛠️ Stripe CLI — Užitečné příkazy

```bash
# Přihlásit se
stripe login

# Stav přihlášení a klíče
stripe config --list

# Vytvořit produkt
stripe products create --name "Název" --api-key sk_test_...

# Vypsat produkty
stripe products list --api-key sk_test_...

# Vypsat ceny
stripe prices list --api-key sk_test_...

# Triggerovat testovací event
stripe trigger checkout.session.completed --api-key sk_test_...

# Zobrazit checkout session
stripe checkout sessions retrieve cs_test_XXX --api-key sk_test_...
```

---

## 🚨 Časté chyby a řešení

| Chyba | Příčina | Řešení |
|---|---|---|
| `400` na create-checkout-session | LIVE price ID + TEST secret key (nebo naopak) | Zkontroluj `.env.local` — musí být TEST klíče s TEST price ID |
| `401` na create-checkout-session | Funkce má `verify_jwt = true` | Redeploy s `--no-verify-jwt` |
| `onComplete handler will never be called` | Chybí `redirect_on_completion: 'if_required'` | Přidat do sessionConfig v Edge Function |
| Apple Pay disabled | Domain není zaregistrovaná v Stripe | Normal na localhostu, na PROD zaregistrovat domain v Stripe |
| Webhook 400/500 | Špatný nebo chybějící `STRIPE_WEBHOOK_SECRET` | Nastavit správný secret v Supabase secrets |

---

## 📝 Přidat nový produkt — checklist

- [ ] Vytvořit produkt ve Stripe CLI (TEST i LIVE)
- [ ] Zapsat Price IDs (TEST → `.env.local`, LIVE → `.env.production`)
- [ ] Zapsat Price ID do `modules.stripe_price_id` přes migraci
- [ ] Přidat `VITE_STRIPE_PRICE_XXXXX` env variable do Vercel (PROD)
- [ ] Otestovat platbu na localhostu s testovací kartou
- [ ] Po schválení: deployovat Edge Function na PROD a otestovat na DEV Vercel deploy
