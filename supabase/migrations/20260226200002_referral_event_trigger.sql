-- =====================================================
-- Migration: Referral Event Auto-Recording
-- Date: 2026-02-26
--
-- HOW IT WORKS:
--
-- MAGIC LINK path:
--   Frontend passes referral_code in user metadata → Supabase creates
--   auth.users row → this trigger fires → reads referral_code from
--   raw_user_meta_data → looks up referrer → inserts referral_event.
--
-- OAUTH path:
--   Frontend cannot inject metadata before OAuth redirect.
--   After OAuth returns, frontend calls record_referral_registration(code)
--   RPC function (SECURITY DEFINER) does the lookup + insert.
--
-- BOTH paths use the same partial unique index (one registration per
-- referred_user_id) to prevent duplicates.
-- =====================================================

-- ============================================================
-- 1. Trigger function: fires on every new auth.users INSERT
--    Reads referral_code from raw_user_meta_data and creates event
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_referral_event()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_user_id UUID;
BEGIN
  -- Read referral_code from user metadata (set by frontend during magic link signup)
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';

  -- Skip if no referral code provided
  IF v_referral_code IS NULL OR v_referral_code = '' THEN
    RETURN NEW;
  END IF;

  -- Look up who owns this referral code
  SELECT user_id INTO v_referrer_user_id
  FROM public.referral_codes
  WHERE code = v_referral_code
    AND is_active = true;

  -- Skip if code doesn't exist or belongs to nobody
  IF v_referrer_user_id IS NULL THEN
    RAISE WARNING '[Referral] Code % not found or inactive, skipping event', v_referral_code;
    RETURN NEW;
  END IF;

  -- Skip if the user is referring themselves (safety check)
  IF v_referrer_user_id = NEW.id THEN
    RAISE WARNING '[Referral] User % tried to self-refer, skipping', NEW.id;
    RETURN NEW;
  END IF;

  -- Insert registration event (partial unique index prevents duplicates)
  INSERT INTO public.referral_events (
    referrer_user_id,
    referred_user_id,
    event_type,
    amount_czk
  )
  VALUES (
    v_referrer_user_id,
    NEW.id,
    'registration',
    0  -- Registration has no monetary value; purchases tracked separately
  )
  ON CONFLICT DO NOTHING;  -- Idempotent: safe to call multiple times

  RAISE NOTICE '[Referral] Registration event recorded: referrer=%, referred=%, code=%',
    v_referrer_user_id, NEW.id, v_referral_code;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation due to referral errors
  RAISE WARNING '[Referral] Error recording registration event: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_referral_event() IS
  'Auto-records referral registration event when a new user is created via magic link with referral_code in metadata.';

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_referral_event ON auth.users;
CREATE TRIGGER on_auth_user_created_referral_event
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_referral_event();

-- ============================================================
-- 2. RPC function for OAuth registrations
--    Called by frontend AFTER OAuth completes (new user detected)
--    SECURITY DEFINER: bypasses RLS, runs as postgres
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_referral_registration(
  p_referral_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_current_user_id UUID;
  v_referrer_user_id UUID;
  v_already_recorded BOOLEAN;
BEGIN
  -- Get the currently authenticated user
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate code format (6 digits)
  IF p_referral_code !~ '^\d{6}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid referral code format');
  END IF;

  -- Check if registration event already exists for this user (idempotent)
  SELECT EXISTS(
    SELECT 1 FROM public.referral_events
    WHERE referred_user_id = v_current_user_id
      AND event_type = 'registration'
  ) INTO v_already_recorded;

  IF v_already_recorded THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already recorded');
  END IF;

  -- Look up referrer
  SELECT user_id INTO v_referrer_user_id
  FROM public.referral_codes
  WHERE code = p_referral_code
    AND is_active = true;

  IF v_referrer_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral code not found');
  END IF;

  -- Prevent self-referral
  IF v_referrer_user_id = v_current_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Self-referral not allowed');
  END IF;

  -- Insert event
  INSERT INTO public.referral_events (
    referrer_user_id,
    referred_user_id,
    event_type,
    amount_czk
  )
  VALUES (
    v_referrer_user_id,
    v_current_user_id,
    'registration',
    0
  )
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'referrer_id', v_referrer_user_id::TEXT);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.record_referral_registration(TEXT) TO authenticated;

COMMENT ON FUNCTION public.record_referral_registration(TEXT) IS
  'Records a referral registration event for the current authenticated user. Used for OAuth registrations where metadata cannot be set before auth.';

-- ============================================================
-- 3. RLS INSERT policy for referral_events
--    Allow authenticated users to insert events where they are the referred user
--    (needed for the OAuth path where frontend writes directly via RPC)
-- ============================================================

DROP POLICY IF EXISTS "record_referral_registration_rpc" ON public.referral_events;
-- Note: INSERT via RPC uses SECURITY DEFINER — no row-level policy needed for that path.
-- The SELECT policy already exists from the previous migration.

-- ============================================================
-- Done
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20260226200002_referral_event_trigger complete';
  RAISE NOTICE '   - Trigger on_auth_user_created_referral_event: auto-records magic link registrations';
  RAISE NOTICE '   - Function record_referral_registration(): RPC for OAuth registrations';
END $$;
