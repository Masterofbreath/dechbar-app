-- Migration: Create voice_packs table
-- Date: 2026-03-05
-- Purpose: Store vocal guidance packs (human voices, AI voices) for breathing sessions.

CREATE TABLE IF NOT EXISTS public.voice_packs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
    -- 'Kubův hlas (CZ)'
  author        TEXT        DEFAULT NULL,
    -- 'Martin Vobořil'
  language      TEXT        NOT NULL DEFAULT 'cs',
    -- 'cs' | 'en' | 'de'
  voice_type    TEXT        NOT NULL DEFAULT 'human',
    -- 'human' | 'ai'
  description   TEXT        DEFAULT NULL,
  preview_url   TEXT        DEFAULT NULL,
    -- Short preview clip URL for Settings voice picker
  required_tier TEXT        NOT NULL DEFAULT 'SMART',
    -- 'ZDARMA' | 'SMART' | 'AI_COACH'
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.voice_packs IS 'Vocal guidance packs with human or AI voices for breathing session coaching.';
COMMENT ON COLUMN public.voice_packs.required_tier IS 'Minimum membership tier: ZDARMA | SMART | AI_COACH';
COMMENT ON COLUMN public.voice_packs.preview_url IS 'Short audio clip for preview in Settings voice selector';

-- RLS
ALTER TABLE public.voice_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active voice packs"
  ON public.voice_packs
  FOR SELECT TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admin all on voice_packs"
  ON public.voice_packs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.id IN ('admin', 'ceo')
    )
  );
