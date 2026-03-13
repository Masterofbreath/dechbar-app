-- Migration: tour tables — Nápověda & Onboarding Tour System
-- Sprint 1 — DB infrastruktura pro krokovaný průvodce aplikací.
--
-- Datová hierarchie: Úroveň → Kapitola → Krok → User Progress + State
-- Tabulky jsou additive-only (IF NOT EXISTS), bezpečné pro PROD.
--
-- Součástí: tour_levels, tour_chapters, tour_steps,
--           user_tour_progress, user_tour_state, user_tour_onboarding_state

-- =============================================
-- 1. tour_levels — úrovně průvodce (FREE, SMART)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tour_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_index   INTEGER NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  title         JSONB NOT NULL DEFAULT '{}',        -- i18n: {"cs": "Základní Tour"}
  description   JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  requires_plan TEXT DEFAULT NULL,                  -- NULL = FREE, 'SMART' = vyžaduje SMART
  reward_days   INTEGER DEFAULT 0,                  -- dny SMART odměny za dokončení úrovně
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tour_levels IS
  'Nápověda: úrovně průvodce — každá úroveň odpovídá skupině kapitol (FREE / SMART).';

CREATE INDEX IF NOT EXISTS tour_levels_order_idx
  ON public.tour_levels (order_index);

-- =============================================
-- 2. tour_chapters — kapitoly (segmenty aplikace)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tour_chapters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id    UUID NOT NULL REFERENCES public.tour_levels(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  slug        TEXT NOT NULL UNIQUE,          -- 'dnes-overview', 'kp-measurement'...
  title       JSONB NOT NULL DEFAULT '{}',   -- i18n: {"cs": "View Dnes"}
  route_path  TEXT,                          -- '/app' — kde se kapitola spouští
  tab_context TEXT,                          -- 'dnes', 'cvicit'... pro TabCarousel
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tour_chapters IS
  'Nápověda: kapitoly průvodce — každá kapitola odpovídá sekci/view aplikace.';

CREATE INDEX IF NOT EXISTS tour_chapters_level_id_idx
  ON public.tour_chapters (level_id);

CREATE INDEX IF NOT EXISTS tour_chapters_order_idx
  ON public.tour_chapters (level_id, order_index);

-- =============================================
-- 3. tour_steps — konkrétní kroky průvodce
-- =============================================
CREATE TABLE IF NOT EXISTS public.tour_steps (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id            UUID NOT NULL REFERENCES public.tour_chapters(id) ON DELETE CASCADE,
  order_index           INTEGER NOT NULL,            -- 1–9 (max 9 kroků na kapitolu)
  title                 JSONB NOT NULL DEFAULT '{}', -- i18n: {"cs": "Titulek kroku"}
  description           JSONB NOT NULL DEFAULT '{}', -- i18n: max 2-3 věty
  dom_selector          TEXT,                        -- CSS selektor pro Spotlight
  element_hint          TEXT,                        -- lidský popis kde element je (pro debug)
  step_type             TEXT NOT NULL DEFAULT 'highlight'
                          CHECK (step_type IN ('highlight', 'interactive', 'info')),
  -- highlight   = jen zvýrazni + text
  -- interactive = uživatel musí udělat akci
  -- info        = fullscreen info slide bez highlightu
  interactive_action    TEXT,                        -- 'fill_nickname', 'measure_kp', 'submit_feedback'
  is_required_for_reward BOOLEAN DEFAULT false,      -- musí být splněn pro získání odměny
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tour_steps IS
  'Nápověda: konkrétní kroky průvodce — spotlight, text, interaktivní akce.';

CREATE INDEX IF NOT EXISTS tour_steps_chapter_id_idx
  ON public.tour_steps (chapter_id);

CREATE INDEX IF NOT EXISTS tour_steps_order_idx
  ON public.tour_steps (chapter_id, order_index);

-- =============================================
-- 4. user_tour_progress — per-user per-step stav
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_tour_progress (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id          UUID NOT NULL REFERENCES public.tour_steps(id) ON DELETE CASCADE,
  chapter_id       UUID NOT NULL REFERENCES public.tour_chapters(id) ON DELETE CASCADE,
  level_id         UUID NOT NULL REFERENCES public.tour_levels(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'completed', 'skipped', 'deferred')),
  completed_at     TIMESTAMPTZ,
  deferred_at      TIMESTAMPTZ,               -- odloženo na později
  view_context     TEXT,                      -- route kde byl uživatel
  interaction_data JSONB DEFAULT '{}',        -- co uživatel udělal (vyplněná přezdívka atd.)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_tour_progress_unique UNIQUE (user_id, step_id)
);

COMMENT ON TABLE public.user_tour_progress IS
  'Nápověda: granulární per-user stav každého kroku průvodce (completed/skipped/deferred).';

CREATE INDEX IF NOT EXISTS user_tour_progress_user_id_idx
  ON public.user_tour_progress (user_id);

CREATE INDEX IF NOT EXISTS user_tour_progress_step_id_idx
  ON public.user_tour_progress (step_id);

CREATE INDEX IF NOT EXISTS user_tour_progress_user_level_idx
  ON public.user_tour_progress (user_id, level_id);

-- =============================================
-- 5. user_tour_state — souhrnný stav Tour per user
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_tour_state (
  user_id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  onboarding_shown_at      TIMESTAMPTZ,              -- kdy viděl uvítací slide
  current_level_id         UUID REFERENCES public.tour_levels(id),
  current_chapter_id       UUID REFERENCES public.tour_chapters(id),
  current_step_id          UUID REFERENCES public.tour_steps(id),
  level1_completed_at      TIMESTAMPTZ,              -- kdy dokončil Úroveň 1
  level2_completed_at      TIMESTAMPTZ,              -- kdy dokončil Úroveň 2
  tour_completed_at        TIMESTAMPTZ,              -- kdy dokončil celou Tour
  reward_phase1_granted_at TIMESTAMPTZ,              -- kdy dostal 1 den SMART
  reward_phase2_granted_at TIMESTAMPTZ,              -- kdy dostal +2 dny SMART
  bulb_state               TEXT NOT NULL DEFAULT 'lit'
                             CHECK (bulb_state IN ('lit', 'dim', 'hidden')),
  -- lit    = svítí (neprojito)
  -- dim    = zhasnuto (projito), ale Tour nedokončena
  -- hidden = vše splněno nebo uživatel skryl
  show_bulb_preference     BOOLEAN DEFAULT true,     -- uživatelovo nastavení (Settings toggle)
  deferred_until           TIMESTAMPTZ,              -- odloženo do tohoto času
  sessions_count           INTEGER DEFAULT 0,        -- kolikrát uživatel otevřel Tour
  last_session_at          TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_tour_state IS
  'Nápověda: souhrnný stav Tour per uživatel — aktuální krok, dokončení úrovní, odměny, bulb stav.';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_user_tour_state_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_tour_state_updated_at
  BEFORE UPDATE ON public.user_tour_state
  FOR EACH ROW EXECUTE FUNCTION public.update_user_tour_state_updated_at();

-- =============================================
-- 6. user_tour_onboarding_state — OnboardJS plugin cache
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_tour_onboarding_state (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_data  JSONB,                                  -- OnboardJS interní stav (celý flow)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_tour_onboarding_state IS
  'Nápověda: OnboardJS plugin cache — cross-device sync stavu Tour. Detailní data jsou v user_tour_progress.';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_user_tour_onboarding_state_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_tour_onboarding_state_updated_at
  BEFORE UPDATE ON public.user_tour_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION public.update_user_tour_onboarding_state_updated_at();
