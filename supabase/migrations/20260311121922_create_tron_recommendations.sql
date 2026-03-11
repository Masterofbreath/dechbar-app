-- Migration: tron_recommendations
-- Cesta na Trůn — per-user level tracking for walking breath-hold training.
-- Analogous to smart_exercise_recommendations but for dynamic (walking) sessions.
--
-- Design notes:
-- - current_level: 1–21, maps to TRON_LEVELS (holdExhale = level + 2)
-- - session_count: how many completed Trůn sessions (used for calibration phase)
-- - reset_at: soft-reset timestamp — sessions before this are excluded from analytics
--
-- Sessions are stored in exercise_sessions with session_type = 'tron'.

CREATE TABLE IF NOT EXISTS public.tron_recommendations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level        INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 21),
  session_count        INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  last_level_change_at TIMESTAMPTZ,
  reset_at             TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tron_recommendations_user_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.tron_recommendations IS
  'Cesta na Trůn — per-user progress: current level (1–21) and session count for walking breath-hold training.';

-- Indexes
CREATE INDEX IF NOT EXISTS tron_recommendations_user_id_idx
  ON public.tron_recommendations (user_id);

-- RLS
ALTER TABLE public.tron_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tron recommendations"
  ON public.tron_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tron recommendations"
  ON public.tron_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tron recommendations"
  ON public.tron_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tron recommendations"
  ON public.tron_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_tron_recommendations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tron_recommendations_updated_at
  BEFORE UPDATE ON public.tron_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_tron_recommendations_updated_at();
