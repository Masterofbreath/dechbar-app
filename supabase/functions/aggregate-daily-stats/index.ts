/**
 * aggregate-daily-stats — Nightly Cron Job
 *
 * Schedule: 0 2 * * * (2:00 UTC)
 * Aggregates previous day's activity into platform_daily_stats.
 *
 * Komputes for "yesterday" (UTC):
 *   - dau_l1:               DISTINCT users in user_activity_log
 *   - dau_l2:               DISTINCT users who started any session
 *   - dau_l3:               DISTINCT users who completed any session
 *   - new_registrations:    new auth.users
 *   - total_minutes_breathed: sum of exercise + audio minutes
 *   - exercise / audio session counts
 *
 * Uses service_role key — bypasses RLS.
 * Upserts on stat_date (idempotent).
 *
 * @package DechBar_App
 * @subpackage Supabase/Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

function toYesterdayRange(): { start: string; end: string; dateStr: string } {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  const dateStr = yesterday.toISOString().slice(0, 10);
  const start = `${dateStr}T00:00:00.000Z`;
  const end = `${dateStr}T23:59:59.999Z`;
  return { start, end, dateStr };
}

Deno.serve(async () => {
  try {
    const { start, end, dateStr } = toYesterdayRange();

    // ── DAU L1: users who opened the app ──
    const { data: dauL1Data, error: dauL1Error } = await supabase
      .from('user_activity_log')
      .select('user_id')
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('event_type', 'app_open');

    if (dauL1Error) throw dauL1Error;

    const dauL1 = new Set((dauL1Data ?? []).map((r) => r.user_id)).size;

    // ── DAU L2: users who started any session ──
    const [audioStarted, exerciseStarted] = await Promise.all([
      supabase
        .from('audio_sessions')
        .select('user_id')
        .gte('started_at', start)
        .lte('started_at', end),
      supabase
        .from('exercise_sessions')
        .select('user_id')
        .gte('started_at', start)
        .lte('started_at', end),
    ]);

    if (audioStarted.error) throw audioStarted.error;
    if (exerciseStarted.error) throw exerciseStarted.error;

    const dauL2Set = new Set([
      ...(audioStarted.data ?? []).map((r) => r.user_id),
      ...(exerciseStarted.data ?? []).map((r) => r.user_id),
    ]);
    const dauL2 = dauL2Set.size;

    // ── Audio session stats ──
    const { data: audioSessions, error: audioError } = await supabase
      .from('audio_sessions')
      .select('user_id, unique_listen_seconds, is_completed')
      .gte('started_at', start)
      .lte('started_at', end);

    if (audioError) throw audioError;

    const totalAudioSessions = (audioSessions ?? []).length;
    const completedAudioSessions = (audioSessions ?? []).filter((r) => r.is_completed).length;
    const audioMinutes = (audioSessions ?? []).reduce(
      (sum, r) => sum + (r.unique_listen_seconds ?? 0) / 60,
      0
    );

    // ── Exercise session stats ──
    // Note: exercise_sessions has no actual_duration_seconds — derive from started_at + completed_at
    const { data: exerciseSessions, error: exerciseError } = await supabase
      .from('exercise_sessions')
      .select('user_id, started_at, completed_at, was_completed')
      .gte('started_at', start)
      .lte('started_at', end);

    if (exerciseError) throw exerciseError;

    const totalExerciseSessions = (exerciseSessions ?? []).length;
    const completedExerciseSessions = (exerciseSessions ?? []).filter((r) => r.was_completed).length;
    const exerciseMinutes = (exerciseSessions ?? []).reduce((sum, r) => {
      const durationSec = r.completed_at && r.started_at
        ? (new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()) / 1000
        : 0;
      return sum + Math.max(0, durationSec) / 60;
    }, 0);

    // ── DAU L3: users who completed any session ──
    const dauL3Set = new Set([
      ...(audioSessions ?? []).filter((r) => r.is_completed).map((r) => r.user_id),
      ...(exerciseSessions ?? []).filter((r) => r.was_completed).map((r) => r.user_id),
    ]);
    const dauL3 = dauL3Set.size;

    // ── New registrations ──
    // Uses auth.users via service role
    const { data: newUsersData, error: newUsersError } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', start)
      .lte('created_at', end);

    if (newUsersError) throw newUsersError;

    const newRegistrations = (newUsersData ?? []).length;
    const totalMinutesBeathed = audioMinutes + exerciseMinutes;

    // ── Upsert into platform_daily_stats ──
    const { error: upsertError } = await supabase
      .from('platform_daily_stats')
      .upsert(
        {
          stat_date: dateStr,
          dau_l1: dauL1,
          dau_l2: dauL2,
          dau_l3: dauL3,
          new_registrations: newRegistrations,
          total_exercise_sessions: totalExerciseSessions,
          completed_exercise_sessions: completedExerciseSessions,
          total_audio_sessions: totalAudioSessions,
          completed_audio_sessions: completedAudioSessions,
          total_minutes_breathed: Math.round(totalMinutesBeathed * 100) / 100,
          exercise_minutes: Math.round(exerciseMinutes * 100) / 100,
          audio_minutes: Math.round(audioMinutes * 100) / 100,
        },
        { onConflict: 'stat_date' }
      );

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        success: true,
        date: dateStr,
        stats: {
          dau_l1: dauL1,
          dau_l2: dauL2,
          dau_l3: dauL3,
          new_registrations: newRegistrations,
          total_minutes_breathed: Math.round(totalMinutesBeathed * 100) / 100,
          total_audio_sessions: totalAudioSessions,
          total_exercise_sessions: totalExerciseSessions,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[aggregate-daily-stats] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
