-- Migration: get_unique_active_users_in_range
-- Purpose: Returns count of DISTINCT users who had at least one session
--          (audio OR exercise) within the given time range.
--          Used by admin analytics "Aktivní uživatelé" KPI card for
--          multi-day periods (week / month / year) to avoid double-counting
--          the same user across multiple days (sumKpi bug).
--
-- Security: SECURITY DEFINER + search_path guard — bypasses RLS so admin
--           can see all users (same pattern as get_new_registrations_in_range).

CREATE OR REPLACE FUNCTION get_unique_active_users_in_range(
  from_ts timestamptz,
  to_ts   timestamptz
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)
  FROM (
    SELECT user_id
    FROM audio_sessions
    WHERE started_at >= from_ts
      AND started_at <= to_ts
    UNION
    SELECT user_id
    FROM exercise_sessions
    WHERE started_at >= from_ts
      AND started_at <= to_ts
  ) combined;
$$;

-- Allow authenticated users to call (admin check is done at app level via RLS on other tables)
GRANT EXECUTE ON FUNCTION get_unique_active_users_in_range(timestamptz, timestamptz) TO authenticated;
