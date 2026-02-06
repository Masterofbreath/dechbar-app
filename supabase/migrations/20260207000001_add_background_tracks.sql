-- Migration: Add background_tracks table
-- Date: 2026-02-06
-- Description: Creates background_tracks table for ambient music during sessions

CREATE TABLE IF NOT EXISTS public.background_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER NOT NULL,
  cdn_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  required_tier TEXT NOT NULL DEFAULT 'ZDARMA',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.background_tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active tracks
CREATE POLICY "Anyone can view active tracks"
  ON public.background_tracks FOR SELECT
  USING (is_active = true);

-- Indexes for performance
CREATE INDEX background_tracks_category_idx ON public.background_tracks(category);
CREATE INDEX background_tracks_tier_idx ON public.background_tracks(required_tier);
CREATE INDEX background_tracks_slug_idx ON public.background_tracks(slug);

-- Comments for documentation
COMMENT ON TABLE public.background_tracks IS 'Background music tracks for breathing sessions';
COMMENT ON COLUMN public.background_tracks.slug IS 'URL-friendly identifier (e.g., nature-forest)';
COMMENT ON COLUMN public.background_tracks.cdn_url IS 'Full Bunny.net CDN URL';
COMMENT ON COLUMN public.background_tracks.required_tier IS 'Minimum membership tier required (ZDARMA, SMART, AI_COACH)';

-- Seed data: 3 ZDARMA tracks
INSERT INTO public.background_tracks (name, slug, category, description, duration_seconds, cdn_url, file_size_bytes, required_tier, sort_order)
VALUES
  ('Příroda - Les', 'nature-forest', 'nature', 'Zpěv ptáků a šumění stromů', 120, 'https://cdn.dechbar.cz/audio/ambient/nature-forest-120s.aac', 4000000, 'ZDARMA', 1),
  ('Příroda - Oceán', 'nature-ocean', 'nature', 'Vlny a mořský vítr', 120, 'https://cdn.dechbar.cz/audio/ambient/nature-ocean-120s.aac', 4000000, 'ZDARMA', 2),
  ('Tibetské mísy', 'tibetan-bowls', 'tibetan', 'Zpívající mísy v ladění 528 Hz', 90, 'https://cdn.dechbar.cz/audio/ambient/tibetan-bowls-90s.aac', 3000000, 'ZDARMA', 3);
