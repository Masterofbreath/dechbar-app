/**
 * useTronSession — Hook for Cesta na Trůn
 *
 * Reads the user's tron_recommendations row and builds a TronSessionConfig.
 * Also provides buildTronExercise() — creates an ephemeral Exercise object
 * compatible with SessionEngineModal (same structure as buildSmartExercise).
 *
 * Trůn pattern is always: inhale=3s | holdInhale=0 | exhale=3s | holdExhale=Xs
 * where X = config.holdExhaleSeconds (derived from level).
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useCallback } from 'react';
import { useAuth } from '@/platform/auth';
import { useTronRecommendation } from '../api/tron';
import { getTronLevel } from '../config/tronLevels';
import type { Exercise, TronSessionConfig } from '../types/exercises';
import type { BreathingPattern, ExercisePhase } from '../types/exercises';

// =====================================================
// CONSTANTS
// =====================================================

const DEFAULT_DURATION_SECONDS = 420; // 7 min default
const TRON_MIN_DURATION = 300;        // 5 min
const TRON_MAX_DURATION = 900;        // 15 min

// =====================================================
// HELPERS
// =====================================================

/**
 * Build a single breathing ExercisePhase for Trůn.
 * Trůn pattern: inhale=3 | holdInhale=0 | exhale=3 | holdExhale=X
 */
function makeTronPhase(
  order: number,
  name: string,
  description: string,
  durationSeconds: number,
  holdExhaleSeconds: number,
): ExercisePhase {
  const inhale = 3;
  const holdInhale = 0;
  const exhale = 3;
  const cycleDuration = inhale + holdInhale + exhale + holdExhaleSeconds;
  const cycles = cycleDuration > 0 ? Math.round(durationSeconds / cycleDuration) : 1;

  return {
    order,
    type: 'breathing',
    name,
    description,
    pattern: {
      inhale_seconds: inhale,
      hold_after_inhale_seconds: holdInhale,
      exhale_seconds: exhale,
      hold_after_exhale_seconds: holdExhaleSeconds,
    },
    duration_seconds: durationSeconds,
    cycles_count: cycles,
  };
}

// =====================================================
// buildTronExercise (exported for direct use in TronButton)
// =====================================================

/**
 * Build an ephemeral Exercise object for a Trůn session.
 * Compatible with SessionEngineModal — same BreathingPattern structure.
 * Single breathing phase (no multi-phase progression — Trůn is about walking rhythm).
 */
export function buildTronExercise(config: TronSessionConfig): Exercise {
  const totalSec = Math.max(
    TRON_MIN_DURATION,
    Math.min(TRON_MAX_DURATION, config.totalDurationSeconds),
  );

  const phase = makeTronPhase(
    1,
    'Cesta na trůn',
    'Dýchej v rytmu kroků. Zádrž po výdechu hromadí CO₂.',
    totalSec,
    config.holdExhaleSeconds,
  );

  const breathingPattern: BreathingPattern = {
    version: '1.0',
    type: 'simple',
    phases: [phase],
    metadata: {
      total_duration_seconds: totalSec,
      phase_count: 1,
      difficulty: config.level <= 5 ? 'beginner' : config.level <= 12 ? 'intermediate' : 'advanced',
      tags: ['tron', 'walking', 'auto-generated'],
    },
  };

  const now = new Date().toISOString();

  return {
    id: `tron-ephemeral-${Date.now()}`,
    name: 'CESTA NA TRŮN',
    description: null,
    category: 'custom',
    subcategory: null,
    created_by: null,
    is_public: false,
    required_tier: 'SMART',
    breathing_pattern: breathingPattern,
    total_duration_seconds: totalSec,
    phase_count: 1,
    difficulty: breathingPattern.metadata.difficulty,
    tags: ['tron'],
    contraindications: [],
    card_color: null,
    is_meditation_mode: false,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };
}

// =====================================================
// HOOK
// =====================================================

export interface UseTronSessionReturn {
  /** Current Trůn session config (derived from tron_recommendations) */
  config: TronSessionConfig;
  /** Build ephemeral Exercise from config — call before opening SessionEngineModal */
  buildExercise: (config: TronSessionConfig) => Exercise;
  isLoading: boolean;
}

export function useTronSession(): UseTronSessionReturn {
  const { user } = useAuth();
  const { data: recommendation, isLoading } = useTronRecommendation();

  const config: TronSessionConfig = (() => {
    if (!recommendation) {
      // Cold start — Level 1, 7 min
      return {
        level: 1,
        holdExhaleSeconds: getTronLevel(1).holdExhale,
        totalDurationSeconds: DEFAULT_DURATION_SECONDS,
        sessionCount: 0,
        isCalibrating: true,
      };
    }

    const level = recommendation.current_level ?? 1;
    const tronLevel = getTronLevel(level);

    return {
      level,
      holdExhaleSeconds: tronLevel.holdExhale,
      totalDurationSeconds: DEFAULT_DURATION_SECONDS,
      sessionCount: recommendation.session_count ?? 0,
      isCalibrating: (recommendation.session_count ?? 0) < 10,
    };
  })();

  const buildExercise = useCallback(
    (cfg: TronSessionConfig): Exercise => buildTronExercise(cfg),
    [],
  );

  return {
    config,
    buildExercise,
    isLoading: !user ? false : isLoading,
  };
}
