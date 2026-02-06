/**
 * useBreathingValidation - Validation Logic Hook
 * 
 * Validates breathing pattern and total duration.
 * 
 * Rules:
 * - Pattern: At least 1 value > 0 (cannot be all zeros)
 * - Total duration: Max 45 minutes
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/ExerciseCreator/Hooks
 * @since 1.0.0
 */

import { useCallback, useMemo } from 'react';
import { EXERCISE_CREATOR_LIMITS, VALIDATION_MESSAGES } from '../constants';
import type { DraftExercise, ValidationErrors } from '../types';

/**
 * Hook for breathing pattern validation
 */
export function useBreathingValidation() {
  /**
   * Validate breathing pattern (min 1 value > 0)
   */
  const validatePattern = useCallback((pattern: DraftExercise['breathingPattern']): string | undefined => {
    const sum =
      pattern.inhale_seconds +
      pattern.hold_after_inhale_seconds +
      pattern.exhale_seconds +
      pattern.hold_after_exhale_seconds;
    
    if (sum === 0) {
      return VALIDATION_MESSAGES.PATTERN_ALL_ZERO;
    }
    
    return undefined;
  }, []);
  
  /**
   * Validate total exercise duration (max 45 min)
   */
  const validateTotalDuration = useCallback((totalSeconds: number): string | undefined => {
    const maxSeconds = EXERCISE_CREATOR_LIMITS.TOTAL_DURATION_MAX;
    
    if (totalSeconds > maxSeconds) {
      const minutes = Math.ceil(totalSeconds / 60);
      return VALIDATION_MESSAGES.DURATION_TOO_LONG(minutes);
    }
    
    return undefined;
  }, []);
  
  /**
   * Validate exercise name
   */
  const validateName = useCallback((name: string, isDuplicate: boolean): string | undefined => {
    if (name.length < EXERCISE_CREATOR_LIMITS.NAME_MIN_LENGTH) {
      return VALIDATION_MESSAGES.NAME_TOO_SHORT;
    }
    
    if (name.length > EXERCISE_CREATOR_LIMITS.NAME_MAX_LENGTH) {
      return VALIDATION_MESSAGES.NAME_TOO_LONG;
    }
    
    if (isDuplicate) {
      return VALIDATION_MESSAGES.NAME_DUPLICATE;
    }
    
    return undefined;
  }, []);
  
  /**
   * Validate complete draft exercise
   */
  const validateExercise = useCallback(
    (draft: DraftExercise, isNameDuplicate: boolean): ValidationErrors => {
      const errors: ValidationErrors = {};
      
      const nameError = validateName(draft.name, isNameDuplicate);
      if (nameError) errors.name = nameError;
      
      const patternError = validatePattern(draft.breathingPattern);
      if (patternError) errors.breathingPattern = patternError;
      
      const durationError = validateTotalDuration(draft.totalDurationSeconds);
      if (durationError) errors.totalDuration = durationError;
      
      const { REPETITIONS_MIN, REPETITIONS_MAX } = EXERCISE_CREATOR_LIMITS;
      if (draft.repetitions < REPETITIONS_MIN || draft.repetitions > REPETITIONS_MAX) {
        errors.repetitions = VALIDATION_MESSAGES.REPETITIONS_INVALID;
      }
      
      return errors;
    },
    [validateName, validatePattern, validateTotalDuration]
  );
  
  return {
    validatePattern,
    validateTotalDuration,
    validateName,
    validateExercise,
  };
}
