-- Migration: Add INSERT RLS policy for profiles table
-- Date: 2026-02-27
-- Reason: useProfile hook uses upsert() which requires INSERT permission even
-- when the row already exists (PostgREST internals). Without this policy,
-- saving profile changes returns HTTP 403 Forbidden.

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
