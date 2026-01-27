-- =====================================================
-- Migration: Add challenge_registrations table
-- Date: 2026-01-26
-- Purpose: Email pre-registration for challenges (before Supabase account creation)
-- =====================================================

-- Create table for challenge pre-registrations
CREATE TABLE IF NOT EXISTS public.challenge_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  challenge_id TEXT NOT NULL DEFAULT 'march_2026',
  
  -- Pre-signup tracking
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conversion_source TEXT, -- 'landing_page', 'whatsapp', 'ppc'
  
  -- Magic Link tracking (sent 26.2.)
  magic_link_sent_at TIMESTAMPTZ,
  magic_link_expires_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- SMART access tracking
  smart_access_granted BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(email, challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenge_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own registrations"
  ON public.challenge_registrations FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
  );

CREATE POLICY "Anyone can register email"
  ON public.challenge_registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update registrations"
  ON public.challenge_registrations FOR UPDATE
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS challenge_registrations_email_idx 
  ON public.challenge_registrations(email);
  
CREATE INDEX IF NOT EXISTS challenge_registrations_user_idx 
  ON public.challenge_registrations(user_id);
  
CREATE INDEX IF NOT EXISTS challenge_registrations_challenge_idx 
  ON public.challenge_registrations(challenge_id);

CREATE INDEX IF NOT EXISTS challenge_registrations_source_idx
  ON public.challenge_registrations(conversion_source);

-- Comments
COMMENT ON TABLE public.challenge_registrations IS 'Email registrations for challenges (pre-signup before account creation)';
COMMENT ON COLUMN public.challenge_registrations.email IS 'User email (not verified until magic link clicked)';
COMMENT ON COLUMN public.challenge_registrations.challenge_id IS 'Challenge identifier (e.g., march_2026)';
COMMENT ON COLUMN public.challenge_registrations.conversion_source IS 'Source of registration: landing_page, whatsapp, ppc';
COMMENT ON COLUMN public.challenge_registrations.user_id IS 'NULL until magic link clicked and account created';
COMMENT ON COLUMN public.challenge_registrations.smart_access_granted IS 'Whether temporary SMART access was granted';

-- =====================================================
-- Add temporary SMART access columns to memberships
-- =====================================================

-- Add columns for challenge-based temporary SMART access
ALTER TABLE public.memberships 
ADD COLUMN IF NOT EXISTS challenge_smart_access BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS challenge_smart_expires_at TIMESTAMPTZ;

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS memberships_challenge_access_idx 
  ON public.memberships(challenge_smart_access, challenge_smart_expires_at)
  WHERE challenge_smart_access = true;

-- Comments
COMMENT ON COLUMN public.memberships.challenge_smart_access IS 'Temporary SMART access granted during challenges (e.g., march_2026)';
COMMENT ON COLUMN public.memberships.challenge_smart_expires_at IS 'Expiration date for temporary SMART access';
