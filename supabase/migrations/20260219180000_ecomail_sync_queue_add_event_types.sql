-- ============================================================
-- ecomail_sync_queue: Přidat checkout_started do event_type CHECK
--
-- Původní constraint neobsahoval 'checkout_started', který používáme
-- v email-first checkout flow (captureEmail v useDigitalniTichoCheckout).
-- ============================================================

-- Odstraníme starý constraint a vytvoříme nový s rozšířeným seznamem
-- NOT VALID = constraint se neověřuje na existujících řádcích (mohou mít jiné event_type z předchozích testů)
ALTER TABLE public.ecomail_sync_queue
  DROP CONSTRAINT IF EXISTS ecomail_sync_queue_event_type_check;

ALTER TABLE public.ecomail_sync_queue
  ADD CONSTRAINT ecomail_sync_queue_event_type_check
  CHECK (event_type IN (
    'user_registered',
    'user_upgraded',
    'user_downgraded',
    'challenge_registered',
    'product_purchased',
    'checkout_started',
    'checkout_completed',
    'tag_update'
  )) NOT VALID;
