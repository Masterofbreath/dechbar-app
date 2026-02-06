-- =====================================================
-- Migration: Upgrade tracks table schema
-- Date: 2026-02-06
-- Purpose: Add album relationship and category fields to tracks
-- =====================================================

-- Add new columns to tracks table
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS track_order INTEGER DEFAULT 0;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS waveform_peaks FLOAT[];

-- Add category columns
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS duration_category TEXT
  CHECK (duration_category IN ('3-9', '10-25', '26-60', 'kurz', 'reels'));

ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS mood_category TEXT
  CHECK (mood_category IN ('Ráno', 'Energie', 'Klid', 'Soustředění', 'Večer', 'Special'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS tracks_album_id_idx ON public.tracks(album_id);
CREATE INDEX IF NOT EXISTS tracks_track_order_idx ON public.tracks(track_order);
CREATE INDEX IF NOT EXISTS tracks_duration_category_idx ON public.tracks(duration_category);
CREATE INDEX IF NOT EXISTS tracks_mood_category_idx ON public.tracks(mood_category);

-- Comments
COMMENT ON COLUMN public.tracks.album_id IS 'Foreign key to albums table';
COMMENT ON COLUMN public.tracks.track_order IS 'Order within album (for playlists/challenges)';
COMMENT ON COLUMN public.tracks.duration_category IS 'Track length category: 3-9 (short), 10-25 (medium), 26-60 (long), kurz (course), reels (ultra-short)';
COMMENT ON COLUMN public.tracks.mood_category IS 'Mood/state category: Ráno (morning), Energie (energy), Klid (calm), Soustředění (focus), Večer (evening), Special';
COMMENT ON COLUMN public.tracks.waveform_peaks IS 'Array of float values (0-1) for waveform visualization';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Tracks table upgraded successfully!';
  RAISE NOTICE '✅ Added album_id foreign key';
  RAISE NOTICE '✅ Added category columns (duration_category, mood_category)';
  RAISE NOTICE '✅ Added track_order for playlist ordering';
  RAISE NOTICE '✅ Added waveform_peaks for future visualization';
  RAISE NOTICE '✅ Indexes created for performance';
END $$;
