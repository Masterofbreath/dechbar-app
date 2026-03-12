/**
 * useSmartExercise — React hook for SMART CVIČENÍ
 *
 * Orchestrates BIE computation with caching, data fetching, and error handling.
 * Cache TTL: 24h (stored in smart_exercise_recommendations).
 * On cache miss: calls computeSmartSession(), stores result, returns config.
 * On any error: falls back to cold start (level 3, 7 min).
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { useSafetyFlags } from '../api/exercises';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { getBreathLevel } from '../config/breathLevels';
import {
  computeSmartSession,
  buildSmartExercise,
  type BIEInput,
  type SmartSessionHistory,
} from '../engine/BreathIntelligenceEngine';
import type { SmartSessionConfig } from '../types/exercises';
import type { Exercise } from '../types/exercises';

// =====================================================
// TYPES
// =====================================================

export interface SmartRecommendationRow {
  user_id: string;
  recommended_inhale_s: number | null;
  recommended_hold_after_inhale_s: number | null;
  recommended_exhale_s: number | null;
  recommended_hold_after_exhale_s: number | null;
  confidence_score: number | null;
  data_points_count: number | null;
  is_ready: boolean | null;
  context_snapshot: Record<string, unknown> | null;
  recalculate_after: string | null;
  last_calculated_at: string | null;
  last_level_change_at: string | null;
  current_level: number;
  session_count_smart: number;
  preferred_duration_seconds: number;
  time_context: string;
  phase_profile: string;
  /** Set by useResetSmartProgress — sessions before this timestamp are ignored for BIE */
  reset_at: string | null;
}

export interface UseSmartExerciseReturn {
  /** Compute and return SmartSessionConfig + ephemeral Exercise. Caches result. */
  computeAndBuild: () => Promise<{ config: SmartSessionConfig; exercise: Exercise }>;
  isLoading: boolean;
  error: Error | null;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const smartKeys = {
  recommendation: (userId: string) => ['smart-recommendation', userId] as const,
  // reset_at included in key — ensures history re-fetches when user resets SMART progress
  history: (userId: string, resetAt?: string | null) => ['smart-history', userId, resetAt ?? 'none'] as const,
};

// =====================================================
// HOOK
// =====================================================

export function useSmartExercise(): UseSmartExerciseReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { currentKP } = useKPMeasurements();
  const { data: safetyFlags } = useSafetyFlags();
  const { smartDurationMode } = useSessionSettings();

  // Fetch SMART recommendation cache row
  const {
    data: cachedRec,
    isLoading: recLoading,
    error: recError,
  } = useQuery({
    queryKey: smartKeys.recommendation(user?.id ?? ''),
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('smart_exercise_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data as SmartRecommendationRow | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // re-fetch every 5 min to detect TTL expiry
  });

  // Fetch SMART session history (last 7, most recent first) + real session count
  // session_count_smart in cache can be stale/zero — always use real count from exercise_sessions.
  // After a soft-reset, only sessions AFTER reset_at count — history before is a previous epoch.
  const {
    data: smartHistoryData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: smartKeys.history(user?.id ?? '', cachedRec?.reset_at),
    queryFn: async () => {
      if (!user) return { history: [] as SmartSessionHistory[], realCount: 0 };

      const resetAt = cachedRec?.reset_at ?? null;

      // Fetch last 7 for BIE Tier 4 + total count in one query (limit 7 but count all)
      let query = supabase
        .from('exercise_sessions')
        .select('final_intensity_multiplier, difficulty_rating, was_completed, started_at, smart_context', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('session_type', 'smart')
        .eq('was_completed', true)
        .order('started_at', { ascending: false })
        .limit(7);

      // After soft-reset: ignore sessions from previous epoch
      if (resetAt) {
        query = query.gte('started_at', resetAt);
      }

      const { data, count } = await query;

      return {
        history: (data ?? []) as SmartSessionHistory[],
        realCount: count ?? 0,
      };
    },
    // Re-run when cachedRec changes (e.g. after reset) so reset_at is picked up
    enabled: !!user && !recLoading,
  });

  const smartHistory = smartHistoryData?.history ?? [];
  // Real session count — source of truth for BIE calibration phase and SmartPrepState dots
  const realSessionCount = smartHistoryData?.realCount ?? 0;

  // Fetch current streak — needed for Tier 5 Progression Gate (daily users get 2-day gate, others 7)
  const { data: currentStreak } = useQuery({
    queryKey: ['smart-streak', user?.id ?? ''],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase
        .from('user_activity_streaks')
        .select('current_streak_days')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.current_streak_days ?? 0;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = recLoading || historyLoading;
  const error = recError ?? historyError ?? null;

  // =====================================================
  // COMPUTE AND BUILD
  // =====================================================

  const computeAndBuild = useCallback(async (): Promise<{
    config: SmartSessionConfig;
    exercise: Exercise;
  }> => {
    if (!user) {
      throw new Error('Authentication required');
    }

    // Use real session count from exercise_sessions — cache counter can be stale/zero.
    // This ensures BIE always knows the actual calibration progress.
    const sessionCount = realSessionCount;
    const prevLevel = cachedRec?.current_level ?? 3;

    // Check cache validity:
    // - recalculate_after > now (TTL not expired)
    // - real session count > 0 (not a fresh start)
    const now = new Date().toISOString();
    const cacheHit =
      cachedRec !== null &&
      cachedRec !== undefined &&
      cachedRec.recalculate_after !== null &&
      cachedRec.recalculate_after > now &&
      sessionCount > 0;

    let config: SmartSessionConfig;

    if (cacheHit && cachedRec) {
      // Cache valid — recompute only time-sensitive parts (time context changes during the day)
      const input: BIEInput = {
        safetyFlags: safetyFlags ?? null,
        latestKP: currentKP ?? null,
        smartHistory: smartHistory ?? [],
        sessionCountSmart: sessionCount,
        currentLevel: cachedRec.current_level ?? 3,
        lastLevelChangeAt: cachedRec.last_level_change_at ?? null,
        streak: currentStreak ?? 0,
        smartDurationMode,
      };
      const freshConfig = computeSmartSession(input);
      // Level stays from cache — only pattern + context refreshed
      config = {
        ...freshConfig,
        level: cachedRec.current_level ?? freshConfig.level,
        sessionCountSmart: sessionCount,
        cacheValid: true,
      };
    } else {
      // Cache expired or first run — full BIE computation with real session count
      const input: BIEInput = {
        safetyFlags: safetyFlags ?? null,
        latestKP: currentKP ?? null,
        smartHistory: smartHistory ?? [],
        sessionCountSmart: sessionCount,
        currentLevel: prevLevel,
        lastLevelChangeAt: cachedRec?.last_level_change_at ?? null,
        streak: currentStreak ?? 0,
        smartDurationMode,
      };

      config = computeSmartSession(input);

      // Persist to cache — current_level is NOT updated here (only after completed session)
      try {
        const baseLevelData = getBreathLevel(prevLevel);

        const { error: upsertError } = await supabase.from('smart_exercise_recommendations').upsert({
          user_id: user.id,
          recommended_inhale_s: baseLevelData.inhale,
          recommended_hold_after_inhale_s: 0,
          recommended_exhale_s: baseLevelData.exhale,
          recommended_hold_after_exhale_s: baseLevelData.holdExhale,
          confidence_score: config.confidenceScore,
          data_points_count: sessionCount,
          is_ready: config.confidenceScore >= 0.7,
          recalculate_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_calculated_at: now,
          current_level: prevLevel,
          session_count_smart: sessionCount,
          preferred_duration_seconds: config.totalDurationSeconds,
          time_context: config.timeContext,
          phase_profile: config.phaseProfile,
        }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        await queryClient.invalidateQueries({
          queryKey: smartKeys.recommendation(user.id),
        });
      } catch {
        // Cache write failure is non-critical — session can still proceed
      }
    }

    const exercise = buildSmartExercise(config);
    return { config, exercise };
  }, [user, cachedRec, realSessionCount, safetyFlags, currentKP, smartHistory, currentStreak, smartDurationMode, queryClient]);

  return {
    computeAndBuild,
    isLoading,
    error: error as Error | null,
    realSessionCount,
  };
}

// =====================================================
// HELPERS
// =====================================================

