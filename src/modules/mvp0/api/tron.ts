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
  /** Whether the session was completed (not abandoned) */
  was_completed: boolean;
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
 * Update Trůn recommendation after a completed session.
 *
 * ARCHITECTURE NOTE: exercise_sessions INSERT is handled by useCompleteSession()
 * in exercises.ts (same as SMART). This hook only manages tron_recommendations —
 * it updates session_count and applies the level change algorithm.
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
      if (!payload.was_completed) return;

      const {
        level,
        final_multiplier,
        new_level,
      } = payload;

      // 1. Get current recommendation
      const { data: existing } = await supabase
        .from('tron_recommendations')
        .select('session_count, current_level')
        .eq('user_id', user.id)
        .maybeSingle();

      const prevCount = existing?.session_count ?? 0;
      const prevLevel = existing?.current_level ?? level;
      const nextCount = prevCount + 1;
      const nextLevel = new_level ?? prevLevel;
      const levelChanged = nextLevel !== prevLevel;
      const now = new Date().toISOString();

      // 2. Upsert tron_recommendations only
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

      return { nextLevel, nextCount, final_multiplier };
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
