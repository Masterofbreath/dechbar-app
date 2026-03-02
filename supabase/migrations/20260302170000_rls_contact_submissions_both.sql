-- ============================================================
-- RLS FIX: contact_submissions SELECT — DEV + PROD
-- Date: 2026-03-02
-- Problem: "Authenticated users can read submissions" had qual: true
--   → ANY logged-in user could read ALL contact forms of all users.
--   This is a GDPR/privacy violation (name, email, message visible).
-- Fix: Replace with admin-only SELECT.
--   Anonymous insert remains unchanged.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.contact_submissions;

CREATE POLICY "Admins can read contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Verify
DO $$
DECLARE
  open_select_exists boolean;
  admin_select_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='contact_submissions'
      AND policyname='Authenticated users can read submissions'
  ) INTO open_select_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='contact_submissions'
      AND policyname='Admins can read contact submissions'
  ) INTO admin_select_exists;

  IF open_select_exists THEN
    RAISE EXCEPTION '❌ Open SELECT policy still exists on contact_submissions!';
  END IF;

  RAISE NOTICE '✅ contact_submissions SELECT restricted to admins only';
  RAISE NOTICE '  admin read policy: %', CASE WHEN admin_select_exists THEN 'OK' ELSE 'MISSING!' END;
END;
$$;
