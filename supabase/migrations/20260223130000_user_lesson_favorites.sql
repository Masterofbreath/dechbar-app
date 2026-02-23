-- =====================================================
-- user_lesson_favorites — oblíbené lekce uživatele
-- Date: 2026-02-23
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_lesson_favorites (
  user_id    uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  uuid    NOT NULL REFERENCES public.akademie_lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- RLS
ALTER TABLE public.user_lesson_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own lesson favorites"
  ON public.user_lesson_favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pro rychlé dotazy
CREATE INDEX IF NOT EXISTS idx_user_lesson_favorites_user
  ON public.user_lesson_favorites (user_id);
