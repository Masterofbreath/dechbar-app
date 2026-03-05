-- Migration: Create breathing_cues table
-- Date: 2026-03-05
-- Purpose: Store configurable audio cues for breathing phases (inhale/hold/exhale/bells)
--          with Web Audio API fallback via generate_hz when cdn_url is NULL.

CREATE TABLE IF NOT EXISTS public.breathing_cues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phase         TEXT        NOT NULL UNIQUE,
    -- 'inhale' | 'hold' | 'exhale' | 'start_bell' | 'end_bell'
  name          TEXT        NOT NULL,
    -- Display name e.g. 'Nádech (963 Hz)'
  cdn_url       TEXT        DEFAULT NULL,
    -- NULL = generate via Web Audio API using generate_hz
  generate_hz   INTEGER     DEFAULT NULL,
    -- Solfeggio frequency: 963 | 639 | 396 | NULL (for bell files)
  playback_rate FLOAT       NOT NULL DEFAULT 1.0,
    -- Pitch variation: 1.0 (inhale), 0.85 (hold), 0.75 (exhale), 0.9 (end_bell)
  duration_ms   INTEGER     DEFAULT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.breathing_cues IS 'Audio cues for breathing phase transitions. cdn_url = NULL means generate tone via Web Audio API.';
COMMENT ON COLUMN public.breathing_cues.phase IS 'Unique phase key: inhale | hold | exhale | start_bell | end_bell';
COMMENT ON COLUMN public.breathing_cues.generate_hz IS 'Solfeggio frequency to generate if cdn_url is NULL';
COMMENT ON COLUMN public.breathing_cues.playback_rate IS 'Audio playback rate for pitch variation (used for bell variants from single file)';

-- Seed: 5 required cue records
INSERT INTO public.breathing_cues (phase, name, cdn_url, generate_hz, playback_rate) VALUES
  ('inhale',     'Nádech (963 Hz)',  NULL, 963,  1.0),
  ('hold',       'Zádrž (639 Hz)',   NULL, 639,  1.0),
  ('exhale',     'Výdech (396 Hz)',  NULL, 396,  1.0),
  ('start_bell', 'Start Bell',       NULL, NULL, 1.0),
  ('end_bell',   'End Bell',         NULL, NULL, 0.9)
ON CONFLICT (phase) DO NOTHING;

-- RLS
ALTER TABLE public.breathing_cues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active cues"
  ON public.breathing_cues
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admin all on breathing_cues"
  ON public.breathing_cues
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.id IN ('admin', 'ceo')
    )
  );
