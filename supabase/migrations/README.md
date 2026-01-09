# 📁 Database Migrations

**Pro: AI agenty, programátory**

---

## 🎯 ÚČEL

Tato složka obsahuje **SQL migration soubory** pro Supabase databázi.

**Každá změna v DB = nová migrace!**

---

## 🤖 JAK VYTVOŘIT MIGRACI (Pro AI agenty)

### 1️⃣ **Vytvoř nový soubor**

**Formát názvu:**
```
YYYYMMDDHHMMSS_popis_zmeny.sql
```

**Příklad:**
```
20260109130000_add_exercises_table.sql
20260109140500_add_user_preferences.sql
20260110093000_add_achievements_table.sql
```

**Timestamp = unikátní pořadí (důležité!)**

---

### 2️⃣ **Napiš SQL**

**Template:**
```sql
-- =====================================================
-- Migration: Add exercises table
-- Date: 2026-01-09
-- Author: AI Agent
-- =====================================================

-- Create table
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  breathing_pattern JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS exercises_user_idx ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS exercises_created_idx ON public.exercises(created_at DESC);

-- Comments
COMMENT ON TABLE public.exercises IS 'User-created breathing exercises';
COMMENT ON COLUMN public.exercises.breathing_pattern IS 'JSONB: {inhale: 4, hold: 7, exhale: 8}';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Table exercises created successfully!';
END $$;
```

---

### 3️⃣ **Developer aplikuje migraci**

```bash
cd /Users/DechBar/dechbar-app
supabase db push
```

**CLI automaticky:**
- Detekuje nové SQL soubory
- Aplikuje je v pořadí (timestamp)
- Zaloguje úspěch/chyby

---

## ✅ CHECKLIST PRO KAŽDOU MIGRACI

### Must-have:

- [ ] **Table name:** `public.table_name` (vždy prefix `public.`)
- [ ] **Primary key:** UUID s `gen_random_uuid()`
- [ ] **Foreign keys:** S `ON DELETE CASCADE` (pokud závislost)
- [ ] **RLS enabled:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] **RLS policies:** Minimálně SELECT policy
- [ ] **Indexes:** Pro foreign keys a často queryované sloupce
- [ ] **Timestamps:** `created_at`, `updated_at` (pokud potřeba)
- [ ] **Comments:** `COMMENT ON TABLE` pro dokumentaci
- [ ] **IF NOT EXISTS:** Pro idempotenci (lze spustit vícekrát)

---

## 📋 EXISTUJÍCÍ TABULKY

| Tabulka | Účel | Řádky | Vytvořeno |
|---------|------|-------|-----------|
| `profiles` | User profiles | 0 | 2026-01-09 |
| `modules` | Available products | 5 | 2026-01-09 |
| `user_modules` | User purchases | 0 | 2026-01-09 |
| `memberships` | User membership plans | 0 | 2026-01-09 |
| `roles` | User roles | 6 | 2026-01-09 |
| `user_roles` | User-role junction | 0 | 2026-01-09 |

**Detaily:** Viz `docs/DATABASE_SCHEMA.md`

---

## 🎨 SQL PATTERNS

### Pattern 1: Simple Table
```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read"
  ON public.my_table FOR SELECT
  USING (true);
```

### Pattern 2: User-owned Table
```sql
CREATE TABLE public.my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own data"
  ON public.my_table FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX my_table_user_idx ON public.my_table(user_id);
```

### Pattern 3: Junction Table (Many-to-Many)
```sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX user_achievements_user_idx ON public.user_achievements(user_id);
CREATE INDEX user_achievements_achievement_idx ON public.user_achievements(achievement_id);
```

### Pattern 4: Enum Column
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  provider TEXT NOT NULL CHECK (provider IN ('gopay', 'stripe')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## ⚠️ DŮLEŽITÉ PRAVIDLA

### ✅ VŽDY:

1. **Použij `IF NOT EXISTS`** → idempotence
   ```sql
   CREATE TABLE IF NOT EXISTS ...
   CREATE INDEX IF NOT EXISTS ...
   ```

2. **Enable RLS na VŠECH tabulkách**
   ```sql
   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
   ```

3. **Přidej RLS policies** (jinak nikdo neuvidí data!)
   ```sql
   CREATE POLICY ...
   ```

4. **Foreign keys s `ON DELETE CASCADE`**
   ```sql
   REFERENCES auth.users(id) ON DELETE CASCADE
   ```

5. **Indexy pro foreign keys**
   ```sql
   CREATE INDEX ... ON table(foreign_key_column);
   ```

6. **Timestamps pro audit trail**
   ```sql
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   ```

### ❌ NIKDY:

1. **Neupravuj staré migration soubory** → Vytvoř novou migraci
2. **Nemaž migration soubory** → Git historie = DB historie
3. **Nepoužívej `DROP TABLE` bez `IF EXISTS`**
4. **Neobcházej RLS** → Vždy enabled
5. **Nespouštěj SQL přímo v Dashboard** → Jen pro debug/testing

---

## 🔄 ROLLBACK (Vrácení změn)

Pokud migrace způsobila problém:

### 1️⃣ **Vytvoř "revert" migraci**
```bash
supabase migration new revert_exercises_table
```

### 2️⃣ **Napiš DROP nebo ALTER**
```sql
-- Revert: Drop exercises table
DROP TABLE IF EXISTS public.exercises CASCADE;
```

### 3️⃣ **Aplikuj**
```bash
supabase db push
```

**NEBO** restore z backupu (pokud velká změna).

---

## 📚 REFERENCE

- **Supabase CLI:** [docs/SUPABASE_CLI.md](../docs/SUPABASE_CLI.md)
- **DB Schema:** [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)
- **RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## 💡 TIPS

### Pro AI agenty:

1. **Čti existující migrace** (pokud jsou) - konzistence!
2. **Kopíruj patterns** z existujících tabulek
3. **Testuj syntax** (Developer spustí a ověří)
4. **Dokumentuj** v COMMENT ON TABLE/COLUMN

### Pro programátory:

1. **Vždy commit migrations** do Gitu
2. **Review před push** (typo v SQL = problém)
3. **Testuj na DEV** před produkcí (pokud možné)
4. **Backup před velkými změnami**

---

## 🎯 QUICK REFERENCE

```bash
# Create new migration
supabase migration new feature_name

# Apply migrations
supabase db push

# List migrations
supabase migration list

# View table stats
supabase inspect db table-stats --linked
```

---

*Last updated: 2026-01-09*
