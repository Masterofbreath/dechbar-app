-- ============================================================
-- FÁZE 2: PROD sync — Apply ONLY to PROD (iqyahebbteiwzwyrtmns)
-- Date: 2026-03-02
-- Reason: PROD was missing difficulty_rating column in exercise_sessions
--   and the platform_daily_override updated_at trigger.
--   Both are additive (nullable/non-breaking) — zero risk to existing data.
-- ============================================================

-- 1. Add difficulty_rating to exercise_sessions
--    DEV has this column, PROD doesn't. Nullable → no data loss.
ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER DEFAULT NULL
  CHECK (difficulty_rating IS NULL OR difficulty_rating BETWEEN 1 AND 3);

COMMENT ON COLUMN public.exercise_sessions.difficulty_rating IS
  'Raw user difficulty rating (1=Snadné, 2=Akorát, 3=Náročné). Mapped to quality_rating (1-5) for analytics.';

-- 2. Add platform_daily_override updated_at trigger (exists on DEV, missing on PROD)
DROP TRIGGER IF EXISTS set_updated_at_platform_daily_override ON public.platform_daily_override;

CREATE TRIGGER set_updated_at_platform_daily_override
  BEFORE UPDATE ON public.platform_daily_override
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Verify
DO $$
DECLARE
  col_exists boolean;
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='exercise_sessions' AND column_name='difficulty_rating'
  ) INTO col_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema='public' AND trigger_name='set_updated_at_platform_daily_override'
  ) INTO trigger_exists;

  RAISE NOTICE '✅ PROD Phase 2 sync complete:';
  RAISE NOTICE '  - difficulty_rating column: %', CASE WHEN col_exists THEN 'OK' ELSE 'MISSING!' END;
  RAISE NOTICE '  - platform_daily_override trigger: %', CASE WHEN trigger_exists THEN 'OK' ELSE 'MISSING!' END;
END;
$$;
