-- ============================================================
-- get_profiles_in_range — returns user_id + created_at for
-- all profiles registered in a given date range.
--
-- Used by useOnboardingFunnel to fetch new users without
-- hitting RLS limitations (only own profile visible otherwise).
-- SECURITY DEFINER bypasses RLS entirely.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_profiles_in_range(
  from_ts TIMESTAMPTZ,
  to_ts   TIMESTAMPTZ
)
RETURNS TABLE(user_id UUID, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, created_at
  FROM public.profiles
  WHERE created_at >= from_ts
    AND created_at <= to_ts
  ORDER BY created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_profiles_in_range(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

COMMENT ON FUNCTION public.get_profiles_in_range IS
  'Returns profiles registered in date range. SECURITY DEFINER bypasses RLS for admin use.';

DO $$
BEGIN
  RAISE NOTICE '✅ get_profiles_in_range() created';
END $$;
