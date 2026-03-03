-- ============================================================
-- Migration: KP Coverage — medián místo průměru
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Důvod: overall_avg_seconds nahrazen overall_median_seconds
--        (PERCENTILE_CONT 0.5) — odolné vůči outlierům (1 uživatel
--        s 84s nedeformuje "typickou" hodnotu komunity).
-- Poznámka: DROP + CREATE nutný kvůli změně return type (Postgres neumí
--           CREATE OR REPLACE při změně signatury RETURNS TABLE).
-- ============================================================

DROP FUNCTION IF EXISTS public.admin_get_kp_coverage();

CREATE FUNCTION public.admin_get_kp_coverage()
RETURNS TABLE (
  measured_count       integer,
  not_measured_count   integer,
  total_users          integer,
  coverage_pct         numeric,
  overall_median_seconds numeric
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
    COUNT(DISTINCT km.user_id)::integer                                    AS measured_count,
    (COUNT(DISTINCT p.user_id) - COUNT(DISTINCT km.user_id))::integer      AS not_measured_count,
    COUNT(DISTINCT p.user_id)::integer                                     AS total_users,
    ROUND(
      COUNT(DISTINCT km.user_id)::numeric
        / NULLIF(COUNT(DISTINCT p.user_id), 0) * 100,
      1
    )                                                                      AS coverage_pct,
    ROUND(
      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value_seconds)
       FROM latest_kp)::numeric,
      1
    )                                                                      AS overall_median_seconds
  FROM profiles p
  LEFT JOIN kp_measurements km
    ON km.user_id = p.user_id
   AND km.is_valid = true;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_coverage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_coverage() TO authenticated;
