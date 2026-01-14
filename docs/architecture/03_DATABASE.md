# 🗄️ Database Schema Documentation

**Project:** DechBar App  
**Database:** Supabase PostgreSQL  
**Region:** West EU (Ireland)  
**Project ID:** `iqyahebbteiwzwyrtmns`

---

## 📋 PŘEHLED

Databáze je navržena pro **modulární platformu** s:
- 🔐 Autentizace (Supabase Auth)
- 👥 Uživatelské profily
- 📦 Produktové moduly (lifetime/subscription)
- 🎖️ Role a oprávnění
- 💳 Membership plány

---

## 📊 ER DIAGRAM (Zjednodušený)

```
auth.users (Supabase Auth)
    │
    ├─→ profiles (1:1)
    │
    ├─→ user_modules (1:N) ──→ modules (N:1)
    │
    ├─→ memberships (1:N)
    │
    └─→ user_roles (1:N) ──→ roles (N:1)
```

---

## 🏗️ TABULKY

### 1. `profiles`

**Účel:** Rozšíření `auth.users` o custom data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PK, FK → auth.users | ID uživatele |
| `email` | TEXT | NOT NULL | Email (zrcadlený z auth.users) |
| `full_name` | TEXT | | Celé jméno |
| `avatar_url` | TEXT | | URL profilového obrázku |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Aktualizováno |

**Indexes:**
- `profiles_email_idx` ON `email`

**RLS Policies:**
- Users can view own profile (SELECT)
- Users can update own profile (UPDATE)

**Trigger:**
- Auto-create při registraci (`handle_new_user`)

---

### 2. `modules`

**Účel:** Dostupné produktové moduly (co lze koupit)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PK | Unikátní ID ('studio', 'challenges', ...) |
| `name` | TEXT | NOT NULL | Název modulu |
| `description` | TEXT | | Popis |
| `price_czk` | INTEGER | NOT NULL | Cena v Kč |
| `price_type` | TEXT | NOT NULL | 'lifetime' nebo 'subscription' |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Aktivní/neaktivní |
| `is_beta` | BOOLEAN | NOT NULL, DEFAULT false | Beta verze |
| `requires_module_id` | TEXT | FK → modules | Vyžaduje jiný modul |
| `icon` | TEXT | | Icon identifier |
| `color` | TEXT | | Barva (#F8CA00) |
| `sort_order` | INTEGER | DEFAULT 0 | Pořadí v UI |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Vytvořeno |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Aktualizováno |

**Seeded Data (5 modulů):**

| ID | Name | Price | Type | Description |
|----|------|-------|------|-------------|
| `studio` | DechBar STUDIO | 990 Kč | lifetime | Vytvoř si vlastní dechová cvičení |
| `challenges` | Výzvy | 490 Kč | lifetime | 21-denní dechové výzvy |
| `akademie` | Akademie | 1490 Kč | lifetime | Vzdělávací kurzy a lekce |
| `game` | DechBar GAME | 149 Kč | subscription | Gamifikace a soutěže |
| `ai-coach` | AI Coach | 490 Kč | subscription | Osobní AI průvodce |

**Indexes:**
- `modules_sort_order_idx` ON `sort_order`
- `modules_is_active_idx` ON `is_active`

**RLS Policies:**
- Anyone can view active modules (SELECT WHERE is_active = true)

---

### 3. `user_modules`

**Účel:** Junction table - které moduly uživatel vlastní

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unikátní ID |
| `user_id` | UUID | NOT NULL, FK → auth.users | ID uživatele |
| `module_id` | TEXT | NOT NULL, FK → modules | ID modulu |
| `purchased_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Datum nákupu |
| `purchase_type` | TEXT | NOT NULL | 'lifetime' nebo 'subscription' |
| `subscription_status` | TEXT | | 'active', 'cancelled', 'past_due' |
| `current_period_end` | TIMESTAMPTZ | | Konec předplatného (jen subscription) |
| `payment_id` | TEXT | | ID platby (GoPay/Stripe) |
| `payment_provider` | TEXT | | 'gopay' nebo 'stripe' |

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
| **SMART** | subscription | BOLT tracking, smart doporučení, 50+ programů |
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
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Kdy přiděleno |
| `assigned_by` | UUID | FK → auth.users | Kdo přidělil |
| `notes` | TEXT | | Poznámky |

**Constraints:**
- UNIQUE(user_id, role_id) - uživatel může mít roli jen 1x

**Indexes:**
- `user_roles_user_idx` ON `user_id`
- `user_roles_role_idx` ON `role_id`

**RLS Policies:**
- Users can view own roles (SELECT)
- Only admins/CEO can manage roles (ALL)

**Default:**
- Každý nový uživatel dostane roli `member` automaticky (trigger)

---

## 🔧 TRIGGERS & FUNCTIONS

### `handle_new_user()`

**Trigger:** `on_auth_user_created` (AFTER INSERT ON auth.users)

**Akce při registraci:**
1. Vytvoří záznam v `profiles`
2. Přidělí roli `member` v `user_roles`
3. Vytvoří `ZDARMA` membership v `memberships`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_roles (user_id, role_id)
  VALUES (NEW.id, 'member');

  INSERT INTO public.memberships (user_id, plan, status, type)
  VALUES (NEW.id, 'ZDARMA', 'active', 'lifetime');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### Helper Functions

#### `user_has_role(user_id, role_id)`
Kontrola, zda má uživatel konkrétní roli

```sql
SELECT public.user_has_role('uuid...', 'admin');
-- Returns: true/false
```

#### `user_has_any_role(user_id, role_ids[])`
Kontrola, zda má uživatel alespoň jednu z rolí

```sql
SELECT public.user_has_any_role('uuid...', ARRAY['admin', 'ceo']);
-- Returns: true/false
```

#### `get_user_roles(user_id)`
Vrátí všechny role uživatele

```sql
SELECT * FROM public.get_user_roles('uuid...');
-- Returns: TABLE (role_id, role_name, role_level, assigned_at)
```

#### `user_is_admin(user_id)`
Kontrola, zda je uživatel admin nebo CEO

```sql
SELECT public.user_is_admin('uuid...');
-- Returns: true/false
```

#### `get_active_membership(user_id)`
Vrátí aktivní membership plan uživatele

```sql
SELECT * FROM public.get_active_membership('uuid...');
-- Returns: TABLE (plan, type, purchased_at, expires_at)
```

---

## 🔐 ROW LEVEL SECURITY (RLS)

**Všechny tabulky mají RLS ENABLED!**

### Základní princip:
```sql
-- Users vidí jen své data
auth.uid() = user_id

-- Admini vidí vše
EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role_id IN ('admin', 'ceo'))
```

### Security Best Practices:
- ✅ Nikdy nepoužívej `service_role` key na klientu
- ✅ Všechny queries jdou přes `anon` nebo `authenticated` role
- ✅ RLS policies kontrolují každý SELECT/INSERT/UPDATE/DELETE
- ✅ Helper funkce jsou `SECURITY DEFINER` (běží s právy vlastníka)

---

## 📈 BUDOUCÍ ROZŠÍŘENÍ

### Plánované tabulky:

#### `exercises`
Uživatelská dechová cvičení (pro Studio modul)

#### `challenge_packs`
21-denní výzvy (pro Challenges modul)

#### `user_progress`
Progress tracking (dokončené lekce, cvičení, výzvy)

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

*Last updated: 2026-01-09*
