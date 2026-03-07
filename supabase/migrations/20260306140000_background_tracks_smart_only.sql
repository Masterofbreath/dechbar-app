-- Migration: add smart_only flag to background_tracks
-- Date: 2026-03-06
-- Purpose: Allow admin to mark background tracks as exclusive to SMART CVIČENÍ.
--          TrackSelector uses this flag to show tracks only in the SMART audio section,
--          hiding them from the standard protocol/exercise track list.
--
-- smart_only = true  → track appears ONLY in SMART settings, hidden from standard settings
-- smart_only = false → track appears in standard settings (default, backward compatible)

ALTER TABLE public.background_tracks
  ADD COLUMN IF NOT EXISTS smart_only BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.background_tracks.smart_only IS
  'If true, this track is exclusive to SMART CVIČENÍ. Hidden from standard exercise track selector.';

CREATE INDEX IF NOT EXISTS idx_background_tracks_smart_only
  ON public.background_tracks (smart_only, is_active);
