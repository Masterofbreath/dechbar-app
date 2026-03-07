-- Migration: smart_exercise_enhancements
-- Date: 2026-03-06
-- Purpose: Extend smart_exercise_recommendations and exercise_sessions tables
--          to support SMART CVIČENÍ feature (Breath Intelligence Engine).
--
-- Changes:
--   1. smart_exercise_recommendations: add current_level, session_count_smart,
--      preferred_duration_seconds, time_context, phase_profile columns
--   2. exercise_sessions: extend session_type CHECK constraint to include 'smart',
--      add smart_context JSONB column
--
-- References: dechbar-app/docs/features/SMART_EXERCISE_SPEC.md sections 3.2

-- =====================================================================
-- 1. smart_exercise_recommendations — add SMART engine columns
-- =====================================================================

ALTER TABLE public.smart_exercise_recommendations
  ADD COLUMN IF NOT EXISTS current_level INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS session_count_smart INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_duration_seconds INTEGER NOT NULL DEFAULT 420,
  ADD COLUMN IF NOT EXISTS time_context TEXT NOT NULL DEFAULT 'day'
    CHECK (time_context IN ('morning', 'day', 'evening', 'night')),
  ADD COLUMN IF NOT EXISTS phase_profile TEXT NOT NULL DEFAULT 'standard'
    CHECK (phase_profile IN ('standard', 'dynamic_day', 'evening_humming'));

COMMENT ON COLUMN public.smart_exercise_recommendations.current_level
  IS 'Index into BREATH_LEVELS scale (1–21). Current optimal level for this user.';

COMMENT ON COLUMN public.smart_exercise_recommendations.session_count_smart
  IS 'Number of completed SMART sessions. Below 10 = calibration phase.';

COMMENT ON COLUMN public.smart_exercise_recommendations.preferred_duration_seconds
  IS 'Last resolved duration in seconds (420 = 7 min default). Derived from smartDurationMode.';

COMMENT ON COLUMN public.smart_exercise_recommendations.time_context
  IS 'Time of day context at last BIE computation: morning|day|evening|night.';

COMMENT ON COLUMN public.smart_exercise_recommendations.phase_profile
  IS 'Multi-phase profile used at last computation: standard|dynamic_day|evening_humming.';

-- =====================================================================
-- 2. exercise_sessions — extend session_type + add smart_context JSONB
-- =====================================================================

-- Drop existing CHECK constraint (name may vary across environments — use IF EXISTS pattern)
DO $$
BEGIN
  ALTER TABLE public.exercise_sessions
    DROP CONSTRAINT IF EXISTS exercise_sessions_session_type_check;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Constraint may not exist yet — safe to continue
END $$;

-- Add new CHECK constraint including 'smart'
ALTER TABLE public.exercise_sessions
  ADD CONSTRAINT exercise_sessions_session_type_check
    CHECK (session_type IN ('preset', 'custom', 'smart'));

-- Add smart_context JSONB (NULL for non-smart sessions)
ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS smart_context JSONB DEFAULT NULL;

COMMENT ON COLUMN public.exercise_sessions.smart_context
  IS 'Full SMART session context: level used, phase profile, KP snapshot, time_context, base_rhythm. NULL for non-smart sessions. Critical for future AI COACH analysis.';

-- Index for fast SMART session queries (BIE rolling window)
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_smart
  ON public.exercise_sessions (user_id, session_type, was_completed, started_at DESC)
  WHERE session_type = 'smart';
