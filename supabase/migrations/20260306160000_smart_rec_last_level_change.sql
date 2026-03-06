-- Migration: Add last_level_change_at to smart_exercise_recommendations
-- Purpose: Track when the BIE last changed the user's SMART level.
--          Used by Tier 5 Progression Gate to rate-limit level advances.

ALTER TABLE public.smart_exercise_recommendations
  ADD COLUMN IF NOT EXISTS last_level_change_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.smart_exercise_recommendations.last_level_change_at
  IS 'ISO timestamp of the last BIE-triggered level change. NULL = never changed (cold start). Used by Tier 5 Progression Gate.';
