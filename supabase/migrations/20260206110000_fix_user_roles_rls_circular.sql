-- =====================================================
-- Migration: Fix RLS Circular Reference
-- Date: 2026-02-06
-- Purpose: Fix 500 errors caused by circular reference in RLS policies
-- 
-- Problem: RLS policy on user_roles checks user_roles table → infinite recursion
-- Solution: Use SECURITY DEFINER function to bypass RLS during check
-- =====================================================

-- ============================================================
-- STEP 1: Drop problematic circular policies
-- ============================================================

-- user_roles table
DROP POLICY IF EXISTS "Admins can view all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user_roles" ON public.user_roles;

-- memberships table
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can update all memberships" ON public.memberships;

-- user_modules table
DROP POLICY IF EXISTS "Admins can view all user_modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can manage all user_modules" ON public.user_modules;

-- profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- ============================================================
-- STEP 2: Create helper function (SECURITY DEFINER)
-- ============================================================

-- Function to check if user is admin
-- SECURITY DEFINER = runs with creator's privileges, bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_id IN ('admin', 'ceo')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

COMMENT ON FUNCTION public.is_admin() IS 'Check if current user has admin or ceo role. Uses SECURITY DEFINER to bypass RLS.';

-- ============================================================
-- STEP 3: Create new non-circular policies
-- ============================================================

-- ==================== USER_ROLES ====================

-- Everyone can view own roles (no circular dependency)
CREATE POLICY "Users can view own roles - no circular"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all roles (via function, no circular)
CREATE POLICY "Admins can view all user_roles - via function"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can manage roles (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage user_roles - via function"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==================== MEMBERSHIPS ====================

-- Everyone can view own membership
CREATE POLICY "Users can view own membership - no circular"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all memberships
CREATE POLICY "Admins can view all memberships - via function"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can manage memberships
CREATE POLICY "Admins can manage memberships - via function"
  ON public.memberships FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- System can insert memberships (for new users via trigger)
CREATE POLICY "System can insert memberships - no circular"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==================== USER_MODULES ====================

-- Everyone can view own modules
CREATE POLICY "Users can view own modules - no circular"
  ON public.user_modules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all modules
CREATE POLICY "Admins can view all user_modules - via function"
  ON public.user_modules FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can manage modules
CREATE POLICY "Admins can manage user_modules - via function"
  ON public.user_modules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can insert own modules (purchases)
CREATE POLICY "Users can insert own modules - no circular"
  ON public.user_modules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==================== PROFILES ====================

-- Everyone can view own profile
CREATE POLICY "Users can view own profile - no circular"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles - via function"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Everyone can update own profile
CREATE POLICY "Users can update own profile - no circular"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles - via function"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- STEP 4: Success message
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS circular reference fixed!';
  RAISE NOTICE '✅ Created is_admin() function with SECURITY DEFINER';
  RAISE NOTICE '✅ Updated policies for user_roles, memberships, user_modules, profiles';
  RAISE NOTICE '🎉 500 errors should be resolved now!';
END $$;
