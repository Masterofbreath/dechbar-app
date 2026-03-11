-- Migration: record_lesson_completion function
-- Reason: Prevent repeated lesson playback from overwriting completed_at,
--         which would block future day unlocking (unlock depends on first completion date).
--
-- Behaviour:
--   - First completion: INSERT with current timestamp
--   - Repeated completion: UPDATE only play_duration_seconds, keep original completed_at
--
-- Called from: useAkademieProgress.ts (replaces raw upsert)

CREATE OR REPLACE FUNCTION public.record_lesson_completion(
  p_user_id     UUID,
  p_lesson_id   UUID,
  p_series_id   UUID,
  p_duration    INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_lesson_progress (user_id, lesson_id, completed_at, play_duration_seconds)
  VALUES (p_user_id, p_lesson_id, NOW(), p_duration)
  ON CONFLICT (user_id, lesson_id)
  DO UPDATE SET
    play_duration_seconds = EXCLUDED.play_duration_seconds;
    -- completed_at is intentionally NOT updated — first completion date is preserved
    -- This ensures repeated playback cannot block future day unlocking
END;
$$;

-- Grant execute to authenticated users (RLS on the table still applies)
GRANT EXECUTE ON FUNCTION public.record_lesson_completion(UUID, UUID, UUID, INT)
  TO authenticated;

COMMENT ON FUNCTION public.record_lesson_completion IS
  'Records lesson completion. On first call: inserts with current timestamp. '
  'On repeat: updates only play_duration_seconds, preserving the original completed_at '
  'so repeated playback cannot accidentally block day unlocking logic.';
