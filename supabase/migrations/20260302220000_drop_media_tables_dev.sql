-- ============================================================
-- Migration: DROP media/albums/tracks tabulek z DEV
-- Date: 2026-03-02
-- Scope: DEV ONLY (nrlqzighwaeuxcicuhse)
-- Důvod: Rozhodnutí použít Akademie strukturu místo Albums/Tracks.
--        Tabulky nikdy nebyly na PROD, žádná produkční data.
-- ============================================================

-- albums: 0 záznamů, nepoužívané
DROP TABLE IF EXISTS public.albums CASCADE;

-- tracks: 1 testovací záznam, nepoužívané
DROP TABLE IF EXISTS public.tracks CASCADE;

-- challenge_progress: 0 záznamů, žádný frontend kód ji nepoužívá
-- (progres výzvy sledujeme přes user_lesson_progress)
DROP TABLE IF EXISTS public.challenge_progress CASCADE;

SELECT 'Dropped: albums, tracks, challenge_progress' AS status;
