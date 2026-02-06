-- =====================================================
-- Migration: Add Exercise Format, Intensity, Narration
-- Version: 2.48.0
-- Date: 2026-02-06
-- Description: Přidání polí pro kategorizaci cvičení (dechpresso, breathwork, meditace)
-- =====================================================

-- Add exercise_format column (typ cvičení)
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS exercise_format TEXT CHECK (exercise_format IN ('dechpresso', 'meditace', 'breathwork'));

-- Add intensity_level column (fyzická intenzita)
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS intensity_level TEXT CHECK (intensity_level IN ('jemna', 'stredni', 'vysoka', 'extremni'));

-- Add narration_type column (typ narace)
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS narration_type TEXT CHECK (narration_type IN ('pribeh', 'bez-pribehu', 'guided'));

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_tracks_exercise_format ON tracks(exercise_format);
CREATE INDEX IF NOT EXISTS idx_tracks_intensity_level ON tracks(intensity_level);
CREATE INDEX IF NOT EXISTS idx_tracks_narration_type ON tracks(narration_type);

-- Add comment for documentation
COMMENT ON COLUMN tracks.exercise_format IS 'Typ cvičení: dechpresso (krátké intenzivní), meditace (delší funkční), breathwork (dlouhé transformační)';
COMMENT ON COLUMN tracks.intensity_level IS 'Fyzická intenzita cvičení: jemna, stredni, vysoka, extremni';
COMMENT ON COLUMN tracks.narration_type IS 'Typ narace: pribeh (příběhové vedení), bez-pribehu (jen pokyny), guided (detailní vedení)';
