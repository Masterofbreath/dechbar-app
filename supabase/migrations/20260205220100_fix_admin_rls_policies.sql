-- =====================================================
-- Migration: Fix RLS policies for Admin access
-- Date: 2026-02-05
-- Author: AI Agent
-- Purpose: Enable admins to view/manage all users, memberships, and modules
-- =====================================================

-- ============================================================
-- PROFILES TABLE - Admin can view all users
-- ============================================================

-- Drop old restrictive policy (if exists)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Policy 1: Users can view own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 3: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy 4: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- ============================================================
-- USER_ROLES TABLE - Admin can manage all user roles
-- ============================================================

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Policy 1: Users can view own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all user roles
CREATE POLICY "Admins can view all user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('admin', 'ceo')
    )
  );

-- Policy 3: Admins can manage all user roles (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage all user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role_id IN ('admin', 'ceo')
    )
  );

-- ============================================================
-- MEMBERSHIPS TABLE - Admin can manage all memberships
-- ============================================================

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;

-- Policy 1: Users can view own membership
CREATE POLICY "Users can view own membership"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all memberships
CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 3: Admins can manage all memberships (UPDATE)
CREATE POLICY "Admins can update all memberships"
  ON public.memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 4: System can insert memberships (for new users)
CREATE POLICY "System can insert memberships"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- USER_MODULES TABLE - Admin can manage all user modules
-- ============================================================

-- Drop old policies if exist
DROP POLICY IF EXISTS "Users can view own modules" ON public.user_modules;
DROP POLICY IF EXISTS "Users can insert own modules" ON public.user_modules;

-- Policy 1: Users can view own modules
CREATE POLICY "Users can view own modules"
  ON public.user_modules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Admins can view all user modules
CREATE POLICY "Admins can view all user_modules"
  ON public.user_modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 3: Admins can manage all user modules (INSERT/UPDATE/DELETE)
CREATE POLICY "Admins can manage all user_modules"
  ON public.user_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role_id IN ('admin', 'ceo')
    )
  );

-- Policy 4: Users can insert own modules (purchases)
CREATE POLICY "Users can insert own modules"
  ON public.user_modules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed for admin access!';
  RAISE NOTICE '✅ Admins can now view/manage all users';
  RAISE NOTICE '✅ Admins can now view/manage all roles';
  RAISE NOTICE '✅ Admins can now view/manage all memberships';
  RAISE NOTICE '✅ Admins can now view/manage all user_modules';
  RAISE NOTICE '🎉 Admin User Management Dashboard is ready to build!';
END $$;
