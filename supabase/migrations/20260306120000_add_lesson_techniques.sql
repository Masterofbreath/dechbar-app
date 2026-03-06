-- Migration: add_lesson_techniques
-- Purpose: Add primary_technique and secondary_technique columns to akademie_lessons
--          for SMART CVIČENÍ algorithm to track user technique preferences.
--
-- SMART CVIČENÍ reads user_lesson_favorites + user_lesson_progress with JOIN on
-- akademie_lessons.primary_technique to understand what users enjoy
-- (buzeni, vizualizace, pridusenE rty, etc.)
--
-- Note: secondary_technique uses a simple TEXT column without CHECK constraint
--       to allow future technique values without requiring a new migration.
--       primary_technique uses CHECK for data integrity on the primary signal.

ALTER TABLE public.akademie_lessons
  ADD COLUMN primary_technique TEXT DEFAULT NULL,
  ADD COLUMN secondary_technique TEXT DEFAULT NULL;

-- CHECK constraint only on primary_technique (primary signal for SMART algorithm)
ALTER TABLE public.akademie_lessons
  ADD CONSTRAINT akademie_lessons_primary_technique_check
  CHECK (
    primary_technique IS NULL OR primary_technique IN (
      'humming',           -- Bzučení
      'box_breathing',     -- Box Breathing
      'extended_exhale',   -- Prodloužený výdech
      'belly_breathing',   -- Břišní dýchání
      'retention',         -- Zadržení dechu
      'visualization',     -- Vizualizace
      'pursed_lip',        -- Přidušené rty
      'energizing',        -- Energizující
      'other'              -- Ostatní
    )
  );

-- Index on primary_technique for efficient JOIN in SMART algorithm
-- SELECT ... FROM akademie_lessons WHERE primary_technique = $1
CREATE INDEX idx_akademie_lessons_primary_technique
  ON public.akademie_lessons (primary_technique)
  WHERE primary_technique IS NOT NULL;

-- Column comments (for future AI agents and developers)
COMMENT ON COLUMN public.akademie_lessons.primary_technique IS
  'Primární dechová technika lekce. Používá SMART CVIČENÍ algoritmus pro analýzu '
  'uživatelských preferencí (JOIN s user_lesson_favorites + user_lesson_progress). '
  'Povolené hodnoty: humming (Bzučení), box_breathing (Box Breathing), '
  'extended_exhale (Prodloužený výdech), belly_breathing (Břišní dýchání), '
  'retention (Zadržení dechu), visualization (Vizualizace), '
  'pursed_lip (Přidušené rty), energizing (Energizující), other (Ostatní).';

COMMENT ON COLUMN public.akademie_lessons.secondary_technique IS
  'Sekundární dechová technika lekce (volitelná). Bez CHECK constraintu — '
  'umožňuje přidávat nové techniky bez DB migrace. '
  'Stejné hodnoty jako primary_technique, ale rozšiřitelné.';
