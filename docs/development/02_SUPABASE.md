# 🗄️ Supabase CLI - Database Management

## 📋 PŘEHLED

DechBar App používá **Supabase CLI** pro správu databáze pomocí migration souborů.

**Výhody:**
- ✅ Git version control pro DB změny
- ✅ Rychlé aplikování změn (1 příkaz)
- ✅ Snadný rollback (git revert)
- ✅ Jasná historie změn
- ✅ AI agent může vytvářet migrace

---

## 🔧 SETUP (Pro nové vývojáře)

### 1. Instalace CLI

```bash
# macOS
brew install supabase/tap/supabase

# Ověření
supabase --version
```

### 2. Přihlášení

```bash
# Přihlaš se k Supabase
supabase login

# Browser se otevře → přihlaš se
# CLI získá token
```

### 3. Propojení projektu

```bash
cd /Users/DechBar/dechbar-app

# Propoj s remote projektem
supabase link --project-ref iqyahebbteiwzwyrtmns
```

**Project Info:**
- **Project ID:** `iqyahebbteiwzwyrtmns`
- **Name:** DechBar App
- **Region:** West EU (Ireland)

---

## 🔄 WORKFLOW (Práce s databází)

### 1️⃣ **Vytvoř novou migraci**

```bash
cd /Users/DechBar/dechbar-app

# CLI vytvoří prázdný migration soubor s timestampem
supabase migration new add_exercises_table
```

**Vytvoří:**
```
supabase/migrations/20260109130000_add_exercises_table.sql
```

### 2️⃣ **Napiš SQL do migration souboru**

```sql
-- supabase/migrations/20260109130000_add_exercises_table.sql

CREATE TABLE public.exercises (
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
CREATE INDEX exercises_user_idx ON public.exercises(user_id);
CREATE INDEX exercises_created_idx ON public.exercises(created_at DESC);

COMMENT ON TABLE public.exercises IS 'User-created breathing exercises';
```

### 3️⃣ **Aplikuj migraci na remote DB**

```bash
# Pushni všechny nové migrace na remote
supabase db push

# CLI:
# - Detekuje nové migrace
# - Aplikuje je v pořadí (podle timestampu)
# - Zaloguje úspěch/chyby
```

### 4️⃣ **Commit do Gitu**

```bash
git add supabase/migrations/
git commit -m "feat(db): add exercises table"
git push
```

---

## 🛠️ UŽITEČNÉ PŘÍKAZY

### Zobrazit seznam migrací
```bash
supabase migration list
```

### Ověřit status projektu
```bash
supabase projects list
```

### Zobrazit tabulky v DB
```bash
supabase inspect db table-stats --linked
```

### Stáhnout aktuální DB schéma
```bash
# Vytvoří migration z aktuálního stavu DB
supabase db pull --schema public
```

### Rollback (vrátit změny)
```bash
# 1. Git revert migration souboru
git revert HEAD

# 2. Vytvoř "down" migraci (manuálně)
supabase migration new revert_exercises_table

# 3. Napiš DROP TABLE ... do migration souboru

# 4. Pushni
supabase db push
```

---

## 🤖 PRO AI AGENTY

### Pravidla pro tvorbu migrací:

1. **Vytvoř soubor v:** `supabase/migrations/`
2. **Název:** `YYYYMMDDHHMMSS_popis_zmeny.sql`
3. **Obsah:**
   ```sql
   -- Vždy zahrň:
   CREATE TABLE ...
   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
   CREATE POLICY ...
   CREATE INDEX ...
   COMMENT ON TABLE ...
   ```

4. **Developer spustí:** `supabase db push`

### Checklist pro každou migraci:

- [ ] CREATE TABLE s UUID primary key
- [ ] Foreign keys s `ON DELETE CASCADE`
- [ ] RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] RLS policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Indexes pro foreign keys a často queryované sloupce
- [ ] Comments pro dokumentaci (`COMMENT ON TABLE ...`)
- [ ] Timestamp sloupce: `created_at`, `updated_at`

---

## 📊 EXISTUJÍCÍ TABULKY

| Tabulka | Účel | Řádky |
|---------|------|-------|
| `profiles` | User profiles | 0 |
| `modules` | Available products | 5 |
| `user_modules` | User purchases | 0 |
| `memberships` | User membership plans | 0 |
| `roles` | User roles | 6 |
| `user_roles` | User-role junction | 0 |

**Detaily:** Viz [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

## ⚠️ DŮLEŽITÉ

### ✅ VŽDY:
- Commit migrace do Gitu
- Testuj na DEV před nasazením
- Zahrň RLS policies pro VŠECHNY tabulky
- Používej `IF NOT EXISTS` pro idempotenci

### ❌ NIKDY:
- Neupravuj staré migration soubory (vytvoř novou)
- Nemaž migration soubory
- Neobcházej RLS (vždy enabled)
- Nespouštěj SQL přímo v Supabase Dashboard (jen pro debug)

---

## 🔗 ODKAZY

- **Supabase Docs:** https://supabase.com/docs/guides/cli
- **Migration Best Practices:** https://supabase.com/docs/guides/cli/local-development#database-migrations
- **RLS Documentation:** https://supabase.com/docs/guides/auth/row-level-security

---

*Last updated: 2026-01-09*
