-- Migration: Add card_color column to exercises table
-- Date: 2026-02-05
-- Purpose: Enable custom color selection for exercise cards in Exercise Creator

-- Add card_color column with hex validation
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS card_color VARCHAR(7) DEFAULT '#2CBEC6' 
CHECK (card_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN exercises.card_color IS 'Hex color code for exercise card background (8 presets: Teal, Gold, Purple, Green, Red, Blue, Orange, Pink)';

-- Create index for faster filtering of custom exercises
CREATE INDEX IF NOT EXISTS idx_exercises_user_custom 
ON exercises(created_by, category, deleted_at) 
WHERE category = 'custom';

COMMENT ON INDEX idx_exercises_user_custom IS 'Optimize queries for user custom exercises (filtered by soft delete)';
