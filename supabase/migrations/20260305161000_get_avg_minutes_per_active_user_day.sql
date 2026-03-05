-- Migration: get_avg_minutes_per_active_user_day
-- Purpose: Returns the average minutes per active user-day in a date range.
--          A "user-day" is one distinct (user_id, calendar_date) pair where
--          the user had at least one activity (audio OR exercise session > 0 min).
--
--          Formula: AVG(SUM of minutes per user per day, across all user-day pairs)
--          → "On days when a user trains, how many minutes do they spend on average?"
--
-- Security: SECURITY DEFINER — bypasses RLS for admin use.

CREATE OR REPLACE FUNCTION get_avg_minutes_per_active_user_day(
  from_ts timestamptz,
  to_ts   timestamptz
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ROUND(CAST(COALESCE(AVG(user_day_minutes), 0) AS numeric), 1)
  FROM (
    SELECT user_id, started_at::date AS day, SUM(minutes) AS user_day_minutes
    FROM (
      SELECT user_id, started_at, unique_listen_seconds / 60.0 AS minutes
      FROM audio_sessions
      WHERE started_at >= from_ts AND started_at <= to_ts
      UNION ALL
      SELECT user_id, started_at,
        GREATEST(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60.0, 0) AS minutes
      FROM exercise_sessions
      WHERE started_at >= from_ts AND started_at <= to_ts
        AND completed_at IS NOT NULL
    ) raw
    GROUP BY user_id, started_at::date
    HAVING SUM(minutes) > 0
  ) daily;
$$;

GRANT EXECUTE ON FUNCTION get_avg_minutes_per_active_user_day(timestamptz, timestamptz) TO authenticated;
