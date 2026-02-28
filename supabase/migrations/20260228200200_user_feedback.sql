-- ============================================================
-- user_feedback — Feedback systém "Sdílej podnět"
--
-- Tabulka pro sběr podnětů ke zlepšení od členů DechBaru.
-- Admin notifikace jsou automaticky odesílány přes Postgres trigger.
--
-- @since 2026-02-28
-- ============================================================

-- ── Tabulka ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category     TEXT        NOT NULL CHECK (category IN ('napad', 'chyba', 'pochvala', 'jine')),
  message      TEXT        NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 1000),
  image_url    TEXT,
  app_version  TEXT,
  status       TEXT        NOT NULL DEFAULT 'new'
                           CHECK (status IN ('new', 'accepted', 'done')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  done_at      TIMESTAMPTZ
);

-- ── Indexy ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id  ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status   ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON public.user_feedback(category);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Uživatel může vkládat vlastní podněty
CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Uživatel může číst pouze své vlastní podněty
CREATE POLICY "Users can view own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- ── Trigger: Admin notifikace při novém podnětu ───────────────
-- SECURITY DEFINER = funkce běží jako owner (postgres), obchází RLS
-- Vloží notifikaci do notifications + user_notifications pro všechny admin/ceo

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

  -- Vlož notifikaci do notifications tabulky
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

  -- Načti user_id všech adminů a CEO — role_id je správný název sloupce
  SELECT ARRAY_AGG(DISTINCT ur.user_id)
  INTO v_admin_ids
  FROM public.user_roles ur
  WHERE ur.role_id IN ('admin', 'ceo')
    AND ur.user_id IS NOT NULL;

  -- Fanout do user_notifications pro každého admina/CEO
  IF v_admin_ids IS NOT NULL AND array_length(v_admin_ids, 1) > 0 THEN
    INSERT INTO public.user_notifications (user_id, notification_id, read)
    SELECT unnest(v_admin_ids), v_notif_id, false
    ON CONFLICT (user_id, notification_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger se spustí po každém novém záznamu v user_feedback
CREATE TRIGGER after_feedback_insert
  AFTER INSERT ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_feedback();
