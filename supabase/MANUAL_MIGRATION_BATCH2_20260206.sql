/**
 * Combined Migration Script - Batch 2
 * 
 * Run this in Supabase DEV SQL Editor manually.
 * 
 * Contains:
 * 1. Add tags system to tracks (TEXT[])
 * 2. Add recommendation fields (difficulty, KP, media_type)
 * 
 * @package DechBar_App
 * @subpackage Supabase/Migrations
 * @since 2.47.2
 */

-- ============================================================
-- MIGRATION 1: Add Tags System
-- ============================================================

-- Add tags column
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add GIN index for fast tag searching
CREATE INDEX IF NOT EXISTS idx_tracks_tags
  ON public.tracks USING GIN (tags);

-- Comments
COMMENT ON COLUMN public.tracks.tags IS 
  'Array of tags for flexible categorization (e.g., ["Ráno", "Energie", "Klid"]). Searchable via GIN index.';

-- ============================================================
-- MIGRATION 2: Add Recommendation Fields
-- ============================================================

-- Difficulty Level (for progressive training)
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (
  difficulty_level IN ('easy', 'medium', 'hard', 'extreme')
);

-- KP Suitability (Control Pause recommendation)
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS kp_suitability TEXT CHECK (
  kp_suitability IN ('pod-10s', '11s-20s', '20s-30s', 'nad-30s')
);

-- Media Type (audio vs video)
ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (
  media_type IN ('audio', 'video')
) DEFAULT 'audio';

-- ============================================================
-- Add indexes for filtering
-- ============================================================

-- Difficulty index (partial - only non-null)
CREATE INDEX IF NOT EXISTS idx_tracks_difficulty
  ON public.tracks(difficulty_level)
  WHERE difficulty_level IS NOT NULL;

-- KP suitability index (partial - only non-null)
CREATE INDEX IF NOT EXISTS idx_tracks_kp
  ON public.tracks(kp_suitability)
  WHERE kp_suitability IS NOT NULL;

-- Media type index (full)
CREATE INDEX IF NOT EXISTS idx_tracks_media_type
  ON public.tracks(media_type);

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN public.tracks.difficulty_level IS 
  'Track difficulty for progressive training: easy (beginners), medium (intermediate), hard (advanced), extreme (experts)';

COMMENT ON COLUMN public.tracks.kp_suitability IS 
  'Recommended Control Pause range: pod-10s (KP <10s), 11s-20s (KP 11-20s), 20s-30s (KP 20-30s), nad-30s (KP >30s). Used for personalized recommendations.';

COMMENT ON COLUMN public.tracks.media_type IS 
  'Content type: audio (audio-only) or video (visual instructions)';

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- Check all new columns
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('tags', 'difficulty_level', 'kp_suitability', 'media_type')
ORDER BY ordinal_position;

-- Check all indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tracks' 
  AND indexname IN ('idx_tracks_tags', 'idx_tracks_difficulty', 'idx_tracks_kp', 'idx_tracks_media_type');

-- Test: Select tracks with new fields
SELECT 
  id, 
  title, 
  difficulty_level,
  kp_suitability,
  media_type,
  tags 
FROM public.tracks 
LIMIT 5;

-- Test: Filter by KP (example query)
-- SELECT * FROM public.tracks WHERE kp_suitability = '11s-20s';

-- Test: Filter by difficulty + media_type (example)
-- SELECT * FROM public.tracks WHERE difficulty_level = 'medium' AND media_type = 'audio';

-- Test: Search by tags (array containment)
-- SELECT * FROM public.tracks WHERE tags @> ARRAY['Ráno', 'Energie'];
