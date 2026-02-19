# 🗄️ Supabase — Kompletní průvodce pro DechBar App

> **Pro AI agenty:** Přečti celý dokument před první prací se Supabase.

---

## 📋 Přehled projektů

DechBar App používá **2 oddělené Supabase projekty**:

| Prostředí | Project Ref | URL | Kdy |
|---|---|---|---|
| **DEV** | `nrlqzighwaeuxcicuhse` | `https://nrlqzighwaeuxcicuhse.supabase.co` | Lokální vývoj + testování |
| **PROD** | `iqyahebbteiwzwyrtmns` | `https://iqyahebbteiwzwyrtmns.supabase.co` | Živý provoz na dechbar.cz |

**Jak poznat, které prostředí frontend používá:**
- `.env.local` → DEV (`nrlqzighwaeuxcicuhse`)
- `.env.production` → PROD (`iqyahebbteiwzwyrtmns`)
- Vercel používá PROD automaticky

---

## 🔧 Nastavení CLI

```bash
# Instalace
brew install supabase/tap/supabase

# Přihlášení (otevře browser)
supabase login

# Propojení s DEV projektem (spustit v dechbar-app/)
supabase link --project-ref nrlqzighwaeuxcicuhse
```

Propojení je uloženo v `supabase/.temp/project-ref`. Příkazy jako `supabase db push --linked` pak automaticky míří na DEV.

---

## 🗂️ Struktura databáze

### Hlavní tabulky

| Tabulka | Popis |
|---|---|
| `auth.users` | Spravuje Supabase Auth (nelze přímo editovat) |
| `public.profiles` | Rozšířený profil uživatele (jméno, avatar, etc.) |
| `public.user_roles` | Role uživatele (`member`, `admin`, `vip_member`, etc.) |
| `public.memberships` | Typ členství (`ZDARMA`, `SMART`, `AI_COACH`) + Stripe Customer ID |
| `public.modules` | Katalog produktů (programy, série, kurzy) |
| `public.user_modules` | Zakoupené produkty — kdo má co přístupné |
| `public.tracks` | Audio stopy |
| `public.albums` | Skupiny stop (výzvy, kurzy, série) |
| `public.exercises` | Dechová cvičení |
| `public.ecomail_sync_queue` | Fronta eventů pro Ecomail (checkout, registrace, tagy) |
| `public.ecomail_failed_syncs` | Dead letter queue — eventy po max. retry |

### Klíčová schémata pro platby

```sql
-- modules: Katalog produktů
modules (
  id UUID,
  slug TEXT UNIQUE,           -- 'digitalni-ticho', 'serie-pribeh'
  name TEXT,
  price_czk INTEGER,
  stripe_price_id TEXT,       -- 'price_1T2SBJK...' (LIVE) nebo 'price_1T2asN...' (TEST)
  is_active BOOLEAN,
  access_type TEXT            -- 'lifetime', 'subscription'
)

-- user_modules: Zakoupené produkty
user_modules (
  id UUID,
  user_id UUID,               -- NULL pro guest (dokud si nezaregistruje)
  module_id UUID,
  stripe_session_id TEXT,     -- ID Stripe checkout session
  guest_email TEXT,           -- Email hosta při nákupu
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ      -- NULL = lifetime
)
```

---

## 📦 Migrace

### Jak vytvořit migraci

```bash
# Název souboru: supabase/migrations/YYYYMMDDHHMMSS_popis.sql
# Příklad:
touch supabase/migrations/20260219160000_create_ecomail_sync_queue.sql
```

**Konvence pojmenování:**
- Timestamp musí být unikátní — zkontroluj existující soubory!
- Používej popisný název anglicky: `add_stripe_price_id`, `fix_rls_policy`, `create_table`

### Aplikovat migrace na DEV

```bash
cd dechbar-app/
supabase db push --linked          # Aplikuje nové migrace
supabase db push --linked --include-all  # Pokud jsou přeskočené migrace
```

### Aplikovat na PROD

**⚠️ NIKDY neaplikuj migrace na PROD bez předchozího testování na DEV!**

```bash
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.iqyahebbteiwzwyrtmns.supabase.co:5432/postgres"
```

Password najdeš v Supabase Dashboard → PROD projekt → Settings → Database.

### Rollback

Migrace nejde "zrušit" automaticky. Vytvoř novou migraci, která reverts změny:

```sql
-- 20260219999999_rollback_stripe_columns.sql
ALTER TABLE public.modules DROP COLUMN IF EXISTS stripe_price_id;
```

---

## ⚡ Edge Functions

### Nasazené funkce

| Funkce | DEV | PROD | Popis |
|---|---|---|---|
| `create-checkout-session` | ✅ | ✅ | Vytvoří Stripe Checkout Session |
| `stripe-webhooks` | ✅ | ✅ | Zpracovává Stripe webhook eventy |
| `sync-to-ecomail` | ✅ | ✅ | Synchronizuje kontakty do Ecomail |
| `activate-smart-trial` | ✅ | ✅ | Aktivuje zkušební SMART členství |
| `deactivate-smart-trial` | ✅ | ✅ | Deaktivuje zkušební SMART členství |

### Deploy funkce

```bash
# Deploy na DEV
supabase functions deploy create-checkout-session --project-ref nrlqzighwaeuxcicuhse

# Deploy s vypnutou JWT verifikací (pro public checkouty)
supabase functions deploy create-checkout-session --project-ref nrlqzighwaeuxcicuhse --no-verify-jwt

# Deploy na PROD
supabase functions deploy create-checkout-session --project-ref iqyahebbteiwzwyrtmns --no-verify-jwt
```

### Kdy použít `--no-verify-jwt`

Použij pro funkce, které musí fungovat bez přihlášení (guest uživatelé):
- `create-checkout-session` — guest i přihlášení mohou koupit
- Funkce sama si JWT ověří interně přes `supabase.auth.getUser()`

---

## 🔐 Secrets (Environment Variables)

Edge Functions čtou secrets přes `Deno.env.get('KEY')`.

### Nastavit secret

```bash
# Na DEV
supabase secrets set STRIPE_SECRET_KEY="sk_test_..." --project-ref nrlqzighwaeuxcicuhse

# Na PROD
supabase secrets set STRIPE_SECRET_KEY="sk_live_..." --project-ref iqyahebbteiwzwyrtmns

# Více secrets najednou
supabase secrets set KEY1="value1" KEY2="value2" --project-ref nrlqzighwaeuxcicuhse
```

### Aktuální secrets na DEV

| Secret | Hodnota | Popis |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | Stripe TEST secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Webhook secret pro `stripe listen` (localhost) |
| `ECOMAIL_API_KEY` | `***` | API klíč Ecomail |
| `SUPABASE_URL` | `https://nrlqzighwaeuxcicuhse...` | Vlastní URL (nastaveno automaticky) |
| `SUPABASE_ANON_KEY` | `eyJ...` | Anon klíč |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Service role klíč |

### Zobrazit seznam secrets

```bash
supabase secrets list --project-ref nrlqzighwaeuxcicuhse
```

---

## 🔒 Row Level Security (RLS)

Všechny tabulky mají RLS zapnuté. Pravidla:

- `service_role` = plný přístup (Edge Functions)
- `authenticated` = přístup k vlastním datům
- `anon` = omezený přístup (jen nutné operace, např. INSERT do `ecomail_sync_queue`)

### Přidat RLS policy

```sql
-- Přidat do migrace
CREATE POLICY "Popis politiky"
  ON public.nazev_tabulky
  FOR INSERT           -- nebo SELECT, UPDATE, DELETE, ALL
  TO authenticated     -- nebo anon, service_role
  WITH CHECK (
    user_id = auth.uid()  -- podmínka
  );
```

---

## 🧪 Testování lokálně

### Spuštění na localhostu

1. Frontend čte z `.env.local` → DEV Supabase
2. Edge Functions jsou nasazeny na DEV Supabase (ne lokálně)
3. Stripe webhooks je potřeba forwardovat přes `stripe listen`

```bash
# Spustit dev server
npm run dev

# V druhém terminálu — Stripe webhooks na DEV Supabase
# Stripe TEST klíč najdeš v: stripe config --list
stripe listen --forward-to https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/stripe-webhooks \
  --api-key sk_test_51S3eJ5...  # viz stripe config --list
```

---

## 📊 Ecomail Sync Queue

Fronta pro asynchronní synchronizaci do Ecomail.

### Povolené event_type hodnoty

```
user_registered       - Nová registrace
user_upgraded         - Upgrade členství
user_downgraded       - Downgrade členství
challenge_registered  - Registrace do výzvy
product_purchased     - Zakoupení produktu (po Stripe webhook)
checkout_started      - Kliknutí na Koupit (email-first flow)
checkout_completed    - Po dokončení platby
tag_update            - Aktualizace tagů
```

### Vložení eventu z frontendu

```typescript
await supabase.from('ecomail_sync_queue').insert({
  user_id: user?.id ?? null,   // null pro hosta
  email: 'user@example.com',
  event_type: 'checkout_started',
  payload: { module_id: 'digitalni-ticho', price_czk: 990 },
  status: 'pending',
});
```

---

## 🚨 Časté chyby a řešení

| Chyba | Příčina | Řešení |
|---|---|---|
| `duplicate key value violates unique constraint "schema_migrations_pkey"` | Dva soubory se stejným timestamp | Přejmenuj jeden soubor |
| `Found local migration files to be inserted before last migration` | Chybí `--include-all` | `supabase db push --linked --include-all` |
| `401 Unauthorized` na Edge Function | JWT mismatch nebo funkce potřebuje `--no-verify-jwt` | Redeploy s `--no-verify-jwt` |
| `403 Forbidden` na REST API | Chybí RLS policy | Přidej policy pro danou roli |
| `400 Bad Request` s check constraint | Hodnota není v povoleném seznamu | Uprav constraint v nové migraci |
| `Bundle generation timed out` při deploy | Supabase dočasný problém | Počkej a zkus znovu |
