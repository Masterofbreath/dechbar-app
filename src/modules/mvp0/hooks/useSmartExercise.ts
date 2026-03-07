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
  history: (userId: string) => ['smart-history', userId] as const,
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

  // Fetch SMART session history (last 7, most recent first)
  const {
    data: smartHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: smartKeys.history(user?.id ?? ''),
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('exercise_sessions')
        .select('final_intensity_multiplier, difficulty_rating, was_completed, started_at, smart_context')
        .eq('user_id', user.id)
        .eq('session_type', 'smart')
        .order('started_at', { ascending: false })
        .limit(7);
      return (data ?? []) as SmartSessionHistory[];
    },
    enabled: !!user,
  });

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

    // Check cache validity:
    // - recalculate_after > now (TTL not expired)
    // - session_count_smart > 0 (not a fresh reset — after soft-reset this is 0)
    // After a soft-reset, cachedRec exists but session_count_smart=0 and
    // recalculate_after=now (expired), so we always fall through to fresh compute → cold start.
    const now = new Date().toISOString();
    const cacheHit =
      cachedRec !== null &&
      cachedRec !== undefined &&
      cachedRec.recalculate_after !== null &&
      cachedRec.recalculate_after > now &&
      (cachedRec.session_count_smart ?? 0) > 0;

    let config: SmartSessionConfig;

    if (cacheHit && cachedRec) {
      // Level + session count from cache — but always recompute basePattern via BIE
      // because time context (night/day) changes dynamically throughout the day.
      const input: BIEInput = {
        safetyFlags: safetyFlags ?? null,
        latestKP: currentKP ?? null,
        smartHistory: smartHistory ?? [],
        sessionCountSmart: cachedRec.session_count_smart ?? 0,
        currentLevel: cachedRec.current_level ?? 3,
        lastLevelChangeAt: cachedRec.last_level_change_at ?? null,
        streak: currentStreak ?? 0,
        smartDurationMode,
      };
      const freshConfig = computeSmartSession(input);
      // Override level back to cached value — only pattern + context gets refreshed
      config = {
        ...freshConfig,
        level: cachedRec.current_level ?? freshConfig.level,
        cacheValid: true,
      };
    } else {
      // Compute fresh — either cache expired, first run, or after soft-reset (session_count=0)
      // After soft-reset: cachedRec.current_level=3 and session_count_smart=0 → BIE cold start
      const prevLevel = cachedRec?.current_level ?? 3;
      const prevSessionCount = cachedRec?.session_count_smart ?? 0;
      const input: BIEInput = {
        safetyFlags: safetyFlags ?? null,
        latestKP: currentKP ?? null,
        smartHistory: smartHistory ?? [],
        sessionCountSmart: prevSessionCount,
        currentLevel: prevLevel,
        lastLevelChangeAt: cachedRec?.last_level_change_at ?? null,
        streak: currentStreak ?? 0,
        smartDurationMode,
      };

      config = computeSmartSession(input);

      // Persist computed config to cache (upsert)
      // IMPORTANT: current_level is NOT updated here — level changes only after a completed session.
      // This prevents level from jumping just by opening the SMART exercise screen.
      // Level is applied in DB by updateSmartLevelAfterSession() called from SessionEngineModal.
      try {
        // Always persist base rhythm from BREATH_LEVELS for the *current* (unchanged) level.
        const baseLevelData = getBreathLevel(prevLevel);

        const { error: upsertError } = await supabase.from('smart_exercise_recommendations').upsert({
          user_id: user.id,
          recommended_inhale_s: baseLevelData.inhale,
          recommended_hold_after_inhale_s: 0,
          recommended_exhale_s: baseLevelData.exhale,
          recommended_hold_after_exhale_s: baseLevelData.holdExhale,
          confidence_score: config.confidenceScore,
          data_points_count: config.sessionCountSmart,
          is_ready: config.confidenceScore >= 0.7,
          recalculate_after: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          last_calculated_at: now,
          current_level: prevLevel,
          session_count_smart: config.sessionCountSmart,          preferred_duration_seconds: config.totalDurationSeconds,
          time_context: config.timeContext,
          phase_profile: config.phaseProfile,
        }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        // Invalidate cache queries to reflect new data
        await queryClient.invalidateQueries({
          queryKey: smartKeys.recommendation(user.id),
        });
      } catch {
        // Cache write failure is non-critical — session can still proceed
      }
    }

    const exercise = buildSmartExercise(config);
    return { config, exercise };
  }, [user, cachedRec, safetyFlags, currentKP, smartHistory, currentStreak, smartDurationMode, queryClient]);

  return {
    computeAndBuild,
    isLoading,
    error: error as Error | null,
  };
}

// =====================================================
// HELPERS
// =====================================================

