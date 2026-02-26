-- =====================================================
-- Migration: Daily Program System
-- Date: 2026-02-26
-- Purpose: Two-layer "Today's Program" system
--   1. user_active_program   — user's own pinned program
--   2. platform_featured_program — admin-set default (shown when user has no pin)
--   3. akademie_programs extended with duration_days + daily_minutes
--      (enables filtering, recommendations, and dynamic UI display)
-- =====================================================

-- ============================================================
-- PART 1: Extend akademie_programs
-- ============================================================

ALTER TABLE public.akademie_programs
  ADD COLUMN IF NOT EXISTS duration_days  int NULL,
  ADD COLUMN IF NOT EXISTS daily_minutes  int NULL;

COMMENT ON COLUMN public.akademie_programs.duration_days
  IS 'Total program length in days (e.g. 21). Used for display and filtering.';
COMMENT ON COLUMN public.akademie_programs.daily_minutes
  IS 'Recommended daily session length in minutes (e.g. 15). Used for display and filtering.';

-- Seed known values for Digitální ticho
UPDATE public.akademie_programs
  SET duration_days = 21, daily_minutes = 15
  WHERE module_id = 'digitalni-ticho';

-- ============================================================
-- PART 2: user_active_program
-- One row per user — their own pinned daily program.
-- module_id is TEXT (consistent with akademie_programs.module_id).
-- UNIQUE(user_id) enforces single active program per user.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_active_program (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id    text        NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS user_active_program_user_idx
  ON public.user_active_program (user_id);

COMMENT ON TABLE public.user_active_program
  IS 'User''s self-chosen daily program. One row per user (UNIQUE user_id). '
     'Upsert on conflict to switch programs. module_id references akademie_programs.module_id.';

ALTER TABLE public.user_active_program ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own active program" ON public.user_active_program;
CREATE POLICY "Users manage own active program"
  ON public.user_active_program
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PART 3: platform_featured_program
-- Admin-controlled default shown to users without a pinned program.
-- Read-only for authenticated users. Admin manages via Supabase dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_featured_program (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id      text        NOT NULL,
  title_override text        NULL,   -- Optional custom headline (e.g. "SPECIÁLNÍ DECHPRESSO")
  active_from    timestamptz NOT NULL DEFAULT now(),
  active_until   timestamptz NULL,   -- NULL = no expiry
  is_active      boolean     NOT NULL DEFAULT true,
  sort_order     int         NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_featured_program_active_idx
  ON public.platform_featured_program (is_active, sort_order)
  WHERE is_active = true;

COMMENT ON TABLE public.platform_featured_program
  IS 'Admin-curated featured program shown on Dnes view for users without a pinned program. '
     'Supports scheduling via active_from / active_until. Read-only for end users.';

ALTER TABLE public.platform_featured_program ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read featured program" ON public.platform_featured_program;
CREATE POLICY "Authenticated read featured program"
  ON public.platform_featured_program
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (active_until IS NULL OR active_until > now())
  );

-- ============================================================
-- PART 4: Seed — Digitální ticho as default featured program
-- ============================================================

INSERT INTO public.platform_featured_program (module_id, title_override, is_active, sort_order)
VALUES ('digitalni-ticho', NULL, true, 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SUCCESS
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '✅ akademie_programs: added duration_days + daily_minutes columns';
  RAISE NOTICE '✅ Digitální ticho seeded: duration_days=21, daily_minutes=15';
  RAISE NOTICE '✅ user_active_program: created with RLS (users own rows)';
  RAISE NOTICE '✅ platform_featured_program: created with RLS (authenticated read)';
  RAISE NOTICE '✅ Digitální ticho seeded as default featured program';
END $$;
