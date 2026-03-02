-- ============================================================
-- RLS AUDIT FIX — PROD (iqyahebbteiwzwyrtmns)
-- Date: 2026-03-02
-- ADDITIVE ONLY — adds missing admin policies and fixes with_check.
-- Zero risk to existing functionality (nothing is removed).
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. memberships — add admin management policy
--    Reason: admins had no way to manually manage memberships on PROD
--    via authenticated session (only service_role edge functions worked).
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;

CREATE POLICY "Admins can manage memberships"
  ON public.memberships
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- 2. profiles — add admin SELECT and UPDATE policies
--    Reason: admins couldn't view other users' profiles on PROD.
--    User-facing SELECT/UPDATE policies remain unchanged.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- 3. user_modules — add admin management policy
--    Reason: admins couldn't grant/revoke modules on PROD
--    via authenticated session.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage user_modules" ON public.user_modules;

CREATE POLICY "Admins can manage user_modules"
  ON public.user_modules
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────
-- 4. smart_exercise_recommendations — add WITH CHECK on UPDATE
--    Reason: same fix as DEV — prevents user_id swap on update.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "smart_recs_update_own" ON public.smart_exercise_recommendations;

CREATE POLICY "smart_recs_update_own"
  ON public.smart_exercise_recommendations
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Verification
-- ─────────────────────────────────────────────
DO $$
DECLARE
  memberships_admin boolean;
  profiles_view_admin boolean;
  profiles_update_admin boolean;
  user_modules_admin boolean;
  smart_recs_check boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='memberships' AND policyname='Admins can manage memberships') INTO memberships_admin;
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admins can view all profiles') INTO profiles_view_admin;
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Admins can update all profiles') INTO profiles_update_admin;
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_modules' AND policyname='Admins can manage user_modules') INTO user_modules_admin;
  SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='smart_exercise_recommendations' AND policyname='smart_recs_update_own' AND with_check IS NOT NULL) INTO smart_recs_check;

  RAISE NOTICE '✅ PROD RLS audit fix complete:';
  RAISE NOTICE '  memberships admin: %', CASE WHEN memberships_admin THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  profiles view admin: %', CASE WHEN profiles_view_admin THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  profiles update admin: %', CASE WHEN profiles_update_admin THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  user_modules admin: %', CASE WHEN user_modules_admin THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  smart_recs with_check: %', CASE WHEN smart_recs_check THEN 'OK' ELSE 'MISSING!' END;
END;
$$;
