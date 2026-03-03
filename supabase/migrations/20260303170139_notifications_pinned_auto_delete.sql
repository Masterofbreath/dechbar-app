-- ============================================================
-- Migration: Pinnované notifikace + auto-delete (pg_cron)
-- Date: 2026-03-03
-- Scope: DEV + PROD
-- Riziko: NULOVÉ — přidání sloupce (nullable) + nový cron job
--
-- Co přidáváme:
--   1. notifications.is_pinned   — admin označí notifikaci jako trvalou
--   2. pg_cron job každou noc    — soft-delete starých user_notifications
--      Pravidla TTL:
--        promo            → 7 dní
--        ostatní typy     → 14 dní
--        is_pinned = true → nikdy (vyňato z mazání)
-- ============================================================

-- ── 1. is_pinned sloupec ─────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.notifications.is_pinned IS
  'Pinnovaná notifikace — nikdy se automaticky nesmaže, zobrazuje se nahoře v Notification Center';

-- ── 2. Helper funkce pro auto-delete ─────────────────────────
-- Volaná pg_cron jobem každou noc ve 3:00 UTC.
-- Soft-delete: nastavuje deleted_at (neodstraňuje data — stats zůstanou).

CREATE OR REPLACE FUNCTION public.auto_cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  UPDATE user_notifications un
  SET deleted_at = NOW()
  FROM notifications n
  WHERE un.notification_id = n.id
    AND un.deleted_at IS NULL
    AND n.is_pinned = FALSE
    AND (
      -- promo: 7 dní
      (n.type = 'promo'  AND un.created_at < NOW() - INTERVAL '7 days')
      OR
      -- ostatní typy: 14 dní
      (n.type <> 'promo' AND un.created_at < NOW() - INTERVAL '14 days')
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_cleanup_old_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_cleanup_old_notifications() TO service_role;

-- ── 3. pg_cron job — každou noc 03:00 UTC ────────────────────

SELECT cron.schedule(
  'auto-cleanup-notifications',       -- název jobu (unikátní)
  '0 3 * * *',                         -- každý den ve 3:00 UTC
  'SELECT public.auto_cleanup_old_notifications()'
);
