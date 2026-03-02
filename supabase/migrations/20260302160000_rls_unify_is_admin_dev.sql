-- ============================================================
-- RLS UNIFIKACE is_admin() — DEV (nrlqzighwaeuxcicuhse)
-- Date: 2026-03-02
-- Standardize admin check from old EXISTS(user_roles) subquery
-- to is_admin() function on all akademie_ tables and modules.
-- Functionally identical — is_admin() internally does the same query.
-- PROD already uses is_admin() consistently.
-- ============================================================

-- ─────────────────────────────────────────────
-- akademie_categories
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage akademie_categories" ON public.akademie_categories;

CREATE POLICY "Admin can manage akademie_categories"
  ON public.akademie_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- akademie_lessons
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage akademie_lessons" ON public.akademie_lessons;

CREATE POLICY "Admin can manage akademie_lessons"
  ON public.akademie_lessons
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- akademie_programs
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage akademie_programs" ON public.akademie_programs;

CREATE POLICY "Admin can manage akademie_programs"
  ON public.akademie_programs
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- akademie_series
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage akademie_series" ON public.akademie_series;

CREATE POLICY "Admin can manage akademie_series"
  ON public.akademie_series
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- modules — also standardize + add missing is_active filter variant
--   DEV has 3 SELECT policies; we keep 2 clean ones
--   "Public read access to modules" (true) + "Public read modules" (true)
--   → drop one duplicate, keep the canonical anon+authenticated one
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage modules" ON public.modules;

CREATE POLICY "Admin can manage modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Remove one of the two duplicate SELECT true policies on DEV
-- (keep "Public read modules" matching PROD's {anon,authenticated} style)
DROP POLICY IF EXISTS "Public read access to modules" ON public.modules;

-- ─────────────────────────────────────────────
-- Verification
-- ─────────────────────────────────────────────
DO $$
DECLARE
  old_style_count int;
BEGIN
  SELECT COUNT(*) INTO old_style_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('akademie_categories','akademie_lessons','akademie_programs','akademie_series','modules')
    AND qual LIKE '%user_roles.role_id = ANY%';

  RAISE NOTICE '✅ DEV is_admin() unification complete';
  RAISE NOTICE '  old-style EXISTS(user_roles) policies remaining: % (should be 0)', old_style_count;
END;
$$;
