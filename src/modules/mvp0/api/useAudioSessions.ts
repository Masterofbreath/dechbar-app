/**
 * useAudioSessions Hook
 *
 * Fetches audio listening history for the current user.
 * Tier-based date cutoff (matches exercise_sessions logic):
 *   - ZDARMA:    7 days
 *   - SMART:    90 days
 *   - AI_COACH: unlimited
 *
 * @package DechBar_App
 * @subpackage MVP0/API
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';
import { useMembership } from '@/platform/membership';

export interface AudioSessionRow {
  session_id: string;
  lesson_title: string | null;
  started_at: string;
  unique_listen_seconds: number | null;
  completion_percent: number | null;
  is_completed: boolean | null;
}

export function useAudioSessions() {
  const { user } = useAuth();
  const { plan } = useMembership();

  return useQuery({
    queryKey: ['audio-sessions', user?.id, plan],
    queryFn: async (): Promise<AudioSessionRow[]> => {
      if (!user) throw new Error('Authentication required');

      let cutoffDate: Date | null = null;
      if (plan === 'ZDARMA') {
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
      } else if (plan === 'SMART') {
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
      }
      // AI_COACH = no cutoff (unlimited history)

      let query = supabase
        .from('audio_sessions')
        .select('session_id, lesson_title, started_at, unique_listen_seconds, completion_percent, is_completed')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (cutoffDate) {
        query = query.gte('started_at', cutoffDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AudioSessionRow[];
    },
    enabled: !!user,
  });
}
