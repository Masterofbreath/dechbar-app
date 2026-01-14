# 🗄️ Database Migration: Billing Interval & Pricing JSONB

**Date:** 2026-01-14  
**Author:** DechBar Team  
**Status:** Ready for Production

---

## 📋 OVERVIEW

Tato migrace přidává podporu pro:
- ✅ **Monthly vs Annual billing** (billing_interval column)
- ✅ **Dynamic pricing** (pricing JSONB column v modules)
- ✅ **Brand colors** (color column v modules s barvami z Visual Brand Book)
- ✅ **Display ordering** (sort_order column pro landing page)

---

## 🎯 CÍLE MIGRACE

### 1. Membership Tiers - Billing Interval
**Problem:** Nemohli jsme rozlišit, zda uživatel platí monthly (249 Kč) nebo annual (125 Kč/měsíc).

**Solution:** Přidán `billing_interval` column (ENUM: 'monthly', 'annual').

### 2. Modules - Dynamic Pricing
**Problem:** `price_czk` column je jednoduchý INT - nemůže ukládat monthly + annual ceny najednou.

**Solution:** Přidán `pricing` JSONB column:

```json
{
  "monthly": {
    "amount": 249,
    "currency": "CZK",
    "stripe_price_id": "price_smart_monthly_czk"
  },
  "annual": {
    "amount": 1499,
    "per_month": 125,
    "savings": 1488,
    "stripe_price_id": "price_smart_annual_czk"
  }
}
```

### 3. Brand Colors
**Problem:** `color` column v modules obsahoval špatné barvy (#F8CA00, #00BFA5).

**Solution:** Aktualizovány podle Visual Brand Book 2.0:
- **SMART:** `#2CBEC6` (PRIMARY TEAL)
- **AI COACH:** `#D6A23A` (ACCENT GOLD)
- **Studio:** `#6ADBE0` (LIGHT TEAL)
- **Challenges:** `#F0C76A` (LIGHT GOLD)
- **Akademie:** `#15939A` (DARK TEAL)

---

## 📦 ZMĚNY V DB SCHÉMATU

### Tabulka `memberships`

**Nové columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `billing_interval` | `billing_interval_type` (ENUM) | NULL | 'monthly' nebo 'annual' (NULL pro ZDARMA) |
| `stripe_price_id` | TEXT | NULL | Konkrétní Stripe Price ID (obsahuje interval info) |
| `cancelled_at` | TIMESTAMPTZ | NULL | Kdy bylo předplatné zrušeno |

**Constraints:**
```sql
CHECK (
  (type = 'subscription' AND billing_interval IS NOT NULL AND plan IN ('SMART', 'AI_COACH'))
  OR 
  (type = 'lifetime' AND plan = 'ZDARMA')
)
```

---

### Tabulka `modules`

**Nové columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `pricing` | JSONB | NULL | JSONB object s monthly/annual/lifetime pricing |
| `color` | TEXT | NULL | Brand color (HEX format) |
| `sort_order` | INTEGER | DEFAULT 999 | Display order (lower = first) |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Auto-updated via trigger |

---

## 🎨 BRAND COLORS (Visual Brand Book 2.0)

| Module | Color | Name | Theme |
|--------|-------|------|-------|
| membership-smart | **#2CBEC6** | PRIMARY TEAL | Brand identity, breathing |
| membership-ai-coach | **#D6A23A** | ACCENT GOLD | Premium, achievement |
| studio | **#6ADBE0** | LIGHT TEAL | Lighter variant |
| challenges | **#F0C76A** | LIGHT GOLD | Achievement theme |
| akademie | **#15939A** | DARK TEAL | Education theme |

**Visual Brand Book Reference:** `/docs/brand/VISUAL_BRAND_BOOK.md`

---

## 🚀 JAK SPUSTIT MIGRACI

### PROD DATABASE (Supabase Dashboard)

1. **Připrav se:**
   ```bash
   # Zkopíruj SQL script do clipboardu
   cat 20260114_add_billing_interval_and_pricing.sql
   ```

2. **Otevři Supabase SQL Editor:**
   - URL: https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
   - Navigate: SQL Editor → New Query

3. **Vlož SQL script:**
   - Paste celý obsah souboru
   - Zkontroluj, že jsi v **PROD projektu** (iqyahebbteiwzwyrtmns)

4. **Spusť migraci:**
   - Klikni na **Run** (Ctrl/Cmd + Enter)
   - Čekej na dokončení (~10-30 sekund)

5. **Ověř výsledek:**
   ```sql
   -- Verify modules
   SELECT id, name, color, sort_order, pricing FROM modules ORDER BY sort_order;
   
   -- Verify memberships (měl by být jen 1 řádek s ZDARMA)
   SELECT * FROM memberships;
   ```

---

### DEV DATABASE (Local Supabase CLI)

**POZNÁMKA:** Pokud používáš pouze cloud Supabase (bez lokální instance), postupuj stejně jako u PROD, ale v DEV projektu.

#### Varianta A: Cloud Supabase (DEV projekt)
1. Přepni na DEV projekt v Supabase Dashboard
2. Postupuj stejně jako u PROD výše

#### Varianta B: Lokální Supabase CLI (pokud máš)
```bash
# Navigate to project
cd /Users/DechBar/dechbar-app

# Link to DEV project (if not already linked)
supabase link --project-ref <DEV_PROJECT_REF>

# Apply migration
supabase db push

# Verify
supabase db diff
```

---

## ✅ VERIFICATION CHECKLIST

Po aplikaci migrace ověř:

### 1. Tabulka `modules`

```sql
SELECT 
  id,
  name,
  color,
  sort_order,
  pricing->'monthly'->>'amount' AS monthly_price,
  pricing->'annual'->>'amount' AS annual_price,
  pricing->'lifetime'->>'amount' AS lifetime_price
FROM modules
WHERE is_active = true
ORDER BY sort_order;
```

**Expected output:**

| id | name | color | sort_order | monthly | annual | lifetime |
|----|------|-------|------------|---------|--------|----------|
| membership-smart | SMART | #2CBEC6 | 1 | 249 | 1499 | null |
| membership-ai-coach | AI COACH | #D6A23A | 2 | 490 | 2940 | null |
| studio | DechBar STUDIO | #6ADBE0 | 3 | null | null | 990 |
| challenges | Výzvy | #F0C76A | 4 | null | null | 490 |
| akademie | Akademie | #15939A | 5 | null | null | 1490 |

---

### 2. Tabulka `memberships`

```sql
SELECT 
  plan,
  billing_interval,
  status,
  type
FROM memberships
WHERE status = 'active';
```

**Expected output:**
- Pravděpodobně jen 1 řádek: `ZDARMA, NULL, active, lifetime`
- (Pokud existují subscription users, měli by mít `monthly` nebo `annual`)

---

### 3. Indexes

```sql
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename IN ('memberships', 'modules')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected indexes:**
- `idx_memberships_billing_interval`
- `idx_memberships_stripe_price`
- `idx_modules_pricing`
- `idx_modules_sort_order`

---

### 4. Constraints

```sql
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'memberships'::regclass
  AND conname LIKE 'check_%';
```

**Expected constraints:**
- `check_subscription_has_interval`

---

## 🔄 ROLLBACK (Pokud by bylo třeba)

**⚠️ POZOR:** Rollback smaže nové columns a data! Použij pouze v nouzové situaci.

```sql
-- 1. Drop constraints
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS check_subscription_has_interval;

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_memberships_billing_interval;
DROP INDEX IF EXISTS idx_memberships_stripe_price;
DROP INDEX IF EXISTS idx_modules_pricing;
DROP INDEX IF EXISTS idx_modules_sort_order;

-- 3. Drop triggers
DROP TRIGGER IF EXISTS update_memberships_updated_at ON memberships;
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;

-- 4. Drop columns
ALTER TABLE memberships 
  DROP COLUMN IF EXISTS billing_interval,
  DROP COLUMN IF EXISTS stripe_price_id,
  DROP COLUMN IF EXISTS cancelled_at;

ALTER TABLE modules
  DROP COLUMN IF EXISTS pricing,
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS sort_order,
  DROP COLUMN IF EXISTS updated_at;

-- 5. Drop ENUM type
DROP TYPE IF EXISTS billing_interval_type;

-- 6. Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
```

---

## 📊 IMPACT ANALYSIS

### Performance Impact
- ✅ **Minimal** - přidané indexes zlepší queries
- ✅ **JSONB queries** jsou rychlé díky GIN indexu
- ✅ **No breaking changes** - existing data untouched (price_czk stále existuje)

### Data Impact
- ✅ **Non-destructive** - žádná data se nemažou
- ✅ **Backward compatible** - starý `price_czk` column zůstává
- ✅ **Safe migration** - `IF NOT EXISTS` checks všude

### User Impact
- ✅ **Zero downtime** - migrace běží za chodu
- ✅ **No user action** - transparent upgrade
- ✅ **Existing users** - jejich data se nemění

---

## 🔗 SOUVISEJÍCÍ DOKUMENTACE

- **Database Schema:** `/dechbar-app/docs/architecture/03_DATABASE.md`
- **Visual Brand Book:** `/dechbar-app/docs/brand/VISUAL_BRAND_BOOK.md`
- **Brand Colors:** `/dechbar-app/docs/brand/BRAND_COLORS.md`
- **Product Modules:** `/dechbar-app/docs/product/MODULES.md`

---

## 📝 POZNÁMKY

### Stripe Integration (Pro budoucnost)
- `stripe_price_id` hodnoty (`price_smart_monthly_czk` apod.) jsou placeholders
- Aktualizuj je reálnými Stripe Price IDs po nastavení Stripe accountu
- Webhook handler použije tyto IDs k identifikaci plánu

### Migrace dat
- Pokud už máš aktivní subscription users, jejich `billing_interval` se nastaví na `monthly` (default)
- Můžeš je později manuálně změnit na `annual` podle potřeby

### Testing
- Otestuj na DEV před PROD!
- Zkontroluj landing page - měla by načítat pricing z DB
- Ověř, že barvy odpovídají Visual Brand Booku

---

## ✅ POST-MIGRATION TASKS

Po úspěšné migraci:

1. [ ] Aktualizuj TypeScript types (`src/platform/types/membership.ts`)
2. [ ] Implementuj React hooks (`usePricing`, `useMembership`)
3. [ ] Aktualizuj landing page komponenty (načítat pricing z DB)
4. [ ] Vytvoř Stripe Products & Prices v Stripe Dashboard
5. [ ] Aktualizuj `stripe_price_id` v modules table s reálnými IDs
6. [ ] Implementuj Stripe webhook handler
7. [ ] Otestuj celý checkout flow (monthly + annual)

---

**Připraven na produkci!** 🚀

*Last updated: 2026-01-14*
