-- ============================================================
-- Ecomail Sync Queue
-- Fronta pro synchronizaci kontaktů a eventů do Ecomail
-- Zpracovává: Edge Function sync-to-ecomail (CRON každých 60s)
-- ============================================================

-- Main sync queue
CREATE TABLE IF NOT EXISTS public.ecomail_sync_queue (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT        NOT NULL,
  event_type      TEXT        NOT NULL,
  payload         JSONB       NOT NULL DEFAULT '{}',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count     INTEGER     NOT NULL DEFAULT 0,
  max_retries     INTEGER     NOT NULL DEFAULT 3,
  last_error      TEXT,
  processed_at    TIMESTAMPTZ,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dead letter queue (items that exhausted retries)
CREATE TABLE IF NOT EXISTS public.ecomail_failed_syncs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  original_queue_id     UUID,
  user_id               UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email                 TEXT        NOT NULL,
  event_type            TEXT        NOT NULL,
  payload               JSONB       NOT NULL DEFAULT '{}',
  error_message         TEXT,
  retry_history         JSONB       NOT NULL DEFAULT '[]',
  requires_manual_review BOOLEAN   NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Přidej sloupec resolved pokud neexistuje (pro starší verze tabulky)
ALTER TABLE public.ecomail_failed_syncs
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

-- Přidej chybějící sloupce v sync_queue pokud neexistují
ALTER TABLE public.ecomail_sync_queue
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE public.ecomail_sync_queue
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Indexes pro výkon
CREATE INDEX IF NOT EXISTS ecomail_sync_queue_status_idx
  ON public.ecomail_sync_queue(status)
  WHERE status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS ecomail_sync_queue_email_idx
  ON public.ecomail_sync_queue(email);

CREATE INDEX IF NOT EXISTS ecomail_failed_syncs_review_idx
  ON public.ecomail_failed_syncs(requires_manual_review)
  WHERE requires_manual_review = true AND resolved = false;

-- RLS
ALTER TABLE public.ecomail_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecomail_failed_syncs ENABLE ROW LEVEL SECURITY;

-- Pouze service_role (Edge Functions) může číst/zapisovat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_sync_queue'
    AND policyname = 'Service role full access to sync queue'
  ) THEN
    CREATE POLICY "Service role full access to sync queue"
      ON public.ecomail_sync_queue
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_failed_syncs'
    AND policyname = 'Service role full access to failed syncs'
  ) THEN
    CREATE POLICY "Service role full access to failed syncs"
      ON public.ecomail_failed_syncs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'ecomail_sync_queue_updated_at'
  ) THEN
    CREATE TRIGGER ecomail_sync_queue_updated_at
      BEFORE UPDATE ON public.ecomail_sync_queue
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMENT ON TABLE public.ecomail_sync_queue IS 'Queue for syncing contacts/events to Ecomail. Processed by sync-to-ecomail Edge Function every 60s.';
COMMENT ON TABLE public.ecomail_failed_syncs IS 'Dead letter queue for failed Ecomail sync items after max retries.';
COMMENT ON COLUMN public.ecomail_sync_queue.event_type IS 'Types: user_registered, user_upgraded, user_downgraded, challenge_registered, product_purchased, checkout_started, tag_update';
