# ✅ Migrace Supabase DEV - Instrukce

## 📋 Co je potřeba spustit:

1. **Fix user_modules RLS policies** (oprava 406 chyb)
2. **Add tags system** (přidání `tags TEXT[]` do tracks)

---

## 🚀 Jak spustit migrace:

### **Varianta A: Automaticky (SQL Editor - DOPORUČENO)**

1. Otevři Supabase Dashboard: https://nrlqzighwaeuxcicuhse.supabase.co
2. Přejdi na **SQL Editor** (ikona < >)
3. Klikni **"+ New query"**
4. Zkopíruj celý obsah souboru: `supabase/MANUAL_MIGRATION_20260206.sql`
5. Vlož do SQL Editoru a klikni **"Run"** (nebo Cmd+Enter)
6. ✅ Hotovo!

### **Varianta B: Po částech (bezpečnější)**

#### **Krok 1: Fix user_modules RLS**
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.user_modules;

-- Recreate using is_admin()
CREATE POLICY "Users can view their own modules"
  ON public.user_modules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all modules"
  ON public.user_modules
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert modules"
  ON public.user_modules
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all modules"
  ON public.user_modules
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete modules"
  ON public.user_modules
  FOR DELETE
  USING (public.is_admin());
```

#### **Krok 2: Add tags system**
```sql
-- Add tags column
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add GIN index
CREATE INDEX IF NOT EXISTS idx_tracks_tags
  ON public.tracks USING GIN (tags);
```

---

## ✅ Ověření (run po migraci):

```sql
-- Check tags column
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tracks' AND column_name = 'tags';

-- Check user_modules policies
SELECT policyname 
FROM pg_policies
WHERE tablename = 'user_modules';

-- Test tags
SELECT id, title, tags FROM public.tracks LIMIT 5;
```

---

## 🎯 Co to opraví:

### **1. user_modules RLS fix:**
- ❌ **Před:** 406 errors na `/user_modules` endpoint
- ✅ **Po:** Fungující policies s `is_admin()` funkcí

### **2. Tags system:**
- ✅ Nový sloupec `tags TEXT[]` v tracks
- ✅ GIN index pro rychlé vyhledávání
- ✅ Multi-select v Track Form UI (už hotové)

---

## 🆘 V případě problémů:

1. **"function is_admin() does not exist"**
   - Nejdřív spusť migraci: `20260206110000_fix_user_roles_rls_circular.sql`
   - Ta vytváří `is_admin()` funkci

2. **"relation user_modules does not exist"**
   - Tabulka není vytvořená - nejdřív vytvoř tabulku

3. **"column tags already exists"**
   - OK, migrace už běžela (IF NOT EXISTS ošetřuje)

---

## 📊 Status:

- [x] Migrace vytvořeny
- [ ] Spuštěno v Supabase DEV
- [ ] Ověřeno v konzoli
- [ ] Otestováno v UI

**Příští krok:** Spusť migrace v SQL Editoru a pak restartuj browser! 🚀
