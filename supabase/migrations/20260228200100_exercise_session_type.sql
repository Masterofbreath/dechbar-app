-- ============================================================
-- Extend exercise_sessions with session_type column
--
-- session_type values:
--   'preset'          — built-in preset exercise (default, backfill)
--   'custom'          — user-created custom exercise
--   'smart'           — SMART CVIČENÍ (AI-recommended; future component)
--   'daily_challenge' — daily challenge (Výzvy)
--
-- NOTE for SMART CVIČENÍ agent:
--   When implementing SMART CVIČENÍ, set session_type = 'smart'
--   on insert into exercise_sessions. No schema changes needed.
--   Tracking hook: call updateStreakOnActivity() after session complete.
-- ============================================================

ALTER TABLE exercise_sessions
  ADD COLUMN IF NOT EXISTS session_type TEXT
    DEFAULT 'preset'
    CHECK (session_type IN ('preset', 'custom', 'smart', 'daily_challenge'));

-- Backfill all existing rows to 'preset' (already covered by DEFAULT but explicit)
UPDATE exercise_sessions
  SET session_type = 'preset'
  WHERE session_type IS NULL;
