/**
 * Add Tags System to Tracks
 * 
 * Adds PostgreSQL array field for flexible multi-tag support.
 * Allows tracks to have multiple mood/category tags (e.g., ["Ráno", "Energie"]).
 * 
 * Changes:
 * - Add tags column (TEXT[] with default empty array)
 * - Add GIN index for fast array searching
 * 
 * @package DechBar_App
 * @subpackage Supabase/Migrations
 * @since 2.47.1
 */

-- ============================================================
-- Add tags column to tracks
-- ============================================================

ALTER TABLE public.tracks
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- ============================================================
-- Add index for fast tag searching
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tracks_tags
  ON public.tracks USING GIN (tags);

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON COLUMN public.tracks.tags IS 
  'Array of tags for flexible categorization (e.g., ["Ráno", "Energie", "Klid"]). Searchable via GIN index.';

COMMENT ON INDEX idx_tracks_tags IS 
  'GIN index for fast array containment queries (e.g., tags @> ARRAY[''Ráno''])';
