-- =====================================================
-- Migration: Akademie Module — Program REŽIM
-- Date: 2026-02-21
-- Author: AI Agent
-- Purpose: Create akademie content tables (categories, programs,
--          series, lessons, progress) for Program REŽIM.
--
-- Strategy: Varianta A — reuse existing modules + user_modules
--           for access control (no new purchase pipeline).
--
-- Seed: Digitální ticho (already in modules table as 'digitalni-ticho')
-- =====================================================

-- ============================================================
-- EXTENSION: UUID generation (safe - already likely enabled)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: akademie_categories
-- Kategorie obsahu v Akademii (REŽIM, Výzvy, ...)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.akademie_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  icon        text        NULL,                 -- SVG path or icon identifier
  description text        NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akademie_categories_sort_idx
  ON public.akademie_categories (sort_order, is_active);

COMMENT ON TABLE public.akademie_categories
  IS 'Kategorie Akademie (Program REŽIM, Výzvy, ...). Škálovatelné — přidání nové kategorie = nový řádek.';

-- ============================================================
-- TABLE: akademie_programs
-- Bridge tabulka: propojuje kategorii s existujícím modules.id
-- ============================================================
CREATE TABLE IF NOT EXISTS public.akademie_programs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        text        NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  category_id      uuid        NOT NULL REFERENCES public.akademie_categories(id) ON DELETE CASCADE,
  description_long text        NULL,            -- Detailní popis programu (zobrazený v ProgramDetail)
  cover_image_url  text        NULL,            -- Bunny CDN URL
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, category_id)
);

CREATE INDEX IF NOT EXISTS akademie_programs_category_idx
  ON public.akademie_programs (category_id, sort_order);

CREATE INDEX IF NOT EXISTS akademie_programs_module_idx
  ON public.akademie_programs (module_id);

COMMENT ON TABLE public.akademie_programs
  IS 'Propojení programů (modules) s kategoriemi Akademie. Access control zůstává v user_modules.';

-- ============================================================
-- TABLE: akademie_series
-- Týdenní série v rámci programu
-- ============================================================
CREATE TABLE IF NOT EXISTS public.akademie_series (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        text        NOT NULL,        -- 'digitalni-ticho' — pro rychlý access check
  series_module_id text        NULL,            -- 'serie-pribeh' — pro budoucí granulární nákup série
  name             text        NOT NULL,
  description      text        NULL,
  week_number      int         NOT NULL,
  sort_order       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akademie_series_module_idx
  ON public.akademie_series (module_id, sort_order);

COMMENT ON TABLE public.akademie_series
  IS 'Týdenní série v rámci programu. series_module_id umožní budoucí granulární nákup série.';

-- ============================================================
-- TABLE: akademie_lessons
-- Jednotlivé lekce (audio soubory)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.akademie_lessons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id        uuid        NOT NULL REFERENCES public.akademie_series(id) ON DELETE CASCADE,
  module_id        text        NOT NULL,        -- 'digitalni-ticho' — přímý access check bez joinu
  title            text        NOT NULL,
  audio_url        text        NOT NULL,        -- Bunny CDN URL
  duration_seconds int         NOT NULL DEFAULT 0,
  day_number       int         NOT NULL,        -- 1–21 v rámci programu
  sort_order       int         NOT NULL DEFAULT 0,
  is_published     boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS akademie_lessons_series_idx
  ON public.akademie_lessons (series_id, sort_order);

CREATE INDEX IF NOT EXISTS akademie_lessons_module_idx
  ON public.akademie_lessons (module_id, day_number);

COMMENT ON TABLE public.akademie_lessons
  IS 'Lekce = jednotlivé audio soubory. day_number = pozice v rámci celého programu (1–21).';

-- ============================================================
-- TABLE: user_lesson_progress
-- Progres uživatele — splněné lekce (80% threshold)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  user_id              uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id            uuid        NOT NULL REFERENCES public.akademie_lessons(id) ON DELETE CASCADE,
  completed_at         timestamptz NOT NULL DEFAULT now(),
  play_duration_seconds int        NOT NULL DEFAULT 0,  -- Skutečně poslouchané sekundy
  PRIMARY KEY (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_lesson_progress_user_idx
  ON public.user_lesson_progress (user_id, completed_at DESC);

COMMENT ON TABLE public.user_lesson_progress
  IS 'Splněné lekce uživatele (upsert po 80% přehrání). PK (user_id, lesson_id) zabraňuje duplicitám.';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- akademie_categories — public read
ALTER TABLE public.akademie_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read akademie_categories" ON public.akademie_categories;
CREATE POLICY "Public read akademie_categories"
  ON public.akademie_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- akademie_programs — public read
ALTER TABLE public.akademie_programs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read akademie_programs" ON public.akademie_programs;
CREATE POLICY "Public read akademie_programs"
  ON public.akademie_programs FOR SELECT
  TO anon, authenticated
  USING (true);

-- akademie_series — public read
ALTER TABLE public.akademie_series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read akademie_series" ON public.akademie_series;
CREATE POLICY "Public read akademie_series"
  ON public.akademie_series FOR SELECT
  TO anon, authenticated
  USING (true);

-- akademie_lessons — public read (access enforcement v aplikaci přes user_modules)
ALTER TABLE public.akademie_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read akademie_lessons" ON public.akademie_lessons;
CREATE POLICY "Public read akademie_lessons"
  ON public.akademie_lessons FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- user_lesson_progress — private, own rows only
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own progress" ON public.user_lesson_progress;
CREATE POLICY "Users read own progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own progress" ON public.user_lesson_progress;
CREATE POLICY "Users insert own progress"
  ON public.user_lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own progress" ON public.user_lesson_progress;
CREATE POLICY "Users update own progress"
  ON public.user_lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- UPDATED_AT TRIGGER (reuse pattern z ostatních tabulek)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'akademie_categories',
    'akademie_programs',
    'akademie_series',
    'akademie_lessons'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at_%I ON public.%I;
       CREATE TRIGGER set_updated_at_%I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- SEED: Kategorie — Program REŽIM
-- ============================================================
INSERT INTO public.akademie_categories (id, name, slug, icon, description, sort_order)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Program REŽIM',
  'rezim',
  'regime',
  'Strukturované audio programy pro každodenní praxi. Každý program = 21 dní, 7 minut ráno.',
  10
)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at  = now();

-- ============================================================
-- SEED: Program — Digitální ticho (propojení na existující module)
-- ============================================================
INSERT INTO public.akademie_programs (id, module_id, category_id, description_long, cover_image_url, sort_order)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'digitalni-ticho',
  'a1000000-0000-0000-0000-000000000001',
  '21denní ranní audio program pro zklidnění nervového systému. Každý den 7 minut po probuzení — jednoduše, bez komplikací. Naučíš se vědomě dýchat, zklidnit mysl a začít den z místa klidu místo chaosu.',
  'https://dechbar-cdn.b-cdn.net/covers/digitalni-ticho-cover.jpg',
  10
)
ON CONFLICT (module_id, category_id) DO UPDATE SET
  description_long = EXCLUDED.description_long,
  updated_at       = now();

-- ============================================================
-- SEED: Série — Digitální ticho (3 týdny)
-- ============================================================

-- Série 1: Příběh (Dny 1–7)
INSERT INTO public.akademie_series (id, module_id, series_module_id, name, description, week_number, sort_order)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  'digitalni-ticho',
  'serie-pribeh',
  'Příběh',
  'Nervový systém se začíná uklidňovat. Dny 1–7.',
  1,
  10
)
ON CONFLICT DO NOTHING;

-- Série 2: Vedení (Dny 8–14)
INSERT INTO public.akademie_series (id, module_id, series_module_id, name, description, week_number, sort_order)
VALUES (
  'c1000000-0000-0000-0000-000000000002',
  'digitalni-ticho',
  'serie-vedeni',
  'Vedení',
  'Jdeme hlouběji. Dny 8–14.',
  2,
  20
)
ON CONFLICT DO NOTHING;

-- Série 3: Ticho (Dny 15–21)
INSERT INTO public.akademie_series (id, module_id, series_module_id, name, description, week_number, sort_order)
VALUES (
  'c1000000-0000-0000-0000-000000000003',
  'digitalni-ticho',
  'serie-ticho',
  'Ticho',
  'Plná integrace. Dny 15–21.',
  3,
  30
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Lekce — Digitální ticho (21 dní)
-- Audio URL pattern: Bunny CDN — stejná báze jako landing page preview
-- Skutečné URL doplnit v admin panelu po nahrání souborů.
-- ============================================================

-- Série 1 — Příběh (Dny 1–7)
INSERT INTO public.akademie_lessons (series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Zavři záložky', 'https://dechbar-cdn.b-cdn.net/audio/program%20RE%C5%BDIM%20-%20ochutn%C3%A1vky/Digita%CC%81lni%CC%81%20ticho%20-%20ochutna%CC%81vka%20-%20Zavr%CC%8Ci%20za%CC%81loz%CC%8Cky.mp3', 420, 1, 10),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 2 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-02.mp3', 420, 2, 20),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 3 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-03.mp3', 420, 3, 30),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 4 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-04.mp3', 420, 4, 40),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 5 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-05.mp3', 420, 5, 50),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 6 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-06.mp3', 420, 6, 60),
  ('c1000000-0000-0000-0000-000000000001', 'digitalni-ticho', 'Den 7 — Příběh', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-07.mp3', 420, 7, 70)
ON CONFLICT DO NOTHING;

-- Série 2 — Vedení (Dny 8–14)
INSERT INTO public.akademie_lessons (series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 8 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-08.mp3', 420, 8, 10),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 9 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-09.mp3', 420, 9, 20),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 10 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-10.mp3', 420, 10, 30),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 11 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-11.mp3', 420, 11, 40),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 12 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-12.mp3', 420, 12, 50),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 13 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-13.mp3', 420, 13, 60),
  ('c1000000-0000-0000-0000-000000000002', 'digitalni-ticho', 'Den 14 — Vedení', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-14.mp3', 420, 14, 70)
ON CONFLICT DO NOTHING;

-- Série 3 — Ticho (Dny 15–21)
INSERT INTO public.akademie_lessons (series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 15 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-15.mp3', 420, 15, 10),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 16 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-16.mp3', 420, 16, 20),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 17 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-17.mp3', 420, 17, 30),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 18 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-18.mp3', 420, 18, 40),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 19 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-19.mp3', 420, 19, 50),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 20 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-20.mp3', 420, 20, 60),
  ('c1000000-0000-0000-0000-000000000003', 'digitalni-ticho', 'Den 21 — Ticho', 'https://dechbar-cdn.b-cdn.net/audio/digitalni-ticho/den-21.mp3', 420, 21, 70)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUCCESS
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ akademie_categories created + seeded (Program REŽIM)';
  RAISE NOTICE '✅ akademie_programs created + seeded (Digitální ticho)';
  RAISE NOTICE '✅ akademie_series created + seeded (3 série)';
  RAISE NOTICE '✅ akademie_lessons created + seeded (21 lekcí)';
  RAISE NOTICE '✅ user_lesson_progress created (RLS: own rows only)';
  RAISE NOTICE '🎯 Poznámka: audio_url pro dny 2–21 je placeholder — doplnit po nahrání do Bunny CDN';
END $$;
