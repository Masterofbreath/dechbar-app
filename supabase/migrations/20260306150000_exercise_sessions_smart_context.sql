-- Migration: add smart_context column to exercise_sessions
-- Date: 2026-03-06
-- Purpose: Store SMART session BIE snapshot for analytics and progression tracking.
--          Column was referenced in code but missing from DB schema.

ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS smart_context JSONB DEFAULT NULL;

COMMENT ON COLUMN public.exercise_sessions.smart_context IS
  'Snapshot of SMART session context (BIE output) for analytics and progression tracking.';

CREATE INDEX IF NOT EXISTS idx_exercise_sessions_smart
  ON public.exercise_sessions (user_id, session_type, started_at DESC)
  WHERE session_type = 'smart';
