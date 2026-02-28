-- Rozšíření subcategory constraintu o 'hrv'
ALTER TABLE exercises
  DROP CONSTRAINT IF EXISTS exercises_subcategory_check;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_subcategory_check
  CHECK (subcategory IN ('morning', 'evening', 'stress', 'sleep', 'focus', 'energy', 'hrv'));

-- Seed: description + subcategory pro preset cvičení (Box Breathing, Uklidnění, Srdeční koherence)
UPDATE exercises SET
  description = 'Technika 4 | 4 | 4 | 4 pro okamžité soustředění.',
  subcategory = 'focus'
WHERE name = 'Box Breathing'
  AND is_public = true
  AND deleted_at IS NULL;

UPDATE exercises SET
  description = 'Prodloužený výdech pro rychlé uklidnění nervového systému.',
  subcategory = 'stress'
WHERE name = 'Uklidnění'
  AND is_public = true
  AND deleted_at IS NULL;

UPDATE exercises SET
  description = 'Optimální rytmus pro srdeční variabilitu (HRV).',
  subcategory = 'hrv'
WHERE name = 'Srdeční koherence'
  AND is_public = true
  AND deleted_at IS NULL;
