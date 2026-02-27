-- =====================================================
-- Migration: Profile nickname + Referral system
-- Date: 2026-02-26
-- =====================================================

-- ============================================================
-- 1. Add columns to profiles table
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS vocative_override TEXT,
  ADD COLUMN IF NOT EXISTS nickname_set_at TIMESTAMPTZ;

-- Constraint: max 30 chars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_nickname_length'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_nickname_length
      CHECK (nickname IS NULL OR char_length(nickname) <= 30);
  END IF;
END $$;

-- Case-insensitive unique index (allows NULL = no nickname yet)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_unique_ci
  ON public.profiles (LOWER(nickname))
  WHERE nickname IS NOT NULL;

-- ============================================================
-- 2. referral_codes table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referral_codes (
  code       CHAR(6)     PRIMARY KEY,
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_codes_user_idx ON public.referral_codes(user_id);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own referral code" ON public.referral_codes;
CREATE POLICY "Users can read own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.referral_codes IS '6-digit numeric referral codes, one per user, auto-generated on registration';

-- ============================================================
-- 3. referral_events table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referral_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL CHECK (event_type IN (
    'registration',
    'first_purchase',
    'module_purchase',
    'subscription_start',
    'subscription_renewal'
  )),
  amount_czk       INTEGER     NOT NULL DEFAULT 0,
  stripe_payment_id TEXT,
  module_id        TEXT        REFERENCES public.modules(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial unique index: each referred user can only have ONE registration event
CREATE UNIQUE INDEX IF NOT EXISTS referral_events_registration_unique
  ON public.referral_events (referred_user_id)
  WHERE event_type = 'registration';

CREATE INDEX IF NOT EXISTS referral_events_referrer_idx ON public.referral_events(referrer_user_id);
CREATE INDEX IF NOT EXISTS referral_events_referred_idx ON public.referral_events(referred_user_id);

ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own referral stats" ON public.referral_events;
CREATE POLICY "Users can read own referral stats"
  ON public.referral_events FOR SELECT
  USING (auth.uid() = referrer_user_id);

COMMENT ON TABLE public.referral_events IS 'Tracks referral conversions: registrations and purchases via referral codes';
COMMENT ON COLUMN public.referral_events.amount_czk IS 'Transaction value in CZK for future reward calculation';

-- ============================================================
-- 4. Function: generate unique 6-digit numeric code
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS CHAR(6) AS $$
DECLARE
  new_code CHAR(6);
  attempts INT := 0;
BEGIN
  LOOP
    -- Generate random 6-digit number (100000–999999)
    new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.referral_codes WHERE code = new_code
    );
    attempts := attempts + 1;
    IF attempts > 200 THEN
      RAISE EXCEPTION 'Cannot generate unique referral code after 200 attempts';
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
COMMENT ON FUNCTION public.generate_referral_code() IS 'Generates a unique 6-digit numeric referral code. SECURITY DEFINER to bypass RLS.';

-- ============================================================
-- 5. Trigger: auto-create referral code for new users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.referral_codes (code, user_id)
  VALUES (public.generate_referral_code(), NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral();

COMMENT ON FUNCTION public.handle_new_user_referral() IS 'Auto-generates referral code for every new user. Fired by trigger on auth.users INSERT.';

-- ============================================================
-- 6. Backfill: generate codes for all existing users without one
-- ============================================================

DO $$
DECLARE
  u RECORD;
  inserted_count INT := 0;
BEGIN
  FOR u IN
    SELECT au.id FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = au.id
    )
  LOOP
    INSERT INTO public.referral_codes (code, user_id)
    VALUES (public.generate_referral_code(), u.id)
    ON CONFLICT DO NOTHING;
    inserted_count := inserted_count + 1;
  END LOOP;

  RAISE NOTICE '✅ Referral codes backfilled for % existing users', inserted_count;
END $$;

-- ============================================================
-- Done
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260226200000_profile_nickname_referral complete';
  RAISE NOTICE '   - profiles: nickname, vocative_override, nickname_set_at added';
  RAISE NOTICE '   - referral_codes table created with auto-generation trigger';
  RAISE NOTICE '   - referral_events table created';
END $$;
