-- ============================================================
-- platform_daily_override — extensions
-- ============================================================
-- Adds:
--   play_count    integer  — incremented each time a user plays the override
--   force_priority boolean — if true, this override takes precedence even over
--                           the user's own pinned program (absolute priority)
--
-- Also creates an RPC function for atomic play_count increment that can be
-- called by authenticated users without needing a write RLS policy.

ALTER TABLE public.platform_daily_override
  ADD COLUMN IF NOT EXISTS play_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS force_priority boolean NOT NULL DEFAULT false;

-- ============================================================
-- RPC: increment play count (SECURITY DEFINER bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_override_play_count(override_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.platform_daily_override
  SET play_count = play_count + 1
  WHERE id = override_id;
END;
$$;

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION public.increment_override_play_count(uuid) TO authenticated;
