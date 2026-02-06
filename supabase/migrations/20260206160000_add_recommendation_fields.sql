/**
 * Add Recommendation Fields to Tracks
 * 
 * Adds fields for personalized track recommendations:
 * - difficulty_level: Track difficulty (easy/medium/hard/extreme)
 * - kp_suitability: Recommended for Control Pause ranges (KP)
 * - media_type: Audio or video content
 * 
 * Changes:
 * - Add 3 new columns with ENUM constraints
 * - Add indexes for filtering performance
 * 
 * @package DechBar_App
 * @subpackage Supabase/Migrations
 * @since 2.47.2
 */

-- ============================================================
-- Add recommendation fields
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

CREATE INDEX IF NOT EXISTS idx_tracks_difficulty
  ON public.tracks(difficulty_level)
  WHERE difficulty_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracks_kp
  ON public.tracks(kp_suitability)
  WHERE kp_suitability IS NOT NULL;

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

COMMENT ON INDEX idx_tracks_difficulty IS 
  'Partial index for difficulty filtering (only non-null values)';

COMMENT ON INDEX idx_tracks_kp IS 
  'Partial index for KP-based recommendations (only non-null values)';

COMMENT ON INDEX idx_tracks_media_type IS 
  'Index for media type filtering (audio vs video)';
