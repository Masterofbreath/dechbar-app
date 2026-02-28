-- ============================================================
-- Remove 2-hour cap from exercise session duration in get_all_time_minutes()
-- Reason: App is now live with real users; the cap was a safety measure for
-- test data on DEV. Real sessions are naturally bounded by actual workouts.
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
       EXTRACT(EPOCH FROM (completed_at - started_at))
     )::DECIMAL / 60
     FROM public.exercise_sessions
     WHERE completed_at IS NOT NULL
       AND completed_at > started_at),
    0
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_all_time_minutes() TO authenticated;

COMMENT ON FUNCTION public.get_all_time_minutes() IS
  'Returns total minutes breathed (audio + exercise, no cap). SECURITY DEFINER.';

DO $$ BEGIN
  RAISE NOTICE '✅ get_all_time_minutes() updated — 2h cap removed';
END $$;
