-- ============================================================
-- Fix Analytics RLS Policies
-- Migration: 20260228210000_fix_analytics_rls
--
-- Problems fixed:
--   1. analytics tables used direct EXISTS(user_roles) check
--      → causes issues with user_roles RLS circular reference
--      → replace with public.is_admin() (SECURITY DEFINER, safe)
--
--   2. exercise_sessions had no admin read policy
--      → admin dashboard couldn't aggregate all users' exercise data
--
-- NOTE: public.is_admin() was created in 20260206110000_fix_user_roles_rls_circular.sql
-- ============================================================

-- ============================================================
-- 1. audio_sessions — fix admin policy
-- ============================================================

DROP POLICY IF EXISTS "audio_sessions_admin_read" ON public.audio_sessions;

CREATE POLICY "audio_sessions_admin_read"
  ON public.audio_sessions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 2. audio_events — fix admin policy
-- ============================================================

DROP POLICY IF EXISTS "audio_events_admin_read" ON public.audio_events;

CREATE POLICY "audio_events_admin_read"
  ON public.audio_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 3. user_activity_log — fix admin policy
-- ============================================================

DROP POLICY IF EXISTS "activity_log_admin_read" ON public.user_activity_log;

CREATE POLICY "activity_log_admin_read"
  ON public.user_activity_log FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 4. user_activity_streaks — fix admin policy
-- ============================================================

DROP POLICY IF EXISTS "streaks_admin_read" ON public.user_activity_streaks;

CREATE POLICY "streaks_admin_read"
  ON public.user_activity_streaks FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 5. platform_daily_stats — fix admin policy + allow service role insert
-- ============================================================

DROP POLICY IF EXISTS "platform_stats_admin_read" ON public.platform_daily_stats;

CREATE POLICY "platform_stats_admin_read"
  ON public.platform_daily_stats FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 6. exercise_sessions — ADD admin read policy (was missing!)
--    Allows admin dashboard to aggregate all users' sessions
-- ============================================================

DROP POLICY IF EXISTS "sessions_admin_read" ON public.exercise_sessions;

CREATE POLICY "sessions_admin_read"
  ON public.exercise_sessions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- 7. kp_measurements — add admin read policy if missing
--    Used in Pokrok page + could be useful in admin dashboard
-- ============================================================

DROP POLICY IF EXISTS "kp_admin_read" ON public.kp_measurements;

CREATE POLICY "kp_admin_read"
  ON public.kp_measurements FOR SELECT
  TO authenticated
  USING (public.is_admin());

DO $$
BEGIN
  RAISE NOTICE '✅ Analytics RLS policies updated to use is_admin()';
  RAISE NOTICE '✅ exercise_sessions admin read policy added';
  RAISE NOTICE '✅ kp_measurements admin read policy added';
END $$;
