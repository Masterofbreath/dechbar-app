/**
 * Exercise Creator - Configuration & Constants
 * @module ExerciseCreator/config
 * @description Central configuration for Exercise Creator behavior
 */

import type { ColorPreset } from './types';

/**
 * Exercise Creator Validation & Limits
 */
export const EXERCISE_CREATOR_LIMITS = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 60,
  DESCRIPTION_MAX_LENGTH: 200,
  BREATHING_VALUE_MIN: 0,
  BREATHING_VALUE_MAX: 30, // Reduced from 60s to 30s (more reasonable)
  BREATHING_VALUE_STEP: 0.5, // 0.5s increments for precision
  REPETITIONS_MIN: 1,
  REPETITIONS_MAX: 99, // Increased from 30 to 99 (with 45min validation)
  TOTAL_DURATION_MAX: 45 * 60, // 45 minutes in seconds
} as const;

/**
 * Tier-based limits (Free vs SMART)
 */
export const TIER_LIMITS = {
  FREE_MAX_CUSTOM_EXERCISES: 3,
} as const;

/**
 * Validation messages
 */
export const VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: `Minimálně ${EXERCISE_CREATOR_LIMITS.NAME_MIN_LENGTH} znaky`,
  NAME_TOO_LONG: `Maximálně ${EXERCISE_CREATOR_LIMITS.NAME_MAX_LENGTH} znaků`,
  NAME_DUPLICATE: 'Toto jméno již používáte',
  DESCRIPTION_TOO_LONG: `Maximálně ${EXERCISE_CREATOR_LIMITS.DESCRIPTION_MAX_LENGTH} znaků`,
  PATTERN_ALL_ZERO: 'Aspoň jedna fáze musí být nenulová',
  DURATION_TOO_LONG: (minutes: number) =>
    `Příliš dlouhé cvičení (${minutes} min). Maximum je ${EXERCISE_CREATOR_LIMITS.TOTAL_DURATION_MAX / 60} min.`,
} as const;

/**
 * 8 preset colors - mapped to 4 temperaments (2 colors each)
 * Colors chosen for visual appeal + psychological associations
 */
export const COLOR_PRESETS: ColorPreset[] = [
  // SANGVINIK (social, energetic, playful) → Bright, warm colors
  {
    id: 'teal',
    name: 'Tyrkysová',
    hex: '#2CBEC6',
    temperament: 'sangvinik',
  },
  {
    id: 'gold',
    name: 'Zlatá',
    hex: '#F8CA00',
    temperament: 'sangvinik',
  },

  // CHOLERIK (goal-oriented, decisive, bold) → Strong, assertive colors
  {
    id: 'purple',
    name: 'Fialová',
    hex: '#8B5CF6',
    temperament: 'cholerik',
  },
  {
    id: 'red',
    name: 'Červená',
    hex: '#EF4444',
    temperament: 'cholerik',
  },

  // MELANCHOLIK (detail-oriented, thoughtful, calm) → Deep, sophisticated colors
  {
    id: 'blue',
    name: 'Modrá',
    hex: '#3B82F6',
    temperament: 'melancholik',
  },
  {
    id: 'green',
    name: 'Zelená',
    hex: '#10B981',
    temperament: 'melancholik',
  },

  // FLEGMATIK (peaceful, harmonious, easygoing) → Soft, soothing colors
  {
    id: 'orange',
    name: 'Oranžová',
    hex: '#F97316',
    temperament: 'flegmatik',
  },
  {
    id: 'pink',
    name: 'Růžová',
    hex: '#EC4899',
    temperament: 'flegmatik',
  },
] as const;

/**
 * Default draft exercise values
 */
export const DEFAULT_DRAFT_EXERCISE = {
  name: '',
  description: '',
  breathingPattern: {
    inhale_seconds: 4,
    hold_after_inhale_seconds: 0,
    exhale_seconds: 4,
    hold_after_exhale_seconds: 0,
  },
  repetitions: 5,
  card_color: COLOR_PRESETS[0].hex, // Default to Teal
  mode: 'simple' as const,
} as const;

/**
 * Debounce delays (ms)
 */
export const DEBOUNCE_DELAYS = {
  NAME_VALIDATION: 300, // Check for duplicates after user stops typing
  PATTERN_CALCULATION: 100, // Recalculate duration preview
} as const;

/**
 * Analytics event names
 */
export const ANALYTICS_EVENTS = {
  CREATOR_OPENED: 'exercise_creator_opened',
  CREATOR_CLOSED: 'exercise_creator_closed',
  MODE_TOGGLED: 'exercise_creator_mode_toggled',
  COLOR_SELECTED: 'exercise_creator_color_selected',
  EXERCISE_SAVED: 'exercise_creator_saved',
  SAVE_ERROR: 'exercise_creator_save_error',
  TIER_LOCK_SHOWN: 'exercise_creator_tier_lock_shown',
} as const;
