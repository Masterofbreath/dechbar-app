-- ============================================================
-- RLS AUDIT FIX — DEV (nrlqzighwaeuxcicuhse)
-- Date: 2026-03-02
-- Fixes 5 security issues identified in RLS audit.
-- Each change is explained inline.
-- SAFE: changes are DEV-only, PROD unaffected.
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. platform_daily_override
--    Remove "Admin full access on daily override" — qual: true
--    Reason: ANY authenticated user could write/delete daily overrides.
--    Correct policy "Admin manage daily override" (is_admin()) stays.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin full access on daily override" ON public.platform_daily_override;

-- ─────────────────────────────────────────────
-- 2. challenge_registrations
--    a) Remove "Anyone can register email" — with_check: true
--       Reason: allowed inserting a registration with ANY user_id.
--       Safe replacement "Allow challenge registration for anyone"
--       (with_check: user_id IS NULL OR auth.uid() = user_id) stays.
--    b) Remove "Service role can update registrations" — role: public, qual: true
--       Reason: ANY authenticated user could UPDATE ANY registration.
--       Edge functions use service_role (bypasses RLS) — this isn't needed.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can register email" ON public.challenge_registrations;
DROP POLICY IF EXISTS "Service role can update registrations" ON public.challenge_registrations;

-- ─────────────────────────────────────────────
-- 3. memberships
--    Remove "System can insert memberships" — with_check: true
--    Reason: ANY authenticated user could insert a membership with any plan.
--    Safe replacement "System can insert memberships - no circular"
--    (with_check: auth.uid() = user_id) stays.
--    Edge functions use service_role → not affected by this change.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "System can insert memberships" ON public.memberships;

-- ─────────────────────────────────────────────
-- 4. exercises
--    Fix "exercises_delete_own" — was accidentally cmd: UPDATE instead of DELETE.
--    Result: users now can actually delete their own exercises.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "exercises_delete_own" ON public.exercises;

CREATE POLICY "exercises_delete_own"
  ON public.exercises
  FOR DELETE
  TO public
  USING (auth.uid() = created_by);

-- ─────────────────────────────────────────────
-- 5. smart_exercise_recommendations
--    Add WITH CHECK on UPDATE.
--    Reason: without it, a user could theoretically change user_id
--    to someone else's on an update operation.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "smart_recs_update_own" ON public.smart_exercise_recommendations;

CREATE POLICY "smart_recs_update_own"
  ON public.smart_exercise_recommendations
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- Verification — fails entire migration if any dangerous policy survived
-- ─────────────────────────────────────────────
DO $$
DECLARE
  dangerous_count int;
  delete_policy_ok boolean;
  smart_recs_with_check boolean;
BEGIN
  SELECT COUNT(*) INTO dangerous_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      (tablename = 'platform_daily_override' AND policyname = 'Admin full access on daily override')
      OR (tablename = 'challenge_registrations' AND policyname = 'Anyone can register email')
      OR (tablename = 'challenge_registrations' AND policyname = 'Service role can update registrations')
      OR (tablename = 'memberships' AND policyname = 'System can insert memberships')
    );

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exercises'
      AND policyname = 'exercises_delete_own'
      AND cmd = 'DELETE'
  ) INTO delete_policy_ok;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'smart_exercise_recommendations'
      AND policyname = 'smart_recs_update_own'
      AND with_check IS NOT NULL
  ) INTO smart_recs_with_check;

  IF dangerous_count > 0 THEN
    RAISE EXCEPTION '❌ FAILED: % dangerous policies still exist!', dangerous_count;
  END IF;

  RAISE NOTICE '✅ DEV RLS audit fix complete:';
  RAISE NOTICE '  dangerous policies removed: OK (0 remaining)';
  RAISE NOTICE '  exercises DELETE policy: %', CASE WHEN delete_policy_ok THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  smart_recs with_check: %', CASE WHEN smart_recs_with_check THEN 'OK' ELSE 'MISSING!' END;
END;
$$;
