/**
 * Analytics Client — Fire-and-Forget Supabase Helpers
 *
 * Design principles (from intensityEvents.ts pattern):
 *   - Each function never throws
 *   - Errors are console.warn'd only
 *   - UI is NEVER blocked by analytics writes
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { supabase } from '@/platform/api/supabase';
import { updateStreak } from './utils/streak';
import type { ActivityLogInsert, AudioSessionInsert, AudioEventInsert, Platform } from './types';

/**
 * Log an app_open event to user_activity_log (DAU Level 1).
 * Deduplicated by the calling hook — called once per AppLayout mount.
 */
export async function logAppOpen(userId: string, platform: Platform): Promise<void> {
  const event: ActivityLogInsert = {
    user_id: userId,
    event_type: 'app_open',
    platform,
  };

  const { error } = await supabase.from('user_activity_log').insert(event);

  if (error) {
    console.warn('[Analytics] logAppOpen failed:', error.message);
  }
}

/**
 * Upsert an audio session record (insert or update).
 * Called periodically (every 15s) and on session end.
 */
export async function upsertAudioSession(session: AudioSessionInsert): Promise<void> {
  const { error } = await supabase
    .from('audio_sessions')
    .upsert(session, { onConflict: 'session_id' });

  if (error) {
    console.warn('[Analytics] upsertAudioSession failed:', error.message);
  }
}

/**
 * Insert a single audio event (play_started, paused, resumed, seeked, etc.)
 * Events are immutable — never updated, only inserted.
 */
export async function logAudioEvent(event: AudioEventInsert): Promise<void> {
  const { error } = await supabase.from('audio_events').insert(event);

  if (error) {
    console.warn('[Analytics] logAudioEvent failed:', error.message);
  }
}

/**
 * Trigger streak update after a completed activity.
 * Wraps updateStreak — fire-and-forget.
 */
export function updateStreakOnActivity(userId: string): void {
  // Intentionally not awaited — fire-and-forget
  updateStreak(userId, new Date()).catch((err) => {
    console.warn('[Analytics] updateStreakOnActivity failed:', err);
  });
}
