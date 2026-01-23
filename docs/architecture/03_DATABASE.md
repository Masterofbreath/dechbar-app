# Database Architecture

**Backend:** Supabase PostgreSQL

---

## 📊 OVERVIEW

DechBar používá **6 core tabulek** pro správu uživatelů, členství, modulů a oprávnění.

```
auth.users (Supabase Auth)
    ↓
profiles ← memberships (členství: ZDARMA, SMART, AI_COACH)
    ↓
    ├─→ user_modules (zakoupené lifetime moduly)
    └─→ user_roles (přiřazené role: member, admin, teacher...)
```

---

## 🗄️ CORE TABLES

### 1. `profiles`

**Účel:** Základní profil uživatele (rozšíření Supabase Auth)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users | ID uživatele |
| `email` | TEXT | NOT NULL, UNIQUE | Email (sync z auth.users) |
| `full_name` | TEXT | | Celé jméno |
| `avatar_url` | TEXT | | URL avatara (Supabase Storage) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Aktualizováno |

**Constraints:**
- PRIMARY KEY (id)
- FOREIGN KEY (id) REFERENCES auth.users ON DELETE CASCADE

**Indexes:**
- `profiles_email_idx` ON `email`

**RLS Policies:**
- Users can view own profile (SELECT)
- Users can update own profile (UPDATE)

---

### 2. `modules`

**Účel:** Definice dostupných modulů (produktů)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | Unikátní ID ('studio', 'challenges', ...) |
| `name` | TEXT | NOT NULL | Název modulu |
| `description` | TEXT | | Popis modulu |
| `price_czk` | INTEGER | | Cena v CZK (null = zdarma) |
| `price_type` | TEXT | NOT NULL, DEFAULT 'lifetime' | 'lifetime' nebo 'subscription' |
| `stripe_price_id` | TEXT | | Stripe Price ID |
| `gopay_product_id` | TEXT | | GoPay Product ID |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Aktivní modul? |
| `features` | JSONB | | JSON pole features |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |

**Seeded Data:**

**Membership Tier Products (subscription):**

| ID | Name | Price | Type | Description |
|----|------|-------|------|-------------|
| `membership-smart` | SMART | 249 Kč/měsíc | subscription | Inteligentní doporučení - kontrolní pauza tracking, smart tréninky, 50+ programů |
| `membership-ai-coach` | AI COACH | 490 Kč/měsíc | subscription | Tvůj osobní AI trenér - AI personalizace, pokročilé analýzy, 100+ programů |

**Lifetime Products:**

| ID | Name | Price | Type | Description |
|----|------|-------|------|-------------|
| `studio` | DechBar STUDIO | 990 Kč | lifetime | Vytvoř si vlastní dechová cvičení |
| `challenges` | Výzvy | 490 Kč | lifetime | 21-denní dechové výzvy |
| `akademie` | Akademie | 1490 Kč | lifetime | Vzdělávací kurzy a lekce |

**Indexes:**
- `modules_price_type_idx` ON `price_type`

**RLS Policies:**
- Anyone can view active modules (SELECT WHERE is_active = true)

---

### 3. `user_modules`

**Účel:** Junction table - které lifetime moduly uživatel vlastní (Many-to-Many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unikátní ID |
| `user_id` | UUID | NOT NULL, FK → auth.users | ID uživatele |
| `module_id` | TEXT | NOT NULL, FK → modules | ID modulu |
| `purchase_type` | TEXT | NOT NULL, DEFAULT 'lifetime' | 'lifetime' nebo 'subscription' |
| `purchased_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Datum nákupu |
| `expires_at` | TIMESTAMPTZ | | Datum expirace (pokud není lifetime) |
| `subscription_status` | TEXT | DEFAULT 'active' | 'active', 'cancelled', 'expired' |
| `stripe_subscription_id` | TEXT | | Stripe subscription ID |
| `gopay_payment_id` | TEXT | | GoPay payment ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |

**Constraints:**
- UNIQUE(user_id, module_id) - uživatel může vlastnit modul jen 1x

**Indexes:**
- `user_modules_user_idx` ON `user_id`
- `user_modules_module_idx` ON `module_id`
- `user_modules_status_idx` ON `subscription_status`

**RLS Policies:**
- Users can view own modules (SELECT)
- Users can insert own modules (INSERT)

---

### 4. `memberships`

**Účel:** Membership plány uživatelů (celá platforma)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unikátní ID |
| `user_id` | UUID | NOT NULL, FK → auth.users | ID uživatele |
| `plan` | TEXT | NOT NULL, DEFAULT 'ZDARMA' | 'ZDARMA', 'SMART', 'AI_COACH' |

**Data Type:**
- `plan` používá PostgreSQL ENUM type: `membership_plan_type`
- Hodnoty: 'ZDARMA', 'SMART', 'AI_COACH'
- Automatický dropdown v Supabase Table Editor

| `status` | TEXT | NOT NULL, DEFAULT 'active' | 'active', 'cancelled', 'expired' |
| `type` | TEXT | NOT NULL, DEFAULT 'lifetime' | 'lifetime' nebo 'subscription' |
| `purchased_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Datum nákupu |
| `expires_at` | TIMESTAMPTZ | | Datum expirace (pokud není lifetime) |
| `stripe_customer_id` | TEXT | | Stripe customer ID |
| `stripe_subscription_id` | TEXT | | Stripe subscription ID |
| `gopay_payment_id` | TEXT | | GoPay payment ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Aktualizováno |

**Membership Plány:**

| Plan | Type | Features |
|------|------|----------|
| **ZDARMA** | lifetime | Základní přístup, omezené funkce |
| **SMART** | subscription | kontrolní pauza tracking, smart doporučení, 50+ programů |
| **AI_COACH** | subscription | AI coach, pokročilé analýzy, 100+ programů |

**Indexes:**
- `memberships_user_idx` ON `user_id`
- `memberships_plan_idx` ON `plan`
- `memberships_status_idx` ON `status`

**RLS Policies:**
- Users can view own membership (SELECT)

**Default:**
- Každý nový uživatel dostane `ZDARMA` plan automaticky (trigger)

---

## 🎯 MEMBERSHIP TIERS vs LIFETIME MODULES

### Rozdíl Mezi Typy Produktů

#### **Membership Tiers** (tabulka `memberships`)

**Jeden aktivní tier na uživatele:**
- **ZDARMA** - Default při registraci (lifetime)
- **SMART** - 249 Kč/měsíc (nebo 125 Kč/měsíc při ročním předplatném)
- **AI_COACH** - 490 Kč/měsíc (nebo 245 Kč/měsíc při ročním předplatném)

**Charakteristika:**
- ✅ Pouze JEDEN aktivní najednou
- ✅ UPDATE při změně plánu (ne INSERT nový záznam)
- ✅ Určuje základní level funkcí platformy
- ✅ V `modules` jako `membership-smart`, `membership-ai-coach`

#### **Lifetime Modules** (tabulka `user_modules`)

**Zakoupené lifetime produkty:**
- **DechBar STUDIO** - 990 Kč (lifetime)
- **Výzvy** - 490 Kč (lifetime)
- **Akademie** - 1490 Kč (lifetime)

**Charakteristika:**
- ✅ Uživatel může vlastnit VÍCE najednou
- ✅ Nezávislé na membership tier
- ✅ Permanentní přístup (lifetime)
- ✅ INSERT nový záznam při každém nákupu

### Příklad Kombinace:

```sql
-- Uživatel Jakub:

memberships:
  user_id: abc-123
  plan: 'SMART'
  status: 'active'

user_modules:
  1. { module_id: 'studio', purchase_type: 'lifetime' }
  2. { module_id: 'challenges', purchase_type: 'lifetime' }

user_roles:
  1. 'member' (default)
  2. 'teacher' (manuálně přidělen)

-- Výsledný přístup:
-- ✅ SMART membership funkce (kontrolní pauza tracking, smart doporučení, 50+ programů)
-- ✅ DechBar STUDIO (vytváření vlastních cvičení)
-- ✅ Výzvy (21-denní programy)
-- ✅ Teacher oprávnění (tvorba kurzů)
```

### Logika Nákupu:

**Když uživatel koupí SMART membership:**
```sql
-- NE: INSERT nový záznam
-- ANO: UPDATE existující záznam
UPDATE memberships 
SET plan = 'SMART', 
    purchased_at = NOW(),
    expires_at = NOW() + INTERVAL '1 month'
WHERE user_id = 'abc-123';
```

**Když uživatel koupí DechBar STUDIO:**
```sql
-- INSERT nový záznam (může mít více)
INSERT INTO user_modules (user_id, module_id, purchase_type)
VALUES ('abc-123', 'studio', 'lifetime');
```

---

### 5. `roles`

**Účel:** Definice rolí v platformě

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | Unikátní ID ('member', 'admin', ...) |
| `name` | TEXT | NOT NULL | Název role (česky) |
| `description` | TEXT | | Popis role |
| `level` | INTEGER | NOT NULL, DEFAULT 0 | Úroveň oprávnění (vyšší = více práv) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |

**Seeded Data (6 rolí):**

| ID | Name | Description | Level |
|----|------|-------------|-------|
| `member` | Člen DechBaru | Základní člen komunity | 1 |
| `vip_member` | VIP člen DechBaru | VIP člen s rozšířenými výhodami | 2 |
| `student` | Student | Student dechových cvičení | 1 |
| `teacher` | Učitel | Učitel/lektor dechových cvičení | 3 |
| `admin` | Admin | Administrátor platformy | 4 |
| `ceo` | CEO | Majitel/CEO | 5 |

**Indexes:**
- `roles_level_idx` ON `level`

**RLS Policies:**
- Anyone can view roles (SELECT) - pro zobrazení v UI

---

### 6. `user_roles`

**Účel:** Junction table - které role uživatel má (Many-to-Many)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unikátní ID |
| `user_id` | UUID | NOT NULL, FK → auth.users | ID uživatele |
| `role_id` | TEXT | NOT NULL, FK → roles | ID role |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Přiřazeno kdy |
| `assigned_by` | UUID | FK → auth.users | Přiřazeno kým (admin) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |

**Constraints:**
- UNIQUE(user_id, role_id) - uživatel nemůže mít stejnou roli 2x

**Indexes:**
- `user_roles_user_idx` ON `user_id`
- `user_roles_role_idx` ON `role_id`

**RLS Policies:**
- Users can view own roles (SELECT)
- Admins can manage roles (INSERT, DELETE)

**Default:**
- Každý nový uživatel dostane automaticky roli `member` (trigger)

---

## 🔗 Relationships

**memberships → profiles:**
- One-to-one (každý user má jeden membership plan)
- ON DELETE CASCADE

**user_modules → profiles:**
- Many-to-one (user může vlastnit více modulů)
- ON DELETE CASCADE

**user_modules → modules:**
- Many-to-one (modul může být vlastněn více uživateli)
- ON DELETE RESTRICT

**user_roles → profiles:**
- Many-to-one (user může mít více rolí)
- ON DELETE CASCADE

**user_roles → roles:**
- Many-to-one (role může být přiřazena více uživatelům)
- ON DELETE RESTRICT

---

## 🔐 ROW LEVEL SECURITY (RLS)

**Všechny tabulky mají aktivní RLS!**

Základní pravidla:
- Uživatelé vidí pouze **svá** data (profiles, memberships, user_modules, user_roles)
- Uživatelé mohou upravovat **svůj** profil
- Admins mají plný přístup (level 4+)

---

## 🚀 TRIGGERS

### 1. `handle_new_user()`

**Trigger:** `on_auth_user_created`
**Tabulka:** `auth.users`
**Akce:** AFTER INSERT

**Funkce:**
1. Vytvoří profil v `profiles`
2. Vytvoří membership `ZDARMA` v `memberships`
3. Přiřadí roli `member` v `user_roles`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 📝 SCHEMA UPDATES

### Jak Aktualizovat Schema

**NIKDY NE přímo v produkční DB!**

Vždy přes Supabase CLI:

```bash
# 1. Vytvoř novou migraci
supabase migration new add_new_column

# 2. Edituj SQL soubor v supabase/migrations/
# 3. Test lokálně
supabase db reset

# 4. Pusť na PROD
supabase db push
```

### Migration Best Practices

- Vždy přidávej DEFAULT hodnoty pro nové sloupce
- Nikdy nemazej sloupce (raději DEPRECATED_ prefix)
- Testuj migraci na lokální DB předtím, než pushneš
- Vždy přidej `IF NOT EXISTS` / `IF EXISTS`

---

## 🔍 QUERY EXAMPLES

### 1. Získat celý profil uživatele

```sql
SELECT 
  p.*,
  m.plan,
  m.status,
  json_agg(DISTINCT um.module_id) as modules,
  json_agg(DISTINCT ur.role_id) as roles
FROM profiles p
LEFT JOIN memberships m ON p.id = m.user_id
LEFT JOIN user_modules um ON p.id = um.user_id
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.id = 'user-uuid'
GROUP BY p.id, m.plan, m.status;
```

### 2. Kontrola přístupu k modulu

```sql
SELECT EXISTS (
  SELECT 1 
  FROM user_modules 
  WHERE user_id = 'user-uuid' 
    AND module_id = 'studio'
    AND (
      purchase_type = 'lifetime' 
      OR (subscription_status = 'active' AND expires_at > NOW())
    )
);
```

### 3. Všichni uživatelé s SMART membership

```sql
SELECT p.email, p.full_name, m.purchased_at
FROM profiles p
INNER JOIN memberships m ON p.id = m.user_id
WHERE m.plan = 'SMART' AND m.status = 'active';
```

---

## 📦 FUTURE TABLES

Tabulky, které přidáme později:

#### `exercises`
Dechová cvičení (vytvořená uživateli i defaultní)

#### `exercise_sessions`
Historie provedených cvičení (kontrolní pauza skóre, HRV, ...)

#### `achievements`
Gamifikace - dosažené úspěchy

#### `ai_conversations`
Historie konverzací s AI Coach

---

## 🔗 ODKAZY

- **Supabase Dashboard:** https://supabase.com/dashboard/project/iqyahebbteiwzwyrtmns
- **RLS Documentation:** https://supabase.com/docs/guides/auth/row-level-security
- **Postgres Docs:** https://www.postgresql.org/docs/

---

*Last updated: 2026-01-14*
