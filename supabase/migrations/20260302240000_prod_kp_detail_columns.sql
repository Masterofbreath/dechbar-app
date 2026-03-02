-- ============================================================
-- Migration: kp_measurements — přidání detail sloupců na PROD
-- Date: 2026-03-02
-- Scope: PROD (iqyahebbteiwzwyrtmns)
-- Důvod: PROD měl pouze 11 základních sloupců, DEV má 24.
--        Frontend posílá všechny detail hodnoty — na PROD se ztrácely.
--        HRV data připravena pro budoucí využití.
-- ============================================================

-- Přidat chybějící sloupce (dočasné DEFAULT pro NOT NULL kolonky)
ALTER TABLE public.kp_measurements
  ADD COLUMN IF NOT EXISTS attempt_1_seconds integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attempt_2_seconds integer,
  ADD COLUMN IF NOT EXISTS attempt_3_seconds integer,
  ADD COLUMN IF NOT EXISTS time_of_day character varying NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS hour_of_measurement integer,
  ADD COLUMN IF NOT EXISTS measurement_type character varying DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS device_type character varying,
  ADD COLUMN IF NOT EXISTS measurement_duration_ms integer,
  ADD COLUMN IF NOT EXISTS heart_rate_before integer,
  ADD COLUMN IF NOT EXISTS heart_rate_after integer,
  ADD COLUMN IF NOT EXISTS hrv_data jsonb,
  ADD COLUMN IF NOT EXISTS validation_notes text,
  ADD COLUMN IF NOT EXISTS measured_in_context character varying;

-- Odebrat dočasné DEFAULT hodnoty (DEV je nemá)
ALTER TABLE public.kp_measurements
  ALTER COLUMN attempt_1_seconds DROP DEFAULT,
  ALTER COLUMN time_of_day DROP DEFAULT;

-- Přidat CHECK constrainty shodné s DEV
ALTER TABLE public.kp_measurements
  ADD CONSTRAINT kp_measurements_attempt_1_seconds_check
    CHECK (attempt_1_seconds >= 1 AND attempt_1_seconds <= 600),
  ADD CONSTRAINT kp_measurements_attempt_2_seconds_check
    CHECK (attempt_2_seconds IS NULL OR (attempt_2_seconds >= 1 AND attempt_2_seconds <= 600)),
  ADD CONSTRAINT kp_measurements_attempt_3_seconds_check
    CHECK (attempt_3_seconds IS NULL OR (attempt_3_seconds >= 1 AND attempt_3_seconds <= 600)),
  ADD CONSTRAINT kp_measurements_value_seconds_check
    CHECK (value_seconds >= 1 AND value_seconds <= 600);

SELECT 'kp_measurements: 13 detail columns + CHECK constraints added to PROD' AS status;
