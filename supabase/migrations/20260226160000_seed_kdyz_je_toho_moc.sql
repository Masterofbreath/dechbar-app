-- ============================================================
-- Seed: Když je toho moc — 3 týdenní série × 7 lekcí
-- Program ID: b2000000-0000-0000-0000-000000000001
-- Lekce jsou zatím bez reálného audia (placeholder URL).
-- Uživatelé bez přístupu uvidí LockedFeatureModal.
-- ============================================================

-- Aktualizovat metadata programu
UPDATE public.akademie_programs
SET duration_days = 21, daily_minutes = 7
WHERE module_id = 'kdyz-je-toho-moc';

-- ─── Série ───────────────────────────────────────────────

INSERT INTO public.akademie_series (id, module_id, name, week_number, sort_order) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Uvolnění',  1, 10),
  ('c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Rovnováha', 2, 20),
  ('c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Síla',      3, 30)
ON CONFLICT (id) DO NOTHING;

-- ─── Lekce: Série 1 — Uvolnění (dny 1–7) ────────────────

INSERT INTO public.akademie_lessons
  (id, series_id, module_id, title, day_number, audio_url, duration_seconds, sort_order)
VALUES
  ('d2000001-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'První nádech',     1, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-01.mp3', 420, 10),
  ('d2000001-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Pustit tlak',      2, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-02.mp3', 420, 20),
  ('d2000001-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Dech a tělo',      3, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-03.mp3', 420, 30),
  ('d2000001-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Pomalý rytmus',    4, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-04.mp3', 420, 40),
  ('d2000001-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Tichý prostor',    5, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-05.mp3', 420, 50),
  ('d2000001-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Přijmout pocity',  6, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-06.mp3', 420, 60),
  ('d2000001-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000001', 'kdyz-je-toho-moc', 'Uvolněná mysl',    7, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-07.mp3', 420, 70)
ON CONFLICT (series_id, day_number) DO NOTHING;

-- ─── Lekce: Série 2 — Rovnováha (dny 1–7) ───────────────

INSERT INTO public.akademie_lessons
  (id, series_id, module_id, title, day_number, audio_url, duration_seconds, sort_order)
VALUES
  ('d2000002-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Střed dne',            1, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-08.mp3', 420, 10),
  ('d2000002-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Vědomý přechod',       2, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-09.mp3', 420, 20),
  ('d2000002-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Resetovat systém',     3, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-10.mp3', 420, 30),
  ('d2000002-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Dech pro klid',        4, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-11.mp3', 420, 40),
  ('d2000002-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Vnitřní ticho',        5, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-12.mp3', 420, 50),
  ('d2000002-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Přirozený rytmus',     6, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-13.mp3', 420, 60),
  ('d2000002-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000002', 'kdyz-je-toho-moc', 'Stav rovnováhy',       7, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-14.mp3', 420, 70)
ON CONFLICT (series_id, day_number) DO NOTHING;

-- ─── Lekce: Série 3 — Síla (dny 1–7) ────────────────────

INSERT INTO public.akademie_lessons
  (id, series_id, module_id, title, day_number, audio_url, duration_seconds, sort_order)
VALUES
  ('d2000003-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Kořeny síly',      1, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-15.mp3', 420, 10),
  ('d2000003-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Dech a záměr',     2, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-16.mp3', 420, 20),
  ('d2000003-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Plná přítomnost',  3, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-17.mp3', 420, 30),
  ('d2000003-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Jasná mysl',       4, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-18.mp3', 420, 40),
  ('d2000003-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Vitální energie',  5, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-19.mp3', 420, 50),
  ('d2000003-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Stabilní základ',  6, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-20.mp3', 420, 60),
  ('d2000003-0000-0000-0000-000000000007', 'c2000000-0000-0000-0000-000000000003', 'kdyz-je-toho-moc', 'Nový začátek',     7, 'https://dechbar-cdn.b-cdn.net/audio/kdyz-je-toho-moc/den-21.mp3', 420, 70)
ON CONFLICT (series_id, day_number) DO NOTHING;
