-- ============================================================
-- Migration: RLS Cleanup — odstranění duplicitních politik na DEV
-- Date: 2026-03-02
-- Scope: DEV ONLY (nrlqzighwaeuxcicuhse)
-- Bezpečné: pouze odstraňuje PŘESNÉ duplicity nebo políky
--           superseded novějšími ALL-level políkami.
-- ============================================================

-- ------------------------------------------------------------
-- exercise_sessions: sessions_admin_read je superseded sessions_admin_all
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sessions_admin_read" ON public.exercise_sessions;

-- ------------------------------------------------------------
-- kp_measurements: kp_admin_read je superseded kp_admin_all
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "kp_admin_read" ON public.kp_measurements;

-- ------------------------------------------------------------
-- memberships: VIEW je superseded MANAGE (ALL zahrnuje SELECT)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all memberships - via function" ON public.memberships;

-- ------------------------------------------------------------
-- platform_daily_override: staré EXISTS subquery políky superseded
--   novým "Admin manage daily override" (ALL, is_admin())
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admin read all daily overrides" ON public.platform_daily_override;
DROP POLICY IF EXISTS "Admin write daily override" ON public.platform_daily_override;

-- ------------------------------------------------------------
-- profiles: "no circular" varianty jsou přesné kopie originálu
-- Vznikly jako workaround cyklické závislosti — ta je nyní vyřešena.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile - no circular" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile - no circular" ON public.profiles;

-- ------------------------------------------------------------
-- user_modules: admin ALL supersedes jednotlivé CRUD políky
--   + "no circular" + třetí varianta SELECT jsou přesné kopie
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all user_modules - via function" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can update all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Admins can view all modules" ON public.user_modules;
DROP POLICY IF EXISTS "Users can insert own modules - no circular" ON public.user_modules;
DROP POLICY IF EXISTS "Users can view own modules - no circular" ON public.user_modules;
DROP POLICY IF EXISTS "Users can view their own modules" ON public.user_modules;

-- ------------------------------------------------------------
-- user_roles: "no circular" je přesná kopie hlavní políky
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles - no circular" ON public.user_roles;

-- ------------------------------------------------------------
-- Výsledná čistá struktura (co zůstalo):
--
-- exercise_sessions:  sessions_admin_all, sessions_insert_own,
--                     sessions_select_own, sessions_update_own
-- kp_measurements:    kp_admin_all, + 3x user CRUD
-- memberships:        Admins can manage, System can insert,
--                     Users can view own
-- platform_daily_override: Admin manage, Read active daily overrides
-- profiles:           Admins view all, Admins update all,
--                     Users can insert, view, update own
-- user_modules:       Admins can manage (ALL), Users can insert/view
-- user_roles:         Admins can manage (ALL), Admins view all,
--                     Users can read own, Users can view own
-- ------------------------------------------------------------

SELECT 'RLS cleanup done: removed redundant policies' AS status;
