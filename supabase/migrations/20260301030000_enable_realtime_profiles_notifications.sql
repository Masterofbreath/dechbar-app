-- Enable Supabase Realtime for profiles and user_notifications tables.
--
-- WHY:
-- useRealtimeUserState.ts (CHANNEL 4 + CHANNEL 5) listens to postgres_changes
-- on these tables to propagate profile edits and new notifications in real-time
-- across all connected clients (web, native app via Capacitor).
--
-- Without this migration, those WebSocket channels never fire because:
-- 1. Tables must be added to the supabase_realtime publication
-- 2. REPLICA IDENTITY FULL is required for UPDATE event filters to work
--    (filters like `user_id=eq.xxx` on UPDATE require full old/new row data)
--
-- EFFECT:
-- - Profile name/nickname changes in /muj-ucet propagate to the native app
--   within ~1 second via Supabase Realtime WebSocket
-- - New notifications appear instantly without page refresh

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Required so CHANNEL 4 filter (user_id=eq.xxx) works on UPDATE events
alter table public.profiles replica identity full;

-- Add to publication (idempotent via DO block)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ── User Notifications ─────────────────────────────────────────────────────────
-- Required so CHANNEL 5 filter (user_id=eq.xxx) works on INSERT/UPDATE/DELETE
alter table public.user_notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'user_notifications'
  ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;
