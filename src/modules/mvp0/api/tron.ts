/**
 * Tron API — Cesta na Trůn
 *
 * React Query hooks for tron_recommendations table.
 * Analogous to smart_exercise_recommendations hooks in exercises.ts.
 *
 * @package DechBar_App
 * @subpackage MVP0/API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';

// =====================================================
// TYPES
// =====================================================

export interface TronRecommendation {
  id: string;
  user_id: string;
  current_level: number;
  session_count: number;
  last_level_change_at: string | null;
  reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompleteTronSessionPayload {
  /** Level used during this session */
  level: number;
  /** Final intensity multiplier applied to holdExhale */
  final_multiplier: number;
  /** Session duration in seconds */
  duration_seconds: number;
  /** New recommended level (post-session algorithm result) */
  new_level?: number;
  /** ISO timestamp of session start */
  started_at: Date;
  /** ISO timestamp of session end */
  completed_at: Date;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const tronKeys = {
  all: ['tron'] as const,
  recommendation: (userId: string) => [...tronKeys.all, 'recommendation', userId] as const,
};

// =====================================================
// HOOKS
// =====================================================

/**
 * Fetch current user's Trůn recommendation (level + session count).
 * Returns null if user has never started a Trůn session.
 */
export function useTronRecommendation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: tronKeys.recommendation(user?.id ?? ''),
    queryFn: async (): Promise<TronRecommendation | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('tron_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Save completed Trůn session — updates tron_recommendations and inserts
 * into exercise_sessions (session_type = 'tron').
 *
 * Algorithm (first 10 sessions = calibration phase):
 * - If multiplier > 1.0 for last 2 sessions: level up (max 21)
 * - If multiplier < 1.0 for last 2 sessions: level down (min 1)
 * - Otherwise: keep current level
 */
export function useCompleteTronSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CompleteTronSessionPayload) => {
      if (!user?.id) throw new Error('User not authenticated');

      const {
        level,
        final_multiplier,
        duration_seconds,
        new_level,
        started_at,
        completed_at,
      } = payload;

      // 1. Get current recommendation
      const { data: existing } = await supabase
        .from('tron_recommendations')
        .select('session_count, current_level')
        .eq('user_id', user.id)
        .maybeSingle();

      const prevCount = existing?.session_count ?? 0;
      const prevLevel = existing?.current_level ?? 1;
      const nextCount = prevCount + 1;
      const nextLevel = new_level ?? prevLevel;
      const levelChanged = nextLevel !== prevLevel;
      const now = new Date().toISOString();

      // 2. Upsert tron_recommendations
      const { error: recError } = await supabase
        .from('tron_recommendations')
        .upsert(
          {
            user_id: user.id,
            session_count: nextCount,
            current_level: nextLevel,
            ...(levelChanged ? { last_level_change_at: now } : {}),
          },
          { onConflict: 'user_id' }
        );

      if (recError) throw recError;

      // 3. Insert into exercise_sessions
      const { error: sessionError } = await supabase
        .from('exercise_sessions')
        .insert({
          user_id: user.id,
          exercise_id: null,
          started_at: started_at.toISOString(),
          completed_at: completed_at.toISOString(),
          was_completed: true,
          session_type: 'tron',
          final_intensity_multiplier: final_multiplier,
          tron_context: {
            level,
            hold_exhale_base: level + 2,
            final_multiplier,
            duration_seconds,
            session_count_at_start: prevCount,
          },
        });

      if (sessionError) throw sessionError;

      return { nextLevel, nextCount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tronKeys.recommendation(user?.id ?? '') });
    },
  });
}

/**
 * Reset Trůn progress — soft reset: keeps exercise_sessions history,
 * resets tron_recommendations to level 1 / count 0.
 */
export function useResetTronProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('tron_recommendations')
        .upsert(
          {
            user_id: user.id,
            current_level: 1,
            session_count: 0,
            last_level_change_at: null,
            reset_at: now,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tronKeys.recommendation(user?.id ?? '') });
    },
  });
}
