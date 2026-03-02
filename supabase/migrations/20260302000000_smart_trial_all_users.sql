-- ============================================================
-- SMART Trial pro všechny uživatele (březen 2026)
-- Aplikováno: 2. 3. 2026 manuálně přes MCP na PROD
-- expires_at: 2026-03-22 00:00:00+01:00
-- ============================================================

-- 1) Oprava trigger funkce queue_ecomail_on_membership_change
--    (ENUM cast + správné event_type hodnoty)
--    Aplikováno: 1.3.2026 přes MCP
CREATE OR REPLACE FUNCTION public.queue_ecomail_on_membership_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  is_trial   BOOLEAN;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

  IF NEW.metadata IS NOT NULL AND NEW.metadata->>'is_trial' IS NOT NULL THEN
    is_trial := (NEW.metadata->>'is_trial')::boolean;
  ELSE
    is_trial := (NEW.type = 'trial');
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.plan = 'ZDARMA' THEN
      INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
      VALUES (NEW.user_id, user_email, 'tag_update',
        jsonb_build_object('tag', 'TARIF_ZDARMA', 'list_id', '5'));
      RETURN NEW;
    END IF;

    INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
    VALUES (
      NEW.user_id, user_email, 'user_upgraded',
      jsonb_build_object(
        'plan',        NEW.plan::text,
        'is_trial',    is_trial,
        'add_tags',    jsonb_build_array(
          'TARIF_' || UPPER(NEW.plan::text),
          CASE WHEN is_trial THEN 'TRIAL_ACTIVE' ELSE 'PAYING' END
        ),
        'remove_tags', jsonb_build_array('TARIF_ZDARMA'),
        'custom_fields', jsonb_build_object(
          'TARIFF',            NEW.plan::text,
          'TARIFF_START_DATE', TO_CHAR(NEW.purchased_at, 'YYYY-MM-DD'),
          'TRIAL_END_DATE',    CASE WHEN NEW.expires_at IS NOT NULL
                                 THEN TO_CHAR(NEW.expires_at, 'YYYY-MM-DD')
                                 ELSE NULL END
        ),
        'move_to_list', 'PREMIUM'
      )
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'expired' THEN
      INSERT INTO ecomail_sync_queue (user_id, email, event_type, payload)
      VALUES (NEW.user_id, user_email, 'list_move',
        jsonb_build_object(
          'from_list_name', 'PREMIUM',
          'to_list_name',   'REG',
          'tags', jsonb_build_array('TRIAL_EXPIRED', 'TARIF_ZDARMA')
        ));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Nová registrace do 7. 3. → automaticky SMART trial
CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trial_deadline TIMESTAMPTZ := '2026-03-07 23:59:59+01:00';
BEGIN
  IF NOW() <= trial_deadline THEN
    INSERT INTO public.memberships (
      user_id, plan, status, type,
      purchased_at, expires_at, billing_interval,
      description, metadata,
      created_at, updated_at
    ) VALUES (
      NEW.id,
      'SMART'::public.membership_plan_type,
      'active', 'subscription',
      NOW(), '2026-03-22 00:00:00+01:00', 'monthly',
      'SMART trial do 22.3.2026 - registrace během akce',
      '{"is_trial": true, "was_zdarma": false}'::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.memberships (
      user_id, plan, status, type,
      purchased_at, created_at, updated_at
    ) VALUES (
      NEW.id,
      'ZDARMA'::public.membership_plan_type,
      'active', 'lifetime',
      NOW(), NOW(), NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user_membership failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3) Funkce pro deaktivaci SMART trial → ZDARMA (volána pg_cron 22.3. 23:00 UTC)
CREATE OR REPLACE FUNCTION public.deactivate_smart_trial()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 4) pg_cron: deaktivace 22.3.2026 ve 23:00 UTC (= 00:00 CET)
--    Aplikováno přes MCP (cron.schedule je transakční příkaz, nelze v migraci)
--    SELECT cron.schedule('deactivate-smart-trial-2026-03-22', '0 23 21 3 *', $$SELECT public.deactivate_smart_trial();$$);

-- 5) Hromadná aktivace SMART pro všechny stávající uživatele
--    Aplikováno: 2.3.2026 přes MCP
--    UPDATE memberships SET plan='SMART', type='subscription', expires_at='2026-03-22 00:00:00+01:00',
--      billing_interval='monthly', metadata=jsonb_set(...,'{was_zdarma}','true')
--    WHERE status='active' AND plan='ZDARMA';
--    + INSERT SMART pro uživatele bez membership
