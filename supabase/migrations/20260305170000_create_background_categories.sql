-- Migration: Create background_categories table
-- Date: 2026-03-05
-- Purpose: Allow admin to manage background music categories dynamically.
--          background_tracks.category references category slug (text, no FK — backward compat).

CREATE TABLE IF NOT EXISTS public.background_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.background_categories IS
  'Admin-managed categories for background_tracks. slug matches background_tracks.category.';

-- Seed existing 4 categories
INSERT INTO public.background_categories (slug, name, sort_order) VALUES
  ('nature',   'Příroda',     10),
  ('binaural', 'Binaurální',  20),
  ('tibetan',  'Tibetské',    30),
  ('yogic',    'Jógické',     40)
ON CONFLICT (slug) DO NOTHING;

-- Index for sort_order queries
CREATE INDEX IF NOT EXISTS idx_background_categories_sort
  ON public.background_categories (sort_order, is_active);

-- RLS
ALTER TABLE public.background_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active background categories"
  ON public.background_categories
  FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admin all on background_categories"
  ON public.background_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.id IN ('admin', 'ceo')
    )
  );
