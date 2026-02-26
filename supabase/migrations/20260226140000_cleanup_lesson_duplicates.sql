-- =====================================================
-- Migration: Cleanup duplicitních lekcí + UNIQUE constraint
-- Date: 2026-02-26
-- Problem: Migration 20260221100000 byla aplikována dvakrát.
--          Seed vložil lekce podruhé (bez UNIQUE constraint
--          neexistoval žádný conflict check) → 42 lekcí místo 21.
-- Fix:
--   1. Pro každý (series_id, day_number) pár ponechat PRVNÍ fyzický
--      řádek (nejnižší ctid = nejdříve vložený), smazat ostatní.
--   2. Přidat UNIQUE(series_id, day_number) aby se to neopakovalo.
-- =====================================================

-- ── Krok 1: Smazat novější duplikáty ─────────────────────────────────
-- Pro každý (series_id, day_number) pársonecháme řádek s nejnižším ctid.
-- ctid = fyzická adresa řádku v Postgres — nejnižší = nejdříve vložený.
-- Funguje pro VŠECHNY duplicity bez ohledu na název.

DELETE FROM public.akademie_lessons a
WHERE module_id = 'digitalni-ticho'
  AND EXISTS (
    SELECT 1
    FROM public.akademie_lessons b
    WHERE b.series_id  = a.series_id
      AND b.day_number = a.day_number
      AND b.ctid < a.ctid
  );

-- ── Krok 2: UNIQUE constraint ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'akademie_lessons_series_day_unique'
  ) THEN
    ALTER TABLE public.akademie_lessons
      ADD CONSTRAINT akademie_lessons_series_day_unique
      UNIQUE (series_id, day_number);
  END IF;
END $$;

-- ── Ověření ──────────────────────────────────────────────────────────
DO $$
DECLARE
  lesson_count  int;
  dup_count     int;
BEGIN
  SELECT COUNT(*) INTO lesson_count
  FROM public.akademie_lessons
  WHERE module_id = 'digitalni-ticho';

  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT series_id, day_number
    FROM public.akademie_lessons
    WHERE module_id = 'digitalni-ticho'
    GROUP BY series_id, day_number
    HAVING COUNT(*) > 1
  ) sub;

  RAISE NOTICE '✅ akademie_lessons cleanup hotov: % lekcí, % duplicitních párů', lesson_count, dup_count;

  IF dup_count > 0 THEN
    RAISE WARNING '⚠️  Stále existují duplicitní (series_id, day_number) páry!';
  END IF;
END $$;
