-- =====================================================
-- Add Difficulty Rating Column
-- Date: 2026-01-19
-- Purpose: Track exercise difficulty perception for AI/teacher insights
-- =====================================================

-- Add difficulty_rating column to exercise_sessions
ALTER TABLE public.exercise_sessions
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 3);

COMMENT ON COLUMN public.exercise_sessions.difficulty_rating IS 'User perceived difficulty: 1=Snadné, 2=Tak akorát, 3=Náročné';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Difficulty rating column added!';
  RAISE NOTICE '📊 Range: 1-3 (1=Easy, 2=Just right, 3=Hard)';
  RAISE NOTICE '🎯 Used for AI personalization and teacher insights';
END $$;
