-- ============================================================
-- Migration: Admin KP Distribution — buckety po 5s
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Důvod: Změna z 6 bucketů po 10s na 11 bucketů po 5s (41–60s jako 1 bucket)
--        pro lepší granularitu dat a přesnější vizualizaci distribuce.
-- ============================================================

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
        WHEN value_seconds BETWEEN 1  AND 5  THEN '1–5 s'
        WHEN value_seconds BETWEEN 6  AND 10 THEN '6–10 s'
        WHEN value_seconds BETWEEN 11 AND 15 THEN '11–15 s'
        WHEN value_seconds BETWEEN 16 AND 20 THEN '16–20 s'
        WHEN value_seconds BETWEEN 21 AND 25 THEN '21–25 s'
        WHEN value_seconds BETWEEN 26 AND 30 THEN '26–30 s'
        WHEN value_seconds BETWEEN 31 AND 35 THEN '31–35 s'
        WHEN value_seconds BETWEEN 36 AND 40 THEN '36–40 s'
        WHEN value_seconds BETWEEN 41 AND 60 THEN '41–60 s'
        ELSE '60s+'
      END AS bucket_label,
      CASE
        WHEN value_seconds BETWEEN 1  AND 5  THEN 1
        WHEN value_seconds BETWEEN 6  AND 10 THEN 6
        WHEN value_seconds BETWEEN 11 AND 15 THEN 11
        WHEN value_seconds BETWEEN 16 AND 20 THEN 16
        WHEN value_seconds BETWEEN 21 AND 25 THEN 21
        WHEN value_seconds BETWEEN 26 AND 30 THEN 26
        WHEN value_seconds BETWEEN 31 AND 35 THEN 31
        WHEN value_seconds BETWEEN 36 AND 40 THEN 36
        WHEN value_seconds BETWEEN 41 AND 60 THEN 41
        ELSE 61
      END AS bucket_min,
      CASE
        WHEN value_seconds BETWEEN 1  AND 5  THEN 5
        WHEN value_seconds BETWEEN 6  AND 10 THEN 10
        WHEN value_seconds BETWEEN 11 AND 15 THEN 15
        WHEN value_seconds BETWEEN 16 AND 20 THEN 20
        WHEN value_seconds BETWEEN 21 AND 25 THEN 25
        WHEN value_seconds BETWEEN 26 AND 30 THEN 30
        WHEN value_seconds BETWEEN 31 AND 35 THEN 35
        WHEN value_seconds BETWEEN 36 AND 40 THEN 40
        WHEN value_seconds BETWEEN 41 AND 60 THEN 60
        ELSE 600
      END AS bucket_max,
      value_seconds
    FROM latest_kp
  )
  SELECT
    bucket_label,
    bucket_min,
    bucket_max,
    COUNT(*)::integer                AS user_count,
    ROUND(AVG(value_seconds), 1)     AS avg_seconds
  FROM bucketed
  GROUP BY bucket_label, bucket_min, bucket_max
  ORDER BY bucket_min;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_distribution() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_distribution() TO authenticated;
