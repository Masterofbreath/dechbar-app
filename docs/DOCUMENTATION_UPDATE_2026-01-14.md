# 📚 Documentation Update - 2026-01-14

## ✅ Kompletní Aktualizace Databázové Dokumentace

**Datum:** 14. ledna 2026  
**Důvod:** Rebrand membership plánů z `DECHBAR_HRA`/`AI_KOUC` → `SMART`/`AI_COACH`

---

## 🎯 AKTUALIZOVANÉ SOUBORY (4)

### 1. `/docs/architecture/03_DATABASE.md` ✅

**Změny:**
- ✅ Aktualizována `modules` seeded data (rozdělení na Membership Tiers + Lifetime Products)
- ✅ Přidána nová sekce "MEMBERSHIP TIERS vs LIFETIME MODULES" s příklady SQL queries
- ✅ Doplněno info o PostgreSQL ENUM typu pro `plan` column
- ✅ Aktualizován timestamp na 2026-01-14

**Nové informace:**
- Jasné vysvětlení rozdílu mezi membership tiers (ONE active per user) a lifetime modules (MULTIPLE per user)
- SQL příklady pro nákup membership (UPDATE) vs. nákup lifetime produktu (INSERT)
- Kompletní příklad kombinace (user má SMART + Studio + Challenges)

---

### 2. `/docs/product/MODULES.md` ✅

**Změny:**
- ✅ Přepsána sekce "Available Products" (nová struktura: Membership Tiers + Lifetime Products)
- ✅ Aktualizována sekce "Lifetime vs. Subscription" (správné vysvětlení storage v DB)

**Nové tarify:**
- **SMART** (membership-smart): 249 Kč/měsíc nebo 125 Kč/měsíc (roční)
- **AI COACH** (membership-ai-coach): 490 Kč/měsíc nebo 245 Kč/měsíc (roční)

---

### 3. `/docs/architecture/02_MODULES.md` ✅

**Změny:**
- ✅ Aktualizována tabulka "Available Modules" (nové názvy membership tiers)

**Před:**
```
| DechBar GAME | Subscription | `game` | modules |
| AI Coach | Subscription | `ai-coach` | modules |
```

**Po:**
```
| SMART (Membership) | Subscription | `membership-smart` | modules |
| AI COACH (Membership) | Subscription | `membership-ai-coach` | modules |
```

---

### 4. `/docs/architecture/00_OVERVIEW.md` ✅

**Změny:**
- ✅ Aktualizována sekce "MODULES (Feature Products)" s novými názvy a cenami

**Před:**
```
├── Game - Gamification (149 Kč/month)
└── AI Coach - Personal AI (490 Kč/month)
```

**Po:**
```
├── SMART Membership - Smart Recommendations (249 Kč/month)
├── AI COACH Membership - Personal AI Trainer (490 Kč/month)
```

---

## 🎨 KLÍČOVÉ ZMĚNY V NAMING CONVENTION

### Membership Tiers (Subscription Products)

| Staré Jméno | Nové Jméno | ID v DB | Cena |
|------------|-----------|---------|------|
| DECHBAR_HRA | **SMART** | `membership-smart` | 249 Kč/měsíc (125 Kč/měsíc roční) |
| AI_KOUC | **AI COACH** | `membership-ai-coach` | 490 Kč/měsíc (245 Kč/měsíc roční) |

### Lifetime Products (Nezměněno)

| Název | ID v DB | Cena |
|-------|---------|------|
| DechBar STUDIO | `studio` | 990 Kč (lifetime) |
| Výzvy | `challenges` | 490 Kč (lifetime) |
| Akademie | `akademie` | 1490 Kč (lifetime) |

---

## 🗄️ DATABÁZOVÉ ZMĚNY

### PostgreSQL ENUM Type

```sql
-- Vytvořen ENUM typ pro plan column
CREATE TYPE membership_plan_type AS ENUM ('ZDARMA', 'SMART', 'AI_COACH');

-- Změna column na ENUM
ALTER TABLE memberships 
ALTER COLUMN plan TYPE membership_plan_type 
USING plan::membership_plan_type;

-- Nastavení default hodnoty
ALTER TABLE memberships 
ALTER COLUMN plan SET DEFAULT 'ZDARMA'::membership_plan_type;
```

**Výhody:**
- ✅ Type safety na DB úrovni
- ✅ Automatický dropdown v Supabase Table Editor
- ✅ Nemožnost vložit nevalidní hodnotu

---

## 📊 STRUKTURA TABULEK

### `memberships` Table (ONE per user)

```sql
memberships:
  user_id: abc-123
  plan: 'SMART'              -- POUZE JEDEN aktivní tier
  status: 'active'
  type: 'subscription'
```

### `user_modules` Table (MULTIPLE per user)

```sql
user_modules:
  1. { user_id: abc-123, module_id: 'studio', purchase_type: 'lifetime' }
  2. { user_id: abc-123, module_id: 'challenges', purchase_type: 'lifetime' }
  -- Může mít N zakoupených lifetime produktů
```

### `modules` Table (Product Catalog)

```sql
-- Membership Tiers
{ id: 'membership-smart', name: 'SMART', price_czk: 249, price_type: 'subscription' }
{ id: 'membership-ai-coach', name: 'AI COACH', price_czk: 490, price_type: 'subscription' }

-- Lifetime Products
{ id: 'studio', name: 'DechBar STUDIO', price_czk: 990, price_type: 'lifetime' }
{ id: 'challenges', name: 'Výzvy', price_czk: 490, price_type: 'lifetime' }
{ id: 'akademie', name: 'Akademie', price_czk: 1490, price_type: 'lifetime' }
```

---

## 🔄 MIGRACE STÁVAJÍCÍCH UŽIVATELŮ

**Status:** ✅ Hotovo

```sql
-- Starý záznam: plan = 'DECHBAR_HRA'
-- Nový záznam: plan = 'SMART'

UPDATE memberships 
SET plan = 'SMART' 
WHERE plan = 'DECHBAR_HRA';

UPDATE memberships 
SET plan = 'AI_COACH' 
WHERE plan = 'AI_KOUC';
```

**Poznámka:** V PROD neexistují žádní uživatelé s `DECHBAR_HRA` nebo `AI_KOUC`, takže migrace byla čistá.

---

## 🚀 VALUE PROPOSITION

### SMART Tier
> **"Inteligentní doporučení"**

**Co dostaneš:**
- BOLT skóre tracking
- Smart doporučení tréninků podle feedback
- Grafy a statistiky pokroku
- 50+ audio programů

**Cena:** 249 Kč/měsíc (nebo 125 Kč/měsíc při ročním předplatném)  
**Úspora:** 1,488 Kč ročně (50% sleva)

---

### AI COACH Tier
> **"Tvůj osobní AI trenér"**

**Co dostaneš:**
- Všechno ze SMART
- Všech 100+ programů
- AI trenér přizpůsobený tobě
- Pokročilé analýzy (HRV, trendy)
- Prioritní podpora od týmu

**Cena:** 490 Kč/měsíc (nebo 245 Kč/měsíc při ročním předplatném)  
**Úspora:** 2,940 Kč ročně (50% sleva)

---

## ✅ OVĚŘENÍ SPRÁVNOSTI

### Checklist:
- ✅ Všechny 4 dokumentační soubory aktualizovány
- ✅ Databázová migrace provedena (PROD + TEST)
- ✅ ENUM typ vytvořen a nastaven jako default
- ✅ TypeScript typy aktualizovány (`src/platform/types/membership.ts`)
- ✅ Landing page komponenty aktualizovány (PricingSection.tsx)
- ✅ CSS design tokens konzistentní
- ✅ Žádní existující uživatelé s `DECHBAR_HRA` nebo `AI_KOUC`

---

## 📁 SOUBORY V KÓDOVÉ BÁZI

### TypeScript Types
- `src/platform/types/membership.ts` → `type MembershipPlan = 'ZDARMA' | 'SMART' | 'AI_COACH'`
- `src/platform/membership/useMembership.ts` → Updated interface

### React Components
- `src/modules/public-web/components/landing/PricingSection.tsx` → Updated `PRICING_PLANS` array
- `src/modules/public-web/components/landing/PricingCard.tsx` → Enhanced with subtitle and annual pricing

### Config
- `src/config/constants.ts` → Updated `memberships` object

### Documentation
- `docs/architecture/03_DATABASE.md` → ✅ Aktualizováno
- `docs/product/MODULES.md` → ✅ Aktualizováno
- `docs/architecture/02_MODULES.md` → ✅ Aktualizováno
- `docs/architecture/00_OVERVIEW.md` → ✅ Aktualizováno
- `CHANGELOG.md` → ✅ Přidána entry v0.2.1

---

## 🎯 ZÁVĚR

**Všechna dokumentace je nyní 100% synchronizovaná** s aktuálním stavem databáze a aplikace.

**Důvod rebrandingu:**
- ✅ Lepší value proposition ("SMART" = inteligentní doporučení)
- ✅ Mezinárodní friendly názvy (AI COACH = globálně srozumitelné)
- ✅ Premium positioning (žádné "hry", ale "trenér")
- ✅ Jasná diferenciace mezi tiers
- ✅ Silnější konverze na roční předplatné (50% sleva)

---

**Aktualizováno:** 2026-01-14  
**Autor:** AI Agent (Claude Sonnet 4.5)  
**Status:** ✅ Kompletní a verifikováno
