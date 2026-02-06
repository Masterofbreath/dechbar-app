-- =====================================================
-- Admin Queries Test Suite
-- Date: 2026-02-05
-- Purpose: Verify all admin queries work after RLS fixes
-- =====================================================

-- Run these queries in Supabase SQL Editor after applying migrations
-- All should return data without errors

-- ============================================================
-- TEST 1: Tracks Table
-- ============================================================

-- Should return 3 sample tracks (or more)
SELECT * FROM public.tracks;

-- Expected result:
-- ✅ 3 rows (sample data)
-- ❌ Error? → Migration not applied yet

-- ============================================================
-- TEST 2: Admin can view all users
-- ============================================================

-- Should return all users with their profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.full_name,
  p.avatar_url
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Expected result:
-- ✅ All users visible
-- ❌ Empty? → No users in DB (create test user)

-- ============================================================
-- TEST 3: Admin can view all user roles
-- ============================================================

-- Should return all role assignments
SELECT 
  ur.user_id,
  ur.role_id,
  r.name as role_name,
  r.level,
  u.email
FROM public.user_roles ur
JOIN public.roles r ON r.id = ur.role_id
JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email, r.level DESC;

-- Expected result:
-- ✅ All role assignments visible
-- ❌ Error 403? → RLS policy not applied

-- ============================================================
-- TEST 4: Admin can view all memberships
-- ============================================================

-- Should return all memberships
SELECT 
  m.user_id,
  m.plan,
  m.status,
  m.type,
  m.purchased_at,
  m.expires_at,
  u.email
FROM public.memberships m
JOIN auth.users u ON u.id = m.user_id
ORDER BY m.created_at DESC;

-- Expected result:
-- ✅ All memberships visible (all should have ZDARMA default)
-- ❌ Empty? → Migration not applied

-- ============================================================
-- TEST 5: Admin can view all user modules
-- ============================================================

-- Should return all module purchases
SELECT 
  um.user_id,
  um.module_id,
  um.purchase_type,
  um.subscription_status,
  um.purchased_at,
  u.email
FROM public.user_modules um
JOIN auth.users u ON u.id = um.user_id
ORDER BY um.purchased_at DESC;

-- Expected result:
-- ✅ All purchases visible
-- ❌ Empty? → No purchases yet (OK for testing)

-- ============================================================
-- TEST 6: Join query (what admin dashboard will use)
-- ============================================================

-- Complex query: Get all user data for admin dashboard
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.full_name,
  p.avatar_url,
  m.plan as membership_plan,
  m.status as membership_status,
  m.expires_at,
  (
    SELECT json_agg(ur.role_id)
    FROM public.user_roles ur
    WHERE ur.user_id = u.id
  ) as roles,
  (
    SELECT json_agg(um.module_id)
    FROM public.user_modules um
    WHERE um.user_id = u.id AND um.subscription_status = 'active'
  ) as owned_modules
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.memberships m ON m.user_id = u.id AND m.status = 'active'
ORDER BY u.created_at DESC
LIMIT 50;

-- Expected result:
-- ✅ All users with complete data
-- ✅ JSON aggregations work
-- ❌ Error? → Check which table is missing

-- ============================================================
-- TEST 7: Verify current user is admin
-- ============================================================

-- Check if YOU (logged-in user) have admin role
SELECT 
  auth.uid() as my_user_id,
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_id IN ('admin', 'ceo')
  ) as am_i_admin;

-- Expected result:
-- ✅ am_i_admin = true
-- ❌ false? → Add admin role to your user:
--   INSERT INTO public.user_roles (user_id, role_id)
--   VALUES (auth.uid(), 'admin');

-- ============================================================
-- SUMMARY
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '📊 Test Suite Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected results:';
  RAISE NOTICE '✅ All SELECT queries return data without 403/404 errors';
  RAISE NOTICE '✅ Complex JOIN query works';
  RAISE NOTICE '✅ Current user has admin role';
  RAISE NOTICE '';
  RAISE NOTICE 'If any test fails:';
  RAISE NOTICE '1. Check if migrations applied: supabase db push';
  RAISE NOTICE '2. Check RLS policies in Supabase Dashboard';
  RAISE NOTICE '3. Check your user has admin role in user_roles table';
END $$;
