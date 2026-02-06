-- =====================================================
-- Migration: Create tracks table for Audio Player Admin
-- Date: 2026-02-05
-- Author: AI Agent
-- Purpose: Enable admin to manage audio tracks (CRUD operations)
-- =====================================================

-- ============================================================
-- TABLE: tracks
-- ============================================================
-- Audio tracks for DechBar breathing exercises and meditations
-- Managed by admins via /app/admin/media

CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  duration INTEGER NOT NULL, -- Duration in seconds
  audio_url TEXT NOT NULL, -- URL to audio file (Bunny.net CDN or Supabase Storage)
  cover_url TEXT, -- URL to cover image
  description TEXT,
  tags TEXT[], -- Array of tags (e.g., ['meditation', 'morning', 'breathing'])
  is_published BOOLEAN NOT NULL DEFAULT true,
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS (security first!)
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Everyone (authenticated) can read published tracks
CREATE POLICY "Anyone can read published tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Policy 2: Admins can view all tracks (including unpublished)
CREATE POLICY "Admins can view all tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 3: Admins can insert tracks
CREATE POLICY "Admins can insert tracks"
  ON public.tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 4: Admins can update tracks
CREATE POLICY "Admins can update tracks"
  ON public.tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 5: Admins can delete tracks
CREATE POLICY "Admins can delete tracks"
  ON public.tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for search by title (performance)
CREATE INDEX IF NOT EXISTS tracks_title_idx ON public.tracks(title);

-- Index for sorting by created_at (recent first)
CREATE INDEX IF NOT EXISTS tracks_created_at_idx ON public.tracks(created_at DESC);

-- Index for filtering by published status
CREATE INDEX IF NOT EXISTS tracks_is_published_idx ON public.tracks(is_published) WHERE is_published = true;

-- Index for play count (popular tracks)
CREATE INDEX IF NOT EXISTS tracks_play_count_idx ON public.tracks(play_count DESC);

-- Full-text search index (optional but recommended)
CREATE INDEX IF NOT EXISTS tracks_title_search_idx ON public.tracks USING GIN (to_tsvector('simple', title));

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE public.tracks IS 'Audio tracks for DechBar breathing exercises and meditations';
COMMENT ON COLUMN public.tracks.duration IS 'Duration in seconds';
COMMENT ON COLUMN public.tracks.audio_url IS 'URL to audio file (Bunny.net CDN or Supabase Storage)';
COMMENT ON COLUMN public.tracks.tags IS 'Array of tags for categorization (e.g., [''meditation'', ''morning''])';
COMMENT ON COLUMN public.tracks.is_published IS 'Published tracks visible to all users, unpublished only to admins';
COMMENT ON COLUMN public.tracks.play_count IS 'Number of times track was played (incremented on play)';

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================

INSERT INTO public.tracks (title, artist, duration, audio_url, is_published)
VALUES 
  ('Ranní dechové cvičení', 'DechBar', 300, 'https://cdn.example.com/morning-breathing.mp3', true),
  ('Meditace pro začátečníky', 'DechBar', 600, 'https://cdn.example.com/beginner-meditation.mp3', true),
  ('Box Breathing (4-4-4-4)', 'DechBar', 480, 'https://cdn.example.com/box-breathing.mp3', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Table "tracks" created successfully!';
  RAISE NOTICE '✅ RLS policies configured (admins can manage, users can read)';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Sample data inserted (3 tracks)';
  RAISE NOTICE '🎵 Audio Player Admin is now ready!';
END $$;
