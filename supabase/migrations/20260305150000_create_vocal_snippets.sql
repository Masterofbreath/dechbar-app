-- Migration: Create vocal_snippets table
-- Date: 2026-03-05
-- Purpose: Store individual audio snippets for vocal guidance system.
--          Snippets are played contextually during breathing sessions based on
--          phase, session progress, trigger conditions, and user KP level.

CREATE TABLE IF NOT EXISTS public.vocal_snippets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_pack_id   UUID        NOT NULL REFERENCES public.voice_packs(id) ON DELETE CASCADE,

  -- Identification and category
  snippet_key     TEXT        NOT NULL,
    -- Group key for variants (multiple rows = shuffle variants):
    -- 'inhale_gentle_start', 'kp_beginner_encourage'
  voice_category  TEXT        NOT NULL,
    -- 'orientation' | 'deep_instruction' | 'final_push' | 'kp_comment'
    -- | 'intensity_down' | 'intensity_up' | 'phase_transition' | 'silence_close'

  -- Content
  text_cz         TEXT        DEFAULT NULL,
    -- Czech transcription for QA and search
  cdn_url         TEXT        NOT NULL,
    -- CDN URL of the audio file

  -- When to play: breathing phase
  phase_context   TEXT        NOT NULL DEFAULT 'any',
    -- 'inhale' | 'hold' | 'exhale' | 'silence' | 'phase_transition' | 'any'

  -- When to play: session progress
  session_moment  TEXT        NOT NULL DEFAULT 'any',
    -- 'first_25pct' | 'mid_50pct' | 'last_25pct' | 'first_cycle' | 'any'

  -- Trigger conditions (AND logic — all must be true)
  trigger_conditions TEXT[]   NOT NULL DEFAULT '{}',
    -- Subset of TriggerCondition enum values.
    -- Empty array = always eligible.
    -- Example: ['KP_BEGINNER', 'SESSION_MID'] = play for beginners in mid-session

  -- Cooldown and limits
  cooldown_cycles INTEGER     NOT NULL DEFAULT 0,
    -- Min breathing cycles before repeating the same snippet_key
  max_per_session INTEGER     NOT NULL DEFAULT 1,
    -- 0 = unlimited

  -- Priority and tier
  priority        INTEGER     NOT NULL DEFAULT 0,
  required_tier   TEXT        NOT NULL DEFAULT 'SMART',
    -- 'ZDARMA' | 'SMART' | 'AI_COACH'

  -- Safety: system won't play if phaseTimeRemaining * 1000 < duration_ms + 500
  duration_ms     INTEGER     DEFAULT NULL,

  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vocal_snippets IS 'Individual audio snippets for contextual vocal guidance during breathing sessions.';
COMMENT ON COLUMN public.vocal_snippets.snippet_key IS 'Group key — multiple rows with same key = shuffle variants';
COMMENT ON COLUMN public.vocal_snippets.trigger_conditions IS 'AND-evaluated TriggerCondition array. Empty = always eligible.';
COMMENT ON COLUMN public.vocal_snippets.duration_ms IS 'Audio duration — safety check to avoid snippets cut off by phase end';

-- Indexes for fast per-voice-pack fetching
CREATE INDEX IF NOT EXISTS vocal_snippets_voice_pack_idx ON public.vocal_snippets(voice_pack_id);
CREATE INDEX IF NOT EXISTS vocal_snippets_category_idx   ON public.vocal_snippets(voice_category);

-- RLS
ALTER TABLE public.vocal_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active snippets"
  ON public.vocal_snippets
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admin all on vocal_snippets"
  ON public.vocal_snippets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.id IN ('admin', 'ceo')
    )
  );
