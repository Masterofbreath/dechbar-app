-- ============================================================
-- ecomail_sync_queue: Povolit INSERT pro anon i přihlášené uživatele
--
-- Proč: Frontend volá captureEmail() přímo z prohlížeče — zachycuje
-- checkout_started event pro remarketing. Guest i přihlášení uživatelé
-- musí moci vložit záznam. Čtení a update zůstává jen pro service_role.
-- ============================================================

-- Anon uživatelé (hosté) mohou vložit checkout_started event
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_sync_queue'
    AND policyname = 'Anon can insert checkout events'
  ) THEN
    CREATE POLICY "Anon can insert checkout events"
      ON public.ecomail_sync_queue
      FOR INSERT
      TO anon
      WITH CHECK (
        event_type IN ('checkout_started', 'user_registered')
      );
  END IF;
END $$;

-- Přihlášení uživatelé mohou vložit vlastní eventy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ecomail_sync_queue'
    AND policyname = 'Authenticated can insert own events'
  ) THEN
    CREATE POLICY "Authenticated can insert own events"
      ON public.ecomail_sync_queue
      FOR INSERT
      TO authenticated
      WITH CHECK (
        event_type IN ('checkout_started', 'user_registered', 'product_purchased', 'tag_update')
        AND (user_id IS NULL OR user_id = auth.uid())
      );
  END IF;
END $$;
