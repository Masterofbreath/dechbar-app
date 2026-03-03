-- ============================================================
-- Migration: Admin KP Progress & Monthly Trend RPC funkce
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Riziko: NULOVÉ — pouze přidání nových funkcí, nic se nemění
--
-- Funkce:
--   admin_get_kp_progress()       → kohortnový progres uživatelů
--   admin_get_kp_monthly_trend()  → medián komunity po měsících
-- ============================================================


-- ── 1. admin_get_kp_progress() ───────────────────────────────
-- Vrátí agregovaný progres uživatelů kteří mají alespoň 2 validní
-- měření s odstupem min. 14 dní (jinak je to šum, ne progres).
--
-- Definice progresu:
--   baseline_kp = průměr měření z prvních 3 unikátních kalendářních dnů
--   current_kp  = poslední validní měření
--   delta       = current_kp - baseline_kp
--
-- Proč 3 dny průměr jako baseline (ne jen první měření):
--   První měření bývá zkreslené (nervozita, neznalost techniky).
--   Průměr z prvních 3 dnů je stabilnější startovní čára.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_kp_progress()
RETURNS TABLE (
  users_with_progress       integer,   -- uživatelé s alespoň 2 měřeními (14d+ odstup)
  users_improved            integer,   -- z nich: ti co se zlepšili (delta > 0)
  users_declined            integer,   -- ti co mají delta < 0
  users_stable              integer,   -- delta = 0
  improved_pct              numeric,   -- % zlepšených z těch s progresem
  avg_delta_seconds         numeric,   -- průměrná delta (všichni s progresem)
  median_delta_seconds      numeric,   -- medián delty (odolný vůči outlierům)
  avg_delta_improved_only   numeric,   -- průměrná delta jen u zlepšených
  min_days_tracked          integer,   -- nejkratší sledování (dny)
  max_days_tracked          integer,   -- nejdelší sledování (dny)
  avg_days_tracked          numeric    -- průměrná délka sledování (dny)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH

  -- Všechna validní měření, seřazená per user
  user_measurements AS (
    SELECT
      user_id,
      value_seconds,
      measured_at::date AS measured_date,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY measured_at ASC)  AS rn_asc,
      ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY measured_at DESC) AS rn_desc
    FROM kp_measurements
    WHERE is_valid = true
  ),

  -- Baseline: průměr z prvních 3 unikátních dnů měření per user
  user_baseline AS (
    SELECT
      user_id,
      ROUND(AVG(value_seconds), 1) AS baseline_kp
    FROM (
      SELECT DISTINCT ON (user_id, measured_date)
        user_id,
        measured_date,
        value_seconds
      FROM user_measurements
      ORDER BY user_id, measured_date ASC
    ) first_days
    WHERE rn_asc IS NULL OR true  -- všechny záznamy z DISTINCT ON
    GROUP BY user_id
    HAVING COUNT(DISTINCT measured_date) >= 1
    -- Omezit na max 3 první dny
    AND measured_date <= (
      SELECT (MIN(m2.measured_date) + INTERVAL '2 days')::date
      FROM user_measurements m2
      WHERE m2.user_id = first_days.user_id
    )
  ),

  -- Přepsat baseline správně — DISTINCT ON + LIMIT per user
  baseline_clean AS (
    SELECT
      user_id,
      ROUND(AVG(value_seconds), 1) AS baseline_kp,
      MIN(measured_at)             AS first_measured_at
    FROM (
      SELECT
        user_id,
        value_seconds,
        measured_at,
        measured_at::date AS day,
        DENSE_RANK() OVER (PARTITION BY user_id ORDER BY measured_at::date ASC) AS day_rank
      FROM kp_measurements
      WHERE is_valid = true
    ) ranked
    WHERE day_rank <= 3
    GROUP BY user_id
  ),

  -- Poslední měření per user
  latest AS (
    SELECT DISTINCT ON (user_id)
      user_id,
      value_seconds  AS current_kp,
      measured_at    AS last_measured_at
    FROM kp_measurements
    WHERE is_valid = true
    ORDER BY user_id, measured_at DESC
  ),

  -- Spojit baseline + latest, filtrovat min. 14 dní odstup
  progress AS (
    SELECT
      b.user_id,
      b.baseline_kp,
      l.current_kp,
      ROUND((l.current_kp - b.baseline_kp)::numeric, 1) AS delta,
      EXTRACT(DAY FROM (l.last_measured_at - b.first_measured_at))::integer AS days_tracked
    FROM baseline_clean b
    JOIN latest l ON l.user_id = b.user_id
    WHERE EXTRACT(DAY FROM (l.last_measured_at - b.first_measured_at)) >= 14
  )

  SELECT
    COUNT(*)::integer                                                          AS users_with_progress,
    COUNT(CASE WHEN delta > 0 THEN 1 END)::integer                            AS users_improved,
    COUNT(CASE WHEN delta < 0 THEN 1 END)::integer                            AS users_declined,
    COUNT(CASE WHEN delta = 0 THEN 1 END)::integer                            AS users_stable,
    ROUND(
      COUNT(CASE WHEN delta > 0 THEN 1 END)::numeric
        / NULLIF(COUNT(*), 0) * 100,
      1
    )                                                                          AS improved_pct,
    ROUND(AVG(delta), 1)                                                       AS avg_delta_seconds,
    ROUND(
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delta)::numeric,
      1
    )                                                                          AS median_delta_seconds,
    ROUND(AVG(CASE WHEN delta > 0 THEN delta END), 1)                         AS avg_delta_improved_only,
    MIN(days_tracked)                                                          AS min_days_tracked,
    MAX(days_tracked)                                                          AS max_days_tracked,
    ROUND(AVG(days_tracked), 0)                                                AS avg_days_tracked
  FROM progress;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_progress() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_progress() TO authenticated;


-- ── 2. admin_get_kp_monthly_trend() ──────────────────────────
-- Vrátí medián KP komunity per kalendářní měsíc.
-- Bere POUZE poslední měření každého uživatele v daném měsíci
-- (= jeho "stav na konci měsíce").
--
-- Proč medián a ne průměr: outlier s 84s by deformoval celý měsíc.
-- Proč poslední měření v měsíci: nejreprezentativnější stav.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_kp_monthly_trend()
RETURNS TABLE (
  month_start        date,      -- první den měsíce (pro řazení a zobrazení)
  month_label        text,      -- "2026-03" formát pro frontend
  active_users       integer,   -- počet uživatelů kteří měřili v daném měsíci
  median_kp          numeric,   -- medián KP komunity v daném měsíci
  avg_kp             numeric,   -- průměr (pro referenci, ale méně spolehlivý)
  min_kp             integer,   -- minimum
  max_kp             integer    -- maximum
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH

  -- Poslední měření každého uživatele v každém měsíci
  monthly_last AS (
    SELECT DISTINCT ON (user_id, DATE_TRUNC('month', measured_at))
      user_id,
      value_seconds,
      DATE_TRUNC('month', measured_at)::date AS month_start
    FROM kp_measurements
    WHERE is_valid = true
    ORDER BY
      user_id,
      DATE_TRUNC('month', measured_at),
      measured_at DESC
  )

  SELECT
    month_start,
    TO_CHAR(month_start, 'YYYY-MM')                                       AS month_label,
    COUNT(DISTINCT user_id)::integer                                       AS active_users,
    ROUND(
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value_seconds)::numeric,
      1
    )                                                                      AS median_kp,
    ROUND(AVG(value_seconds), 1)                                           AS avg_kp,
    MIN(value_seconds)                                                     AS min_kp,
    MAX(value_seconds)                                                     AS max_kp
  FROM monthly_last
  GROUP BY month_start
  ORDER BY month_start ASC;
$$;

REVOKE ALL ON FUNCTION public.admin_get_kp_monthly_trend() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_kp_monthly_trend() TO authenticated;
