/**
 * Analytics — Streak Utility
 *
 * updateStreak: fire-and-forget function that upserts user_activity_streaks
 * with grace day logic.
 *
 * Grace day rule:
 *   - Activity today → streak continues (or starts)
 *   - 1 day gap + grace_day_used=false → grace day consumed, streak preserved
 *   - 1 day gap + grace_day_used=true  → streak resets
 *   - 2+ day gap                        → streak resets
 *
 * Future gamification hook:
 *   Replace grace_day_used BOOLEAN with jokers_remaining INTEGER DEFAULT 3
 *   + jokers_reset_at DATE (monthly reset). No schema change needed here —
 *   the streak logic update will happen in the Gamification component.
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { supabase } from '@/platform/api/supabase';
import { toIsoDateString } from './time';

/**
 * Upsert the user's activity streak for a given date.
 * Called after any completed activity (audio 80%, exercise done).
 * Never throws — errors are logged to console only.
 */
export async function updateStreak(userId: string, date: Date = new Date()): Promise<void> {
  try {
    const todayStr = toIsoDateString(date);

    // Fetch existing streak record
    const { data: existing, error: fetchError } = await supabase
      .from('user_activity_streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn('[Analytics/streak] Failed to fetch streak:', fetchError.message);
      return;
    }

    if (!existing) {
      // First ever activity — start fresh streak
      await supabase.from('user_activity_streaks').upsert({
        user_id: userId,
        current_streak_days: 1,
        longest_streak_days: 1,
        last_active_date: todayStr,
        grace_day_used: false,
        streak_started_at: todayStr,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      return;
    }

    const lastDate = existing.last_active_date ? new Date(existing.last_active_date) : null;
    const todayDate = new Date(todayStr);

    // Same day — no-op (already counted)
    if (lastDate && toIsoDateString(lastDate) === todayStr) {
      return;
    }

    let newStreak = existing.current_streak_days;
    let newGraceDayUsed = existing.grace_day_used;
    let newStreakStartedAt = existing.streak_started_at;

    if (lastDate) {
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day — extend streak
        newStreak += 1;
        newGraceDayUsed = false;
      } else if (diffDays === 2 && !existing.grace_day_used) {
        // 1 day gap → consume grace day, keep streak
        newStreak += 1;
        newGraceDayUsed = true;
      } else {
        // Gap too large or grace already used → reset
        newStreak = 1;
        newGraceDayUsed = false;
        newStreakStartedAt = todayStr;
      }
    } else {
      // No previous date recorded
      newStreak = 1;
      newStreakStartedAt = todayStr;
    }

    const newLongest = Math.max(newStreak, existing.longest_streak_days);

    const { error: upsertError } = await supabase
      .from('user_activity_streaks')
      .upsert({
        user_id: userId,
        current_streak_days: newStreak,
        longest_streak_days: newLongest,
        last_active_date: todayStr,
        grace_day_used: newGraceDayUsed,
        streak_started_at: newStreakStartedAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.warn('[Analytics/streak] Failed to upsert streak:', upsertError.message);
    }
  } catch (err) {
    console.warn('[Analytics/streak] Unexpected error:', err);
  }
}
