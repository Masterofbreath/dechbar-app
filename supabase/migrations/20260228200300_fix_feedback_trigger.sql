-- ============================================================
-- Fix: notify_admins_on_feedback — oprava role_id
--
-- user_roles tabulka používá role_id (ne role).
-- Nahrazuje původní trigger z migrace 20260228200200.
--
-- @since 2026-02-28
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_admins_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_name    TEXT;
  v_notif_title  TEXT;
  v_notif_msg    TEXT;
  v_notif_id     UUID;
  v_admin_ids    UUID[];
  v_short_msg    TEXT;
BEGIN
  -- Načti jméno uživatele z profiles
  SELECT COALESCE(full_name, email, 'Člen DechBaru')
  INTO v_user_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;

  IF v_user_name IS NULL THEN
    v_user_name := 'Člen DechBaru';
  END IF;

  -- Zkrácená zpráva (max 80 znaků)
  v_short_msg := LEFT(NEW.message, 80);
  IF char_length(NEW.message) > 80 THEN
    v_short_msg := v_short_msg || '...';
  END IF;

  -- Titulek dle kategorie
  v_notif_title := CASE NEW.category
    WHEN 'napad'    THEN 'Nový podnět: Nápad'
    WHEN 'chyba'    THEN 'Nový podnět: Chyba'
    WHEN 'pochvala' THEN 'Nový podnět: Pochvala'
    ELSE                 'Nový podnět'
  END;

  -- Zpráva s jménem a zkráceným textem
  v_notif_msg := v_user_name || ': ' || v_short_msg;

  -- Vlož notifikaci
  INSERT INTO public.notifications (
    type,
    title,
    message,
    action_url,
    action_label,
    target_audience,
    sent_at,
    is_auto_generated,
    auto_trigger
  ) VALUES (
    'system',
    v_notif_title,
    v_notif_msg,
    '/app/admin/feedback',
    'Zobrazit',
    'role',
    now(),
    true,
    'feedback_submitted'
  )
  RETURNING id INTO v_notif_id;

  -- Načti user_id všech adminů a CEO — sloupec role_id (správný název)
  SELECT ARRAY_AGG(DISTINCT ur.user_id)
  INTO v_admin_ids
  FROM public.user_roles ur
  WHERE ur.role_id IN ('admin', 'ceo')
    AND ur.user_id IS NOT NULL;

  -- Fanout do user_notifications
  IF v_admin_ids IS NOT NULL AND array_length(v_admin_ids, 1) > 0 THEN
    INSERT INTO public.user_notifications (user_id, notification_id, read)
    SELECT unnest(v_admin_ids), v_notif_id, false
    ON CONFLICT (user_id, notification_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
