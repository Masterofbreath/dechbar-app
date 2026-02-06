/**
 * useDurationCalculator - Duration Calculation Utilities
 * 
 * Calculates cycle duration, total duration, and formats time display.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/ExerciseCreator/Hooks
 * @since 1.0.0
 */

import { useCallback } from 'react';
import type { DraftExercise } from '../types';

/**
 * Hook for breathing exercise duration calculations
 */
export function useDurationCalculator() {
  /**
   * Calculate single cycle duration (sum of 4 phases)
   */
  const calculateCycleDuration = useCallback((pattern: DraftExercise['breathingPattern']): number => {
    const {
      inhale_seconds,
      hold_after_inhale_seconds,
      exhale_seconds,
      hold_after_exhale_seconds,
    } = pattern;
    
    return inhale_seconds + hold_after_inhale_seconds + exhale_seconds + hold_after_exhale_seconds;
  }, []);
  
  /**
   * Calculate total exercise duration (cycle × repetitions)
   */
  const calculateTotalDuration = useCallback(
    (pattern: DraftExercise['breathingPattern'], repetitions: number): number => {
      return calculateCycleDuration(pattern) * repetitions;
    },
    [calculateCycleDuration]
  );
  
  /**
   * Format seconds as MM:SS display
   */
  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);
  
  return {
    calculateCycleDuration,
    calculateTotalDuration,
    formatDuration,
  };
}
