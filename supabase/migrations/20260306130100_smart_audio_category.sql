-- Migration: smart_audio_category
-- Date: 2026-03-06
-- Purpose: Add 'smart-session' background music category for SMART CVIČENÍ.
--          Admin will upload tracks tagged for SMART sessions into this category.
--
-- References: dechbar-app/docs/features/SMART_EXERCISE_SPEC.md section 7

INSERT INTO public.background_categories (slug, name, sort_order)
VALUES ('smart-session', 'SMART CVIČENÍ', 50)
ON CONFLICT (slug) DO NOTHING;
