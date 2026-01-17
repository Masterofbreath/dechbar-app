-- =============================================================================
-- 🚀 DEV DATABASE - COMPLETE SETUP FROM PROD
-- =============================================================================

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.user_modules CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TYPE IF EXISTS membership_plan_type CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE TYPE membership_plan_type AS ENUM ('ZDARMA', 'SMART', 'AI_COACH');

CREATE TABLE public.modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_czk INTEGER NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('lifetime', 'subscription')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_beta BOOLEAN NOT NULL DEFAULT false,
  requires_module_id TEXT REFERENCES public.modules(id),
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pricing JSONB
);

INSERT INTO public.modules VALUES
('membership-smart', 'SMART', 'Inteligentní doporučení - BOLT tracking, smart tréninky, 50+ programů', 249, 'subscription', true, false, null, 'smart', '#2CBEC6', 1, '2026-01-14 09:52:01.559705+00', '2026-01-14 11:11:57.223536+00', 
'{"annual": {"amount": 1499, "savings": 1488, "currency": "CZK", "interval": "year", "per_month": 125, "stripe_price_id": "price_smart_annual_czk", "stripe_product_id": "prod_smart_membership"}, "monthly": {"amount": 249, "currency": "CZK", "interval": "month", "stripe_price_id": "price_smart_monthly_czk", "stripe_product_id": "prod_smart_membership"}}'::jsonb),
('membership-ai-coach', 'AI COACH', 'Tvůj osobní AI trenér - AI personalizace, pokročilé analýzy, 100+ programů', 490, 'subscription', true, false, null, 'ai-coach', '#D6A23A', 2, '2026-01-14 09:52:01.559705+00', '2026-01-14 11:11:57.223536+00', 
'{"annual": {"amount": 2940, "savings": 2940, "currency": "CZK", "interval": "year", "per_month": 245, "stripe_price_id": "price_ai_annual_czk", "stripe_product_id": "prod_ai_coach_membership"}, "monthly": {"amount": 490, "currency": "CZK", "interval": "month", "stripe_price_id": "price_ai_monthly_czk", "stripe_product_id": "prod_ai_coach_membership"}}'::jsonb),
('academy', 'Akademie', 'Vzdělávací kurzy a lekce', 990, 'lifetime', true, false, null, null, null, 3, '2026-01-09 11:41:39.70661+00', '2026-01-09 11:41:39.70661+00', null),
('challenges', 'Výzvy', '21-denní dechové výzvy', 990, 'lifetime', true, false, null, null, '#F0C76A', 4, '2026-01-09 11:41:39.70661+00', '2026-01-14 11:11:57.223536+00', 
'{"lifetime": {"amount": 990, "currency": "CZK", "stripe_price_id": "price_challenges_lifetime_czk", "stripe_product_id": "prod_challenges"}}'::jsonb);

CREATE INDEX idx_modules_sort_order ON public.modules(sort_order);
CREATE INDEX idx_modules_is_active ON public.modules(is_active);

CREATE TABLE public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.roles VALUES
('member', 'Člen DechBaru', 'Základní člen komunity', 1, '2026-01-09 11:46:02.053522+00'),
('student', 'Student', 'Student dechových cvičení', 1, '2026-01-09 11:46:02.053522+00'),
('vip_member', 'VIP člen DechBaru', 'VIP člen s rozšířenými výhodami', 2, '2026-01-09 11:46:02.053522+00'),
('teacher', 'Učitel', 'Učitel/lektor dechových cvičení', 3, '2026-01-09 11:46:02.053522+00'),
('admin', 'Admin', 'Administrátor platformy', 4, '2026-01-09 11:46:02.053522+00'),
('ceo', 'CEO', 'Majitel/CEO', 5, '2026-01-09 11:46:02.053522+00');

CREATE INDEX idx_roles_level ON public.roles(level);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan membership_plan_type NOT NULL DEFAULT 'ZDARMA',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  type TEXT NOT NULL DEFAULT 'lifetime' CHECK (type IN ('lifetime', 'subscription')),
  billing_interval TEXT CHECK (billing_interval IN ('monthly', 'annual')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  cancelled_at TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.memberships ADD CONSTRAINT check_subscription_has_interval 
  CHECK ((type = 'subscription' AND billing_interval IS NOT NULL) OR (type = 'lifetime'));

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_plan ON public.memberships(plan);

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES public.modules(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('lifetime', 'subscription')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  payment_id TEXT,
  payment_provider TEXT CHECK (payment_provider IN ('gopay', 'stripe'))
);

CREATE INDEX idx_user_modules_user_id ON public.user_modules(user_id);
CREATE INDEX idx_user_modules_module_id ON public.user_modules(module_id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES public.roles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
