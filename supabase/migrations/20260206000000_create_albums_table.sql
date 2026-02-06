-- =====================================================
-- Migration: Create albums table
-- Date: 2026-02-06
-- Purpose: Albums/Playlists/Challenges/Courses container for organizing tracks
-- =====================================================

-- Albums table for organizing tracks into playlists/challenges/courses
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_url TEXT,
  type TEXT NOT NULL DEFAULT 'decharna'
    CHECK (type IN ('challenge', 'course', 'training', 'decharna')),
  difficulty TEXT DEFAULT 'medium'
    CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  is_locked BOOLEAN DEFAULT false,
  required_tier TEXT DEFAULT 'FREE'
    CHECK (required_tier IN ('FREE', 'SMART', 'AI_COACH')),
  points INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  day_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX albums_type_idx ON public.albums(type);
CREATE INDEX albums_difficulty_idx ON public.albums(difficulty);
CREATE INDEX albums_is_locked_idx ON public.albums(is_locked);

-- RLS Policies
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Everyone can read albums
CREATE POLICY "Anyone can read albums"
  ON public.albums FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage albums
CREATE POLICY "Admins can manage albums"
  ON public.albums FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

COMMENT ON TABLE public.albums IS 'Albums/Playlists/Challenges/Courses container for organizing tracks';
COMMENT ON COLUMN public.albums.type IS 'Album type: challenge (21-day), course (educational), training (specific exercises), decharna (library)';
COMMENT ON COLUMN public.albums.difficulty IS 'Difficulty level for user guidance';
COMMENT ON COLUMN public.albums.required_tier IS 'Minimum membership tier required to access';
COMMENT ON COLUMN public.albums.day_count IS 'Number of days for challenges (e.g., 21 for 21-day challenge)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Albums table created successfully!';
  RAISE NOTICE '✅ RLS policies configured (authenticated users can read, admins can manage)';
  RAISE NOTICE '✅ Indexes created for performance';
END $$;
