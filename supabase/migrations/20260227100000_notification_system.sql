-- ============================================================
-- Notification System
-- ============================================================

-- ============================================================
-- notifications — admin/system created messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL CHECK (type IN ('system','progress','achievement','promo','reminder')),
  title            text NOT NULL,
  message          text NOT NULL,
  action_url       text,
  action_label     text,
  target_audience  text NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all','role','tier')),
  target_role      text,   -- 'admin' | 'ceo' | 'teacher' etc.
  target_tier      text,   -- 'ZDARMA' | 'SMART' | 'AI_COACH'
  scheduled_at     timestamptz,
  sent_at          timestamptz,
  created_by       uuid REFERENCES auth.users(id),
  is_auto_generated boolean NOT NULL DEFAULT false,
  auto_trigger     text,   -- 'kp_record' | 'purchase' | 'streak_7' | 'daily_reminder' etc.
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- user_notifications — per-user delivery + read state
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id uuid NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read            boolean NOT NULL DEFAULT false,
  read_at         timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_id)
);

-- ============================================================
-- notification_auto_triggers — admin ON/OFF per trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_auto_triggers (
  trigger          text PRIMARY KEY,
  enabled          boolean NOT NULL DEFAULT true,
  default_title    text NOT NULL,
  default_message  text NOT NULL,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Seed default triggers (idempotent)
INSERT INTO public.notification_auto_triggers (trigger, enabled, default_title, default_message)
VALUES
  ('kp_record',       true,  'Nový rekord KP!',                'Tvá kontrolní pauza dosáhla nového rekordu. Skvělý pokrok!'),
  ('purchase',        true,  'Program přidán do knihovny',     'Tvůj nový program je připraven ke studiu.'),
  ('streak_7',        true,  '7 dní v řadě!',                  'Sedm dní cvičení za sebou — výjimečný výkon.'),
  ('streak_21',       false, '21 dní v řadě!',                 'Tři týdny nepřerušeného cvičení. Gratulujeme!'),
  ('daily_reminder',  true,  'Čas na dechpresso',              'Dobré ráno. Pár minut dechu změní celý den.')
ON CONFLICT (trigger) DO NOTHING;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_auto_triggers ENABLE ROW LEVEL SECURITY;

-- ── notifications ─────────────────────────────────────────
-- Přihlášení uživatelé mohou číst
CREATE POLICY "auth_read_notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (true);

-- Admins mohou vkládat + aktualizovat
CREATE POLICY "admin_write_notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_update_notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ── user_notifications ────────────────────────────────────
-- Uživatel vidí jen své záznamy (bez smazaných)
CREATE POLICY "user_sees_own_notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Uživatel může aktualizovat své záznamy (read/delete)
CREATE POLICY "user_modifies_own_notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins mohou vkládat záznamy (fanout při odeslání)
CREATE POLICY "admin_insert_user_notifications"
  ON public.user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ── notification_auto_triggers ────────────────────────────
-- Přihlášení uživatelé mohou číst (pro systém)
CREATE POLICY "auth_read_triggers"
  ON public.notification_auto_triggers FOR SELECT
  TO authenticated
  USING (true);

-- Admins mohou aktualizovat triggery
CREATE POLICY "admin_update_triggers"
  ON public.notification_auto_triggers FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- Indexy pro výkon
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON public.user_notifications(user_id, read, deleted_at);

CREATE INDEX IF NOT EXISTS idx_notifications_sent
  ON public.notifications(sent_at, target_audience);
