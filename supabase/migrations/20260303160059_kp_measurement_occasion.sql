-- ============================================================
-- Migration: kp_measurements — přidat measurement_occasion
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Riziko: NULOVÉ — nullable sloupec, žádná breaking change
--
-- Účel:
--   Formalizuje záměrná, periodická měření (úplněk, nov, challenge)
--   odlišená od spontánních měření. Klíčový základ pro výpočet
--   kohortnového progresu komunity — porovnáváme jen srovnatelná
--   měření ve stejném rituálním kontextu.
--
-- Hodnoty:
--   NULL            = spontánní měření (dosavadní chování, default)
--   'new_moon'      = měření k novu
--   'full_moon'     = měření k úplňku
--   'monthly'       = obecné měsíční měření
--   'challenge_start' = vstupní KP při začátku challenge
--   'challenge_end'   = výstupní KP po challenge
--   'event'         = měření spojené s live vysíláním / eventem
-- ============================================================

ALTER TABLE public.kp_measurements
  ADD COLUMN IF NOT EXISTS measurement_occasion VARCHAR(32) DEFAULT NULL;

COMMENT ON COLUMN public.kp_measurements.measurement_occasion IS
  'Záměrný kontext měření: new_moon | full_moon | monthly | challenge_start | challenge_end | event | NULL (spontánní)';
