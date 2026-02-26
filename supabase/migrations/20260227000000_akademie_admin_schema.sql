-- =====================================================
-- Migration: Akademie Admin Schema Extensions
-- Date: 2026-02-27
-- Purpose: Add missing columns for admin panel + RLS write policies
--
-- Changes:
--   1. akademie_categories  → add description_long
--   2. akademie_programs    → add launch_date, is_published
--   3. modules              → add ecomail_list_in, ecomail_list_before
--   4. RLS: admin write policies (přes user_roles, ne JWT claims)
-- =====================================================

-- ============================================================
-- PART 1: Extend akademie_categories
-- description_long already expected by AkademieRoot.tsx:
--   (cat.description_long ?? cat.description)
-- ============================================================

ALTER TABLE public.akademie_categories
  ADD COLUMN IF NOT EXISTS description_long text NULL;

COMMENT ON COLUMN public.akademie_categories.description_long
  IS 'Dlouhý popis zobrazený jako podnadpis v ProgramListView. Pokud NULL, použije se description.';

-- ============================================================
-- PART 2: Extend akademie_programs
-- ============================================================

ALTER TABLE public.akademie_programs
  ADD COLUMN IF NOT EXISTS launch_date  timestamptz NULL,
  ADD COLUMN IF NOT EXISTS is_published boolean     NOT NULL DEFAULT true;

COMMENT ON COLUMN public.akademie_programs.launch_date
  IS 'Datum spuštění programu. NULL = okamžitě. Logika denního odemykání = Phase 2.';
COMMENT ON COLUMN public.akademie_programs.is_published
  IS 'False = draft (neviditelný na frontendu). True = publikovaný.';

-- Update existing programs to is_published = true (retroactive)
UPDATE public.akademie_programs SET is_published = true WHERE is_published IS NULL OR is_published = false;

-- ============================================================
-- PART 3: Extend modules
-- ============================================================

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS ecomail_list_in     text NULL,
  ADD COLUMN IF NOT EXISTS ecomail_list_before text NULL;

COMMENT ON COLUMN public.modules.ecomail_list_in
  IS 'Ecomail list ID pro zákazníky (po koupi). Nastaveno automaticky při tvorb produktu.';
COMMENT ON COLUMN public.modules.ecomail_list_before
  IS 'Ecomail list ID pro předobjednávky (před koupí). Nastaveno automaticky při tvorbě produktu.';

-- Seed Digitální ticho s existujícími Ecomail listy
UPDATE public.modules
  SET ecomail_list_in     = '10',
      ecomail_list_before = '11'
  WHERE id = 'digitalni-ticho'
    AND ecomail_list_in IS NULL;

-- ============================================================
-- PART 4: RLS — Admin write policies
-- Logika: admin = uživatel s role_id 'admin' nebo 'ceo' v user_roles
-- POZOR: nepoužíváme auth.jwt() ->> 'role' — role jsou v user_roles tabulce
-- ============================================================

-- Helper: přidáme index pro výkon RLS checků
CREATE INDEX IF NOT EXISTS user_roles_user_id_role_idx
  ON public.user_roles (user_id, role_id);

-- ── akademie_categories ─────────────────────────────────────

DROP POLICY IF EXISTS "Admin can manage akademie_categories" ON public.akademie_categories;
CREATE POLICY "Admin can manage akademie_categories"
  ON public.akademie_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  );

-- ── akademie_programs ────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can manage akademie_programs" ON public.akademie_programs;
CREATE POLICY "Admin can manage akademie_programs"
  ON public.akademie_programs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  );

-- ── akademie_series ──────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can manage akademie_series" ON public.akademie_series;
CREATE POLICY "Admin can manage akademie_series"
  ON public.akademie_series
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  );

-- ── akademie_lessons ─────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can manage akademie_lessons" ON public.akademie_lessons;
CREATE POLICY "Admin can manage akademie_lessons"
  ON public.akademie_lessons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  );

-- ── modules ──────────────────────────────────────────────────
-- Modules tabulka nemá RLS enabled by default — zapneme + přidáme policies

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read modules" ON public.modules;
CREATE POLICY "Public read modules"
  ON public.modules
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can manage modules" ON public.modules;
CREATE POLICY "Admin can manage modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role_id IN ('admin', 'ceo')
    )
  );

-- ============================================================
-- SUCCESS
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ akademie_categories.description_long added';
  RAISE NOTICE '✅ akademie_programs.launch_date + is_published added';
  RAISE NOTICE '✅ modules.ecomail_list_in + ecomail_list_before added';
  RAISE NOTICE '✅ RLS admin write policies created for all akademie_* tables + modules';
  RAISE NOTICE '✅ Digitální ticho Ecomail list IDs seeded (10, 11)';
END $$;
