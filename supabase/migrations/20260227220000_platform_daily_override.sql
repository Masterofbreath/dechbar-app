-- ============================================================
-- platform_daily_override
-- ============================================================
-- Allows admin to schedule a custom audio track for the
-- "Denní program" card on the Dnes view — without tying it
-- to an existing Akademie lesson/program.
--
-- Priority (in TodaysChallengeButton):
--   1. user_active_program  (pinned by user)
--   2. platform_daily_override  (admin-scheduled, this table)
--   3. platform_featured_program  (fallback Akademie program)
--
-- Usage from admin UI:
--   - Set is_active = true, active_from, active_until
--   - Multiple rows allowed; lowest sort_order wins

CREATE TABLE IF NOT EXISTS public.platform_daily_override (
  id               uuid                     DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text          NOT NULL,
  subtitle         text          NOT NULL,
  audio_url        text          NOT NULL,
  duration_seconds integer       NOT NULL DEFAULT 0,
  cover_image_url  text                   NULL,
  active_from      timestamptz   NOT NULL DEFAULT now(),
  active_until     timestamptz            NULL,
  is_active        boolean       NOT NULL DEFAULT true,
  sort_order       integer       NOT NULL DEFAULT 10,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.platform_daily_override ENABLE ROW LEVEL SECURITY;

-- Authenticated users (incl. anon-like) can read active overrides
CREATE POLICY "Read active daily overrides"
  ON public.platform_daily_override
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin read: see all rows (incl. inactive) for management
CREATE POLICY "Admin read all daily overrides"
  ON public.platform_daily_override
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'ceo')
    )
  );

-- Admin write: insert/update/delete
CREATE POLICY "Admin write daily override"
  ON public.platform_daily_override
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'ceo')
    )
  );

-- ============================================================
-- updated_at trigger (reuse existing function if available)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_platform_daily_override'
  ) THEN
    CREATE TRIGGER set_updated_at_platform_daily_override
      BEFORE UPDATE ON public.platform_daily_override
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
EXCEPTION WHEN undefined_function THEN
  NULL; -- set_updated_at() not available, skip trigger
END;
$$;

-- ============================================================
-- SEED: Dechpresso ochutnávka (do 1. března 2026 4:00 CET)
-- ============================================================
INSERT INTO public.platform_daily_override
  (title, subtitle, audio_url, duration_seconds, cover_image_url, active_from, active_until, is_active, sort_order)
VALUES (
  'Dechpresso',
  'Ochutnávka · 7 min',
  'https://dechbar-cdn.b-cdn.net/audio/tracks/Ochutn%C3%A1vka%20p%C5%99ed%20v%C3%BDzvou%202.mp3',
  420,
  NULL,
  '2026-02-01T00:00:00Z',
  '2026-03-01T03:00:00Z',  -- 4:00 CET = 3:00 UTC
  true,
  10
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- FIX: cover_image_url kde stará URL bez souboru na CDN
-- ============================================================
-- Migrace 20260221100000_akademie_module.sql nastavila
-- 'covers/digitalni-ticho-cover.jpg' (neexistující cesta).
-- DB byla opravena ručně, ale pro jistotu:
UPDATE public.akademie_programs
SET cover_image_url = 'https://dechbar-cdn.b-cdn.net/images/covers/892bb58e-3c3b-48ed-87e5-6c56fc12f02c.jpg'
WHERE module_id = 'digitalni-ticho'
  AND (
    cover_image_url LIKE '%digitalni-ticho-cover%'
    OR cover_image_url LIKE '%/covers/digitalni%'
  );
