-- =====================================================
-- Czech Localization - Complete Translation
-- Date: 2026-01-19
-- Purpose: Translate all English tags, fix difficulty labels, ensure Czech market ready
-- =====================================================

-- =====================================================
-- 1. Update all exercise tags to Czech
-- =====================================================
UPDATE public.exercises SET tags = 
  ARRAY(
    SELECT CASE
      WHEN tag = 'focus' THEN 'fokus'
      WHEN tag = 'calm' THEN 'klid'
      WHEN tag = 'stress' THEN 'stres'
      WHEN tag = 'beginner' THEN 'začátečník'
      WHEN tag = 'morning' THEN 'ranní'
      WHEN tag = 'evening' THEN 'večerní'
      WHEN tag = 'energy' THEN 'energie'
      WHEN tag = 'sleep' THEN 'spánek'
      WHEN tag = 'relaxation' THEN 'relaxace'
      WHEN tag = 'multi-phase' THEN 'vícefázový'
      WHEN tag = 'intermediate' THEN 'mírně-pokročilý'
      WHEN tag = 'advanced' THEN 'pokročilý'
      WHEN tag = 'stress-relief' THEN 'snížení-stresu'
      WHEN tag = 'anxiety-relief' THEN 'úleva-od-úzkosti'
      WHEN tag = 'coherence' THEN 'koherence'
      WHEN tag = 'hrv' THEN 'hrv'
      WHEN tag = 'performance' THEN 'výkon'
      WHEN tag = 'humming' THEN 'bzučení'
      ELSE tag
    END
    FROM unnest(tags) AS tag
  )
WHERE category = 'preset';

-- =====================================================
-- 2. Update difficulty labels (RESET & RÁNO to beginner)
-- =====================================================
-- Make RESET and RÁNO less intimidating for beginners
UPDATE public.exercises
SET difficulty = 'beginner'
WHERE name IN ('RESET', 'RÁNO');

-- =====================================================
-- 3. Ensure descriptions are correct (Czech with purpose)
-- =====================================================

-- RÁNO
UPDATE public.exercises
SET description = 'Ranní aktivace s postupnou progresí dechové frekvence pro povzbuzení do nového dne'
WHERE name = 'RÁNO';

-- RESET  
UPDATE public.exercises
SET description = 'Polední reset s progresivním výdechem a nosním bzučením pro snížení stresu'
WHERE name = 'RESET';

-- NOC
UPDATE public.exercises
SET description = 'Večerní relaxace s hlubokým dýcháním a nosním bzučením pro lepší spánek'
WHERE name = 'NOC';

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Czech localization complete!';
  RAISE NOTICE '🇨🇿 All tags translated to Czech';
  RAISE NOTICE '📊 RESET & RÁNO difficulty: intermediate → beginner';
  RAISE NOTICE '📝 Descriptions updated with purpose statements';
END $$;
