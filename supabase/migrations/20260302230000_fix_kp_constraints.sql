-- ============================================================
-- Migration: KP Measurements — oprava CHECK constraintů
-- Date: 2026-03-02
-- Scope: DEV + PROD
-- Důvod:
--   1. Minimum 10s je příliš přísné — neumožní testování
--      ani krátká měření (nový uživatel < 10s je validní data)
--   2. is_valid bude vždy true — čas měření je metadata,
--      ne důvod pro odmítnutí dat
-- ============================================================

-- Smazat přísné minimum 10s a nahradit 1s (realistická hodnota)
ALTER TABLE public.kp_measurements
  DROP CONSTRAINT IF EXISTS kp_measurements_attempt_1_seconds_check,
  DROP CONSTRAINT IF EXISTS kp_measurements_attempt_2_seconds_check,
  DROP CONSTRAINT IF EXISTS kp_measurements_attempt_3_seconds_check,
  DROP CONSTRAINT IF EXISTS kp_measurements_value_seconds_check;

-- Přidat nové constrainty s 1s minimem
ALTER TABLE public.kp_measurements
  ADD CONSTRAINT kp_measurements_attempt_1_seconds_check
    CHECK (attempt_1_seconds >= 1 AND attempt_1_seconds <= 600),
  ADD CONSTRAINT kp_measurements_attempt_2_seconds_check
    CHECK (attempt_2_seconds IS NULL OR (attempt_2_seconds >= 1 AND attempt_2_seconds <= 600)),
  ADD CONSTRAINT kp_measurements_attempt_3_seconds_check
    CHECK (attempt_3_seconds IS NULL OR (attempt_3_seconds >= 1 AND attempt_3_seconds <= 600)),
  ADD CONSTRAINT kp_measurements_value_seconds_check
    CHECK (value_seconds >= 1 AND value_seconds <= 600);

SELECT 'KP constraints updated: min 10s -> 1s, max 180s -> 600s' AS status;
