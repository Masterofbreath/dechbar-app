-- =====================================================
-- Migration: Create default memberships for existing users
-- Date: 2026-02-05
-- Author: AI Agent
-- Purpose: Ensure all users have a membership record (default ZDARMA)
-- =====================================================

-- ============================================================
-- ENSURE MEMBERSHIPS TABLE EXISTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'ZDARMA' CHECK (plan IN ('ZDARMA', 'SMART', 'AI_COACH')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  type TEXT NOT NULL DEFAULT 'lifetime' CHECK (type IN ('lifetime', 'subscription')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  gopay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS memberships_user_idx ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_plan_idx ON public.memberships(plan);
CREATE INDEX IF NOT EXISTS memberships_status_idx ON public.memberships(status);

-- ============================================================
-- INSERT DEFAULT MEMBERSHIPS FOR EXISTING USERS
-- ============================================================

-- For all users without membership → Create ZDARMA plan
INSERT INTO public.memberships (user_id, plan, status, type)
SELECT 
  id, 
  'ZDARMA', 
  'active', 
  'lifetime'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.memberships m WHERE m.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- FUNCTION: Auto-create membership on user signup
-- ============================================================

-- Function to create default membership
CREATE OR REPLACE FUNCTION public.handle_new_user_membership()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.memberships (user_id, plan, status, type)
  VALUES (NEW.id, 'ZDARMA', 'active', 'lifetime')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_membership ON auth.users;
CREATE TRIGGER on_auth_user_created_membership
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_membership();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.memberships IS 'User membership plans (ZDARMA, SMART, AI_COACH)';
COMMENT ON COLUMN public.memberships.plan IS 'Membership tier: ZDARMA (free), SMART (249 Kč/mo), AI_COACH (490 Kč/mo)';
COMMENT ON COLUMN public.memberships.type IS 'lifetime = permanent, subscription = recurring monthly';
COMMENT ON COLUMN public.memberships.expires_at IS 'NULL for lifetime, date for subscriptions';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  RAISE NOTICE '✅ Memberships table ready!';
  RAISE NOTICE '✅ Default ZDARMA memberships created for all existing users';
  RAISE NOTICE '✅ Trigger installed: New users auto-get ZDARMA plan';
  RAISE NOTICE 'ℹ️ Total users with memberships: %', user_count;
END $$;
