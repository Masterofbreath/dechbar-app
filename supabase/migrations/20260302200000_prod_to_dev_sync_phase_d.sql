-- ============================================================
-- Migration: Fáze D — PROD → DEV sync (additivní, bezpečné)
-- Date: 2026-03-02
-- Scope: DEV ONLY (nrlqzighwaeuxcicuhse)
-- Přidává věci, které PROD má a DEV chybí.
-- VŽDY additivní — žádné DROP, žádné RENAME existujících věcí.
-- ============================================================

-- ============================================================
-- 1. SLOUPCE: profiles.welcome_email_sent_at
-- PROD má, DEV chybí. Trackuje kdy byl odeslán welcome email.
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================
-- 2. SLOUPCE: user_roles rozšíření
-- PROD má: id, user_id, role_id, assigned_at, assigned_by, notes
-- DEV má:  user_id, role_id, created_at
-- Přidáme nové sloupce (created_at necháme — existující kód ho používá)
-- ============================================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS assigned_by UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- Zpětně vyplnit assigned_at z created_at kde existuje
UPDATE public.user_roles
SET assigned_at = created_at
WHERE assigned_at IS NULL AND created_at IS NOT NULL;

-- ============================================================
-- 3. SLOUPCE: ecomail_failed_syncs rozšíření
-- PROD má original_queue_item_id, retry_count, original_created_at
-- DEV má  original_queue_id (jiný název) — zachováme OBA
-- ============================================================
ALTER TABLE public.ecomail_failed_syncs
  ADD COLUMN IF NOT EXISTS original_queue_item_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS original_created_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;

-- Zpětně vyplnit original_queue_item_id z original_queue_id kde existuje
UPDATE public.ecomail_failed_syncs
SET original_queue_item_id = original_queue_id::uuid
WHERE original_queue_item_id IS NULL
  AND original_queue_id IS NOT NULL;

-- ============================================================
-- 4. SQL FUNKCE: deactivate_smart_trial()
-- PROD cron volá SELECT public.deactivate_smart_trial();
-- DEV cron volá edge function — přidáme SQL funkci pro konzistenci
-- ============================================================
CREATE OR REPLACE FUNCTION public.deactivate_smart_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_count INT;
BEGIN
  UPDATE memberships
  SET
    plan             = 'ZDARMA'::public.membership_plan_type,
    type             = 'lifetime',
    expires_at       = NULL,
    billing_interval = NULL,
    description      = 'ZDARMA (po skončení SMART trial 22.3.2026)',
    metadata         = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{trial_ended_at}', to_jsonb(NOW()::text)),
    updated_at       = NOW()
  WHERE
    status   = 'active'
    AND plan = 'SMART'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW() + INTERVAL '1 hour';

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'deactivate_smart_trial: downgraded % memberships to ZDARMA', affected_count;
END;
$$;

-- ============================================================
-- 5. SQL FUNKCE: user_has_role / user_has_any_role / user_is_admin
-- Utility funkce pro přístupová práva — PROD má, DEV chybí
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_role_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_id = p_role_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_any_role(p_user_id UUID, p_role_ids TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_id = ANY(p_role_ids)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_id IN ('admin', 'ceo')
  );
END;
$$;

-- ============================================================
-- 6. SQL FUNKCE: get_user_roles()
-- Vrací role uživatele s detaily — PROD má, DEV chybí
-- Využívá user_roles.assigned_at (přidaný výše)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_roles(p_user_id UUID)
RETURNS TABLE(role_id TEXT, role_name TEXT, role_level INTEGER, assigned_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.level,
    COALESCE(ur.assigned_at, ur.created_at) AS assigned_at
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = p_user_id
  ORDER BY r.level DESC;
END;
$$;

-- ============================================================
-- 7. SQL FUNKCE: get_daily_new_registrations()
-- Analytics — PROD má, DEV chybí
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_daily_new_registrations(
  from_ts TIMESTAMPTZ,
  to_ts   TIMESTAMPTZ
)
RETURNS TABLE(reg_date DATE, count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    created_at::date AS reg_date,
    COUNT(*)         AS count
  FROM auth.users
  WHERE created_at >= from_ts
    AND created_at <= to_ts
  GROUP BY 1
  ORDER BY 1;
$$;

-- ============================================================
-- 8. SQL FUNKCE: get_ecomail_queue_status()
-- Monitoring Ecomail fronty — PROD má, DEV má jiný název (get_ecomail_sync_health)
-- Přidáme pod PROD názvem, DEV verzi necháme
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ecomail_queue_status()
RETURNS TABLE(
  pending_count         BIGINT,
  processing_count      BIGINT,
  failed_count          BIGINT,
  oldest_pending        TIMESTAMPTZ,
  avg_processing_time_seconds NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending')     AS pending_count,
    COUNT(*) FILTER (WHERE status = 'processing')  AS processing_count,
    COUNT(*) FILTER (WHERE status = 'failed')      AS failed_count,
    MIN(created_at) FILTER (WHERE status = 'pending') AS oldest_pending,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at)))
      FILTER (WHERE status = 'completed')          AS avg_processing_time_seconds
  FROM public.ecomail_sync_queue
  WHERE created_at > NOW() - INTERVAL '24 hours';
$$;

-- ============================================================
-- 9. SQL FUNKCE: trigger_challenge_registrations_updated_at()
-- PROD má tento název, DEV má update_challenge_registrations_updated_at
-- Přidáme pod PROD názvem (DEV verzi necháme)
-- ============================================================
CREATE OR REPLACE FUNCTION public.trigger_challenge_registrations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 10. RLS POLÍČKY: Additivní — věci co PROD má a DEV chybí
-- ============================================================

-- challenge_registrations: service role ALL (PROD má allow_service_role_all)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenge_registrations'
      AND policyname = 'allow_service_role_all'
  ) THEN
    CREATE POLICY "allow_service_role_all"
      ON public.challenge_registrations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ecomail_failed_syncs: admins can view (PROD má, DEV jen service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_failed_syncs'
      AND policyname = 'Admins can view ecomail_failed_syncs'
  ) THEN
    CREATE POLICY "Admins can view ecomail_failed_syncs"
      ON public.ecomail_failed_syncs
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- ecomail_sync_queue: admins can view (PROD má, DEV má jen Users can view own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_sync_queue'
      AND policyname = 'Admins can view ecomail_sync_queue'
  ) THEN
    CREATE POLICY "Admins can view ecomail_sync_queue"
      ON public.ecomail_sync_queue
      FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- exercise_sessions: admin ALL (PROD má sessions_admin_all, DEV jen admin SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exercise_sessions'
      AND policyname = 'sessions_admin_all'
  ) THEN
    CREATE POLICY "sessions_admin_all"
      ON public.exercise_sessions
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- exercises: admin ALL (PROD má exercises_admin_all)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exercises'
      AND policyname = 'exercises_admin_all'
  ) THEN
    CREATE POLICY "exercises_admin_all"
      ON public.exercises
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- kp_measurements: admin ALL (PROD má kp_admin_all)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kp_measurements'
      AND policyname = 'kp_admin_all'
  ) THEN
    CREATE POLICY "kp_admin_all"
      ON public.kp_measurements
      FOR ALL
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
