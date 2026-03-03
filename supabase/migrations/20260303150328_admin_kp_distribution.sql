-- ============================================================
-- Migration: Admin KP Distribution Analytics Functions
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Purpose: RPC funkce pro KP distribuce blok v admin analytice.
--   admin_get_kp_distribution() → histogram bucketů KP hodnot
--   admin_get_kp_coverage()     → coverage statistiky + celkový průměr
-- Auth: SECURITY DEFINER, GRANT TO authenticated (admin check na route level)
-- ============================================================

-- ── Funkce 1: KP distribuce po bucketech ─────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_kp_distribution()
RETURNS TABLE (
  bucket_label   text,
  bucket_min     integer,
  bucket_max     integer,
  user_count     integer,
  avg_seconds    numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_kp AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      value_seconds
    FROM kp_measurements
    WHERE is_valid = true
    ORDER BY user_id, measured_at DESC
  ),
  bucketed AS (
    SELECT
      CASE
        WHEN value_seconds BETWEEN 1  AND 10 THEN '1–10 s'
        WHEN value_seconds BETWEEN 11 AND 20 THEN '11–20 s'
        WHEN value_seconds BETWEEN 21 AND 30 THEN '21–30 s'
        WHEN value_seconds BETWEEN 31 AND 40 THEN '31–40 s'
        WHEN value_seconds BETWEEN 41 AND 60 THEN '41–60 s'
        ELSE '60s+'
      END AS bucket_label,
      CASE
        WHEN value_seconds BETWEEN 1  AND 10 THEN 1
        WHEN value_seconds BETWEEN 11 AND 20 THEN 11
        WHEN value_seconds BETWEEN 21 AND 30 THEN 21
        WHEN value_seconds BETWEEN 31 AND 40 THEN 31
        WHEN value_seconds BETWEEN 41 AND 60 THEN 41
        ELSE 61
      END AS bucket_min,
      value_seconds
    FROM latest_kp
  )
  SELECT
    bucket_label,
    bucket_min,
    CASE
      WHEN bucket_min = 61 THEN 600
      ELSE bucket_min + 9
    END AS bucket_max,
    COUNT(*)::integer                AS user_count,
    ROUND(AVG(value_seconds), 1)     AS avg_seconds
  FROM bucketed
  GROUP BY bucket_label, bucket_min
  ORDER BY bucket_min;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_distribution() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_distribution() TO authenticated;

-- ── Funkce 2: KP coverage a celkový průměr ────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_kp_coverage()
RETURNS TABLE (
  measured_count      integer,
  not_measured_count  integer,
  total_users         integer,
  coverage_pct        numeric,
  overall_avg_seconds numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest_kp AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      value_seconds
    FROM kp_measurements
    WHERE is_valid = true
    ORDER BY user_id, measured_at DESC
  )
  SELECT
    COUNT(DISTINCT lk.user_id)::integer                                              AS measured_count,
    (COUNT(DISTINCT p.user_id) - COUNT(DISTINCT lk.user_id))::integer               AS not_measured_count,
    COUNT(DISTINCT p.user_id)::integer                                               AS total_users,
    ROUND(
      COUNT(DISTINCT lk.user_id)::numeric
      / NULLIF(COUNT(DISTINCT p.user_id), 0) * 100,
      1
    )                                                                                AS coverage_pct,
    ROUND(AVG(lk.value_seconds), 1)                                                  AS overall_avg_seconds
  FROM profiles p
  LEFT JOIN latest_kp lk ON lk.user_id = p.user_id;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_coverage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_coverage() TO authenticated;
