/**
 * Intensity Events API
 *
 * Fire-and-forget batch insert for session_intensity_events table.
 * Called after session save when session_id becomes available.
 *
 * Design: Never throws — errors are logged to console only.
 * Reasoning: Intensity logging is supplemental analytics data;
 * a failed insert must never block session save or UI flow.
 *
 * @package DechBar_App
 * @subpackage MVP0/API
 */

import { supabase } from '@/platform/api/supabase';

export interface IntensityEventInsert {
  session_id: string;
  user_id: string;
  occurred_at_ms: number;
  action: 'up' | 'down';
  multiplier_from: number;
  multiplier_to: number;
}

/**
 * Batch-insert intensity events after session is saved.
 *
 * @param events - Array of events collected during the session
 * @returns void — errors are caught and logged, never thrown
 */
export async function insertIntensityEventsBatch(
  events: IntensityEventInsert[]
): Promise<void> {
  if (events.length === 0) return;

  const { error } = await supabase
    .from('session_intensity_events')
    .insert(events);

  if (error) {
    console.error('[IntensityEvents] Failed to save batch:', error.message, { count: events.length });
  }
}
