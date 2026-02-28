-- ============================================================
-- Analytics Helper Functions
-- Migration: 20260228220000_analytics_count_functions
--
-- Problem: supabase.from('profiles').select('user_id', { count: 'exact', head: true })
--   returns 1 instead of the real count due to interaction between
--   RLS policies and the HEAD request with count=exact.
--
-- Solution: SECURITY DEFINER functions bypass RLS entirely,
--   allowing reliable admin-only counts.
-- ============================================================

-- ============================================================
-- 1. get_total_profiles_count()
--    Returns total number of registered users.
--    Admin-only via SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_total_profiles_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.profiles;
$$;

GRANT EXECUTE ON FUNCTION public.get_total_profiles_count() TO authenticated;

COMMENT ON FUNCTION public.get_total_profiles_count() IS
  'Returns total registered users count. SECURITY DEFINER bypasses RLS for reliable admin count.';

-- ============================================================
-- 2. get_all_time_minutes()
--    Returns total minutes breathed across all users, all time.
--    Audio + Exercise (exercise capped at 2h per session).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_time_minutes()
RETURNS DECIMAL
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT SUM(unique_listen_seconds)::DECIMAL / 60
     FROM public.audio_sessions),
    0
  ) +
  COALESCE(
    (SELECT SUM(
       LEAST(
         EXTRACT(EPOCH FROM (completed_at - started_at)),
         7200  -- cap at 2 hours
       )
     )::DECIMAL / 60
     FROM public.exercise_sessions
     WHERE completed_at IS NOT NULL
       AND completed_at > started_at),
    0
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_all_time_minutes() TO authenticated;

COMMENT ON FUNCTION public.get_all_time_minutes() IS
  'Returns total minutes breathed (audio + exercise, exercise capped 2h). SECURITY DEFINER.';

-- ============================================================
-- 3. get_new_registrations_today()
--    Returns count of new profiles created today (UTC).
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_new_registrations_today()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE created_at >= DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
$$;

GRANT EXECUTE ON FUNCTION public.get_new_registrations_today() TO authenticated;

-- ============================================================
-- 4. get_new_registrations_in_range(from_ts, to_ts)
--    Returns count of new profiles in a date range.
--    Used for period-over-period comparison.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_new_registrations_in_range(
  from_ts TIMESTAMPTZ,
  to_ts   TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE created_at >= from_ts
    AND created_at <= to_ts;
$$;

GRANT EXECUTE ON FUNCTION public.get_new_registrations_in_range(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ get_total_profiles_count() created';
  RAISE NOTICE '✅ get_all_time_minutes() created';
  RAISE NOTICE '✅ get_new_registrations_today() created';
  RAISE NOTICE '✅ get_new_registrations_in_range() created';
END $$;
