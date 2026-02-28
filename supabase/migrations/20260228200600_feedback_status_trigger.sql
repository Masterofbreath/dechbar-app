-- ============================================================
-- Feedback: Admin SELECT policy + Status change trigger
--
-- 1. Admin/CEO SELECT policy — mohou číst všechny podněty
-- 2. Trigger notify_user_on_feedback_status() — automaticky
--    odešle notifikaci uživateli při změně statusu
--    (new→accepted, accepted→done)
--
-- Nahrazuje Edge Function feedback-status-notify pro notifikace.
-- Status update probíhá přímo z browser klienta (RLS UPDATE policy
-- z migrace 20260228200500 to povoluje).
--
-- @since 2026-02-28
-- ============================================================

-- ── Admin/CEO SELECT policy ─────────────────────────────────

CREATE POLICY "Admins can view all feedback"
  ON public.user_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role_id IN ('admin', 'ceo')
    )
  );

-- ── Trigger: Notifikace uživateli při změně statusu ─────────
-- SECURITY DEFINER — běží jako owner, obchází RLS
-- BEFORE UPDATE → může modifikovat NEW (nastavit timestamps)

CREATE OR REPLACE FUNCTION public.notify_user_on_feedback_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notif_title  TEXT;
  v_notif_msg    TEXT;
  v_notif_id     UUID;
BEGIN
  -- Reaguj pouze na změnu statusu
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Nastav timestamps automaticky při změně statusu
  IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
    NEW.accepted_at := now();
  END IF;

  IF NEW.status = 'done' AND NEW.done_at IS NULL THEN
    NEW.done_at := now();
  END IF;

  -- Notification texty dle nového statusu
  IF NEW.status = 'accepted' THEN
    v_notif_title := 'Tvůj podnět jsme přijali';
    v_notif_msg   := 'Díky! Rozdýcháváme to a brzy se k tomu dostaneme.';
  ELSIF NEW.status = 'done' THEN
    v_notif_title := 'Tvůj podnět je splněn';
    v_notif_msg   := 'Udělali jsme to pro tebe. Ať to dýchá!';
  ELSE
    -- Jiný status přechod — bez notifikace
    RETURN NEW;
  END IF;

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
    NULL,
    NULL,
    'role',
    now(),
    true,
    'feedback_' || NEW.status
  )
  RETURNING id INTO v_notif_id;

  -- Fanout do user_notifications pro odesílatele podnětu
  INSERT INTO public.user_notifications (user_id, notification_id, read)
  VALUES (NEW.user_id, v_notif_id, false)
  ON CONFLICT (user_id, notification_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_feedback_status_change
  BEFORE UPDATE OF status ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_on_feedback_status();
