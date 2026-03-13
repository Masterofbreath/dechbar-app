-- Add 'tron' to exercise_sessions session_type check constraint
-- Previously allowed: preset, custom, smart, daily_challenge
-- Now also allows: tron (Cesta na Trůn sessions)

ALTER TABLE public.exercise_sessions
  DROP CONSTRAINT exercise_sessions_session_type_check;

ALTER TABLE public.exercise_sessions
  ADD CONSTRAINT exercise_sessions_session_type_check
  CHECK (session_type = ANY (ARRAY[
    'preset'::text,
    'custom'::text,
    'smart'::text,
    'daily_challenge'::text,
    'tron'::text
  ]));
