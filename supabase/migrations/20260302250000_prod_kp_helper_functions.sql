-- ============================================================
-- Migration: KP helper SQL funkce na PROD
-- Date: 2026-03-02
-- Scope: PROD (iqyahebbteiwzwyrtmns)
-- Důvod: Funkce existovaly na DEV, PROD je neměl.
--        Frontend je aktuálně nevolá přes RPC — jsou připraveny
--        pro KP dashboard (calculate_weekly_streak) a
--        jako DB-side helpers (get_current_kp, get_first_kp).
-- ============================================================

-- Počet týdnů v řadě s KP měřením
CREATE OR REPLACE FUNCTION public.calculate_weekly_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_week DATE;
  v_previous_week DATE;
BEGIN
  v_current_week := date_trunc('week', CURRENT_DATE);
  
  IF NOT EXISTS (
    SELECT 1 FROM kp_measurements
    WHERE user_id = p_user_id
      AND is_valid = TRUE
      AND measured_at >= v_current_week
  ) THEN
    RETURN 0;
  END IF;
  
  v_streak := 1;
  v_previous_week := v_current_week - INTERVAL '7 days';
  
  WHILE EXISTS (
    SELECT 1 FROM kp_measurements
    WHERE user_id = p_user_id
      AND is_valid = TRUE
      AND measured_at >= v_previous_week
      AND measured_at < v_current_week
  ) LOOP
    v_streak := v_streak + 1;
    v_current_week := v_previous_week;
    v_previous_week := v_previous_week - INTERVAL '7 days';
    IF v_streak > 520 THEN  -- safety limit: 10 years
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_streak;
END;
$$;

-- Poslední naměřená KP hodnota uživatele
CREATE OR REPLACE FUNCTION public.get_current_kp(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kp INTEGER;
BEGIN
  SELECT value_seconds INTO v_kp
  FROM kp_measurements
  WHERE user_id = p_user_id
    AND is_valid = TRUE
  ORDER BY measured_at DESC
  LIMIT 1;
  
  RETURN v_kp;
END;
$$;

-- První ever KP hodnota (baseline od začátku)
CREATE OR REPLACE FUNCTION public.get_first_kp(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_kp INTEGER;
BEGIN
  SELECT value_seconds INTO v_kp
  FROM kp_measurements
  WHERE user_id = p_user_id
    AND is_first_measurement = TRUE
  LIMIT 1;
  
  RETURN v_kp;
END;
$$;
