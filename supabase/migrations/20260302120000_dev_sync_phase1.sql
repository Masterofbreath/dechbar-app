-- ============================================================
-- FÁZE 1: DEV sync — Apply ONLY to DEV (nrlqzighwaeuxcicuhse)
-- Date: 2026-03-02
-- Reason: DEV was missing early_access_until column that PROD
--   already has. Also cleaning up stale/misconfigured cron jobs.
-- ============================================================

-- 1. Add early_access_until to platform_featured_program on DEV
--    (PROD already has this from a direct MCP apply — this brings DEV in sync)
ALTER TABLE public.platform_featured_program
  ADD COLUMN IF NOT EXISTS early_access_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.platform_featured_program.early_access_until IS
  'Users who registered AFTER this date see the program as locked (requires SMART). NULL = no deadline.';

-- Set early access deadline for Ranní dechová výzva (matches PROD value)
UPDATE public.platform_featured_program
SET early_access_until = '2026-03-07 23:59:59+00'
WHERE module_id = 'ranni-dechova-vyzva';

-- 2. Remove stale activate-smart-trial cron (ran 28.2.2026, already executed)
SELECT cron.unschedule('activate-smart-trial-2026-03');

-- 3. Fix ecomail sync frequency: every minute → every 5 minutes (matches PROD)
SELECT cron.unschedule('ecomail-sync-every-minute');

SELECT cron.schedule(
  'ecomail-sync-every-5min',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://nrlqzighwaeuxcicuhse.supabase.co/functions/v1/sync-to-ecomail',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybHF6aWdod2FldXhjaWN1aHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzk0ODksImV4cCI6MjA4MzgxNTQ4OX0.GWXHx8HI2IgkZVtgUkXPsMg8qW7k77gQo7BE3A_3gig'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ DEV Phase 1 sync complete:';
  RAISE NOTICE '  - early_access_until added to platform_featured_program';
  RAISE NOTICE '  - stale activate-smart-trial cron removed';
  RAISE NOTICE '  - ecomail sync changed from every minute to every 5 min';
END;
$$;
