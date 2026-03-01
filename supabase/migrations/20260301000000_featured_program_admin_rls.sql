-- ============================================================
-- Admin write RLS pro platform_featured_program
--
-- Aktuálně tabulka má pouze SELECT policy pro authenticated.
-- Admin nemůže INSERT/UPDATE/DELETE přes supabase klienta.
-- Přidáme write policy přes is_admin() (SECURITY DEFINER).
--
-- Závislost: public.is_admin() existuje od 20260206110000_fix_user_roles_rls_circular.sql
-- ============================================================

CREATE POLICY "Admin manage featured program"
  ON public.platform_featured_program
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DO $$ BEGIN
  RAISE NOTICE '✅ platform_featured_program: admin write RLS policy added';
END $$;
