/**
 * Fix user_modules RLS Policies
 * 
 * Fixes RLS policies on user_modules table to use is_admin() function
 * instead of direct user_roles query (prevents circular reference).
 * 
 * Changes:
 * - Drop old policies that cause 406 errors
 * - Recreate using is_admin() function (created in previous migration)
 * 
 * @package DechBar_App
 * @subpackage Supabase/Migrations
 * @since 2.47.1
 */

-- ============================================================
-- Drop existing problematic policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view their own modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.user_modules;

-- ============================================================
-- Recreate policies using is_admin() function
-- ============================================================

-- Users can view their own modules
CREATE POLICY "Users can view their own modules"
  ON public.user_modules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all modules
CREATE POLICY "Admins can view all modules"
  ON public.user_modules
  FOR SELECT
  USING (public.is_admin());

-- Admins can insert modules
CREATE POLICY "Admins can insert modules"
  ON public.user_modules
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Admins can update all modules
CREATE POLICY "Admins can update all modules"
  ON public.user_modules
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete modules
CREATE POLICY "Admins can delete modules"
  ON public.user_modules
  FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON POLICY "Users can view their own modules" ON public.user_modules IS 
  'Users can view their own purchased/unlocked modules';

COMMENT ON POLICY "Admins can view all modules" ON public.user_modules IS 
  'Admins can view all user modules (uses is_admin() function to prevent circular reference)';

COMMENT ON POLICY "Admins can insert modules" ON public.user_modules IS 
  'Admins can assign modules to users';

COMMENT ON POLICY "Admins can update all modules" ON public.user_modules IS 
  'Admins can update module assignments';

COMMENT ON POLICY "Admins can delete modules" ON public.user_modules IS 
  'Admins can remove module assignments';
