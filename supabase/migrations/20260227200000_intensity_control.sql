-- ══════════════════════════════════════════════════════════════════
-- Migration: Intensity Control + Smart Exercise Foundation
-- Date: 2026-02-27
-- Purpose: Track in-session intensity adjustments for SMART CVIČENÍ
--
-- Changes:
--   1. ADD COLUMN exercise_sessions.final_intensity_multiplier
--   2. CREATE TABLE session_intensity_events
--   3. CREATE TABLE smart_exercise_recommendations
--
-- Rollback:
--   ALTER TABLE public.exercise_sessions DROP COLUMN IF EXISTS final_intensity_multiplier;
--   DROP TABLE IF EXISTS public.session_intensity_events;
--   DROP TABLE IF EXISTS public.smart_exercise_recommendations;
-- ══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────
-- 1. Add final_intensity_multiplier to exercise_sessions
--    Denormalized field for quick SMART CVIČENÍ aggregation
--    without needing to JOIN session_intensity_events every time.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS
  final_intensity_multiplier DECIMAL(3,2) DEFAULT 1.0;

COMMENT ON COLUMN public.exercise_sessions.final_intensity_multiplier
  IS 'Breathing rhythm multiplier at session end (0.50–1.50, default 1.0). Denormalized for SMART CVIČENÍ quick queries without JOIN on session_intensity_events.';

-- ──────────────────────────────────────────────────────────────────
-- 2. TABLE: session_intensity_events
--    Raw event log: every +/- tap during an active session.
--    Used by SMART CVIČENÍ to calculate: time spent at each intensity,
--    direction preference (adding vs reducing), final state.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.session_intensity_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  session_id      UUID REFERENCES public.exercise_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Timing: milliseconds elapsed from session start (for duration-at-level analysis)
  occurred_at_ms  INTEGER NOT NULL,

  -- Event data
  action          VARCHAR(4) NOT NULL CHECK (action IN ('up', 'down')),
  multiplier_from DECIMAL(3,2) NOT NULL,
  multiplier_to   DECIMAL(3,2) NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.session_intensity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intensity_events_select_own"
  ON public.session_intensity_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "intensity_events_insert_own"
  ON public.session_intensity_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intensity_events_session
  ON public.session_intensity_events(session_id);

CREATE INDEX IF NOT EXISTS idx_intensity_events_user
  ON public.session_intensity_events(user_id, created_at DESC);

COMMENT ON TABLE public.session_intensity_events
  IS 'Logs each +/- intensity tap during active session. Used by SMART CVIČENÍ to infer optimal breathing rhythm.';
COMMENT ON COLUMN public.session_intensity_events.occurred_at_ms
  IS 'Milliseconds elapsed from session start time. Enables calculating time spent at each intensity level.';
COMMENT ON COLUMN public.session_intensity_events.action
  IS 'up = user increased intensity (longer cycles), down = user decreased intensity (shorter cycles)';

-- ──────────────────────────────────────────────────────────────────
-- 3. TABLE: smart_exercise_recommendations
--    Cached SMART CVIČENÍ recommendation per user.
--    MVP: one row per user (UNIQUE user_id).
--    Future: change to UNIQUE(user_id, time_context) after adding
--    time_context column for morning/afternoon/evening variants.
-- ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.smart_exercise_recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recommended breathing rhythm (OUTPUT of SMART CVIČENÍ engine)
  recommended_inhale_s              DECIMAL(4,1) NOT NULL,
  recommended_hold_after_inhale_s   DECIMAL(4,1) NOT NULL DEFAULT 0,
  recommended_exhale_s              DECIMAL(4,1) NOT NULL,
  recommended_hold_after_exhale_s   DECIMAL(4,1) NOT NULL DEFAULT 0,

  -- Recommendation quality
  confidence_score    DECIMAL(3,2),       -- 0.0–1.0
  data_points_count   INTEGER DEFAULT 0,  -- number of sessions analyzed
  is_ready            BOOLEAN DEFAULT FALSE, -- FALSE until enough data (min 3 sessions)

  -- Context snapshot at generation time (JSONB for forward-compatibility)
  -- Fields: kp_current, kp_trend, avg_multiplier_last10, avg_difficulty_last10,
  --         sessions_last_7d, generated_for_time
  context_snapshot    JSONB DEFAULT '{}',

  -- Lifecycle
  recalculate_after   TIMESTAMPTZ,        -- NULL = recalculate ASAP
  last_calculated_at  TIMESTAMPTZ,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- MVP: one recommendation per user
  -- Future migration: ADD COLUMN time_context + change to UNIQUE(user_id, time_context)
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.smart_exercise_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smart_recs_select_own"
  ON public.smart_exercise_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "smart_recs_insert_own"
  ON public.smart_exercise_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "smart_recs_update_own"
  ON public.smart_exercise_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.smart_exercise_recommendations
  IS 'Cached SMART CVIČENÍ recommendation per user. One row per user (MVP). Future: one per user × time_context (morning/afternoon/evening).';
COMMENT ON COLUMN public.smart_exercise_recommendations.context_snapshot
  IS 'JSONB snapshot of data used for generation: kp_current, kp_trend, avg_multiplier_last10, avg_difficulty_last10, sessions_last_7d, generated_for_time.';
COMMENT ON COLUMN public.smart_exercise_recommendations.is_ready
  IS 'FALSE until minimum 3 sessions with intensity data available. UI shows "not enough data yet" when FALSE.';

DO $$ BEGIN
  RAISE NOTICE 'Migration 20260227200000_intensity_control: OK';
  RAISE NOTICE '  + exercise_sessions.final_intensity_multiplier column';
  RAISE NOTICE '  + session_intensity_events table';
  RAISE NOTICE '  + smart_exercise_recommendations table';
END $$;
