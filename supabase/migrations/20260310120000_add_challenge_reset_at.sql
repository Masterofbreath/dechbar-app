-- Migration: add challenge_reset_at to user_active_program
-- Purpose: Allows users to restart a completed challenge from day 1
--          without losing their historical stats (user_lesson_progress stays intact).
--          effectiveStartDate = MAX(user.created_at, launch_date, challenge_reset_at)
-- Date: 2026-03-10

ALTER TABLE public.user_active_program
  ADD COLUMN IF NOT EXISTS challenge_reset_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.user_active_program.challenge_reset_at IS
  'When set, overrides user.created_at as the personal start date for day-unlock calculation. '
  'Used for "restart challenge" feature. NULL = use original registration date logic. '
  'user_lesson_progress records are NOT deleted on reset — stats remain intact.';
