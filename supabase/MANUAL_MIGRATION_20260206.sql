/**
 * Combined Migration Script for Manual Execution
 * 
 * Run this in Supabase DEV SQL Editor manually.
 * 
 * Contains:
 * 1. Fix user_modules RLS policies
 * 2. Add tags system to tracks
 * 
 * @package DechBar_App
 * @subpackage Supabase/Migrations
 * @since 2.47.1
 */

-- ============================================================
-- MIGRATION 1: Fix user_modules RLS Policies
-- ============================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.user_modules;

-- Recreate policies using is_admin() function
CREATE POLICY "Users can view their own modules"
  ON public.user_modules
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all modules"
  ON public.user_modules
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert modules"
  ON public.user_modules
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all modules"
  ON public.user_modules
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete modules"
  ON public.user_modules
  FOR DELETE
  USING (public.is_admin());

-- Comments
COMMENT ON POLICY "Users can view their own modules" ON public.user_modules IS 
  'Users can view their own purchased/unlocked modules';

COMMENT ON POLICY "Admins can view all modules" ON public.user_modules IS 
  'Admins can view all user modules (uses is_admin() function to prevent circular reference)';

COMMENT ON POLICY "Admins can insert modules" ON public.user_modules IS 
  'Admins can assign modules to users';

COMMENT ON POLICY "Admins can update all modules" ON public.user_modules IS 
  'Admins can update module assignments';

COMMENT ON POLICY "Admins can delete modules" ON public.user_modules IS 
  'Admins can remove module assignments';

-- ============================================================
-- MIGRATION 2: Add Tags System to Tracks
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

COMMENT ON INDEX idx_tracks_tags IS 
  'GIN index for fast array containment queries (e.g., tags @> ARRAY[''Ráno''])';

-- ============================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================

-- Check if tags column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tracks' AND column_name = 'tags';

-- Check if index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'tracks' AND indexname = 'idx_tracks_tags';

-- Check user_modules policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_modules'
ORDER BY policyname;

-- Test: Select tracks with tags
SELECT id, title, tags FROM public.tracks LIMIT 5;

-- Test: Search by tag (example)
-- SELECT * FROM public.tracks WHERE tags @> ARRAY['Ráno'];
