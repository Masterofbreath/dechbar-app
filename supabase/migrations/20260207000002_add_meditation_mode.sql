-- Migration: Add meditation mode support
-- Date: 2026-02-06
-- Description: Adds is_meditation_mode column to exercises table

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS is_meditation_mode BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.exercises.is_meditation_mode IS 'If true, session runs as meditation (no breathing pattern guidance)';

-- Index for filtering meditation exercises
CREATE INDEX IF NOT EXISTS exercises_meditation_idx 
  ON public.exercises(is_meditation_mode) 
  WHERE is_meditation_mode = true;
