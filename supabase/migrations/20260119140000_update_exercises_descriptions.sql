-- =====================================================
-- Update Exercise Descriptions & Add Silence Instructions
-- Date: 2026-01-19
-- Purpose: Improve descriptions with purpose, add silence phase instructions
-- =====================================================

-- Update RÁNO description
UPDATE public.exercises
SET description = 'Ranní aktivace s postupnou progresí dechové frekvence pro povzbuzení do nového dne'
WHERE name = 'RÁNO';

-- Update RESET description
UPDATE public.exercises
SET description = 'Polední reset s progresivním výdechem a nosním bzučením pro snížení stresu'
WHERE name = 'RESET';

-- Update silence phase instructions in RÁNO
UPDATE public.exercises
SET breathing_pattern = jsonb_set(
  breathing_pattern,
  '{phases,6,instructions}',
  '"Dýchej ve svém volném rytmu, pozoruj své tělo"'
)
WHERE name = 'RÁNO';

-- Update silence phase instructions in RESET
UPDATE public.exercises
SET breathing_pattern = jsonb_set(
  breathing_pattern,
  '{phases,6,instructions}',
  '"Dýchej ve svém volném rytmu, pozoruj své tělo"'
)
WHERE name = 'RESET';

-- Update silence phase instructions in NOC
UPDATE public.exercises
SET breathing_pattern = jsonb_set(
  breathing_pattern,
  '{phases,4,instructions}',
  '"Dýchej ve svém volném rytmu, pozoruj své tělo"'
)
WHERE name = 'NOC';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Exercise descriptions updated!';
  RAISE NOTICE '📝 RÁNO: Added purpose statement';
  RAISE NOTICE '📝 RESET: Polední (not Poledavní), added purpose';
  RAISE NOTICE '🫁 All silence phases: Added free breathing instruction';
END $$;
