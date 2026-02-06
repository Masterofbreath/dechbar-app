/**
 * Exercise Creator - Constants & Configuration
 * 
 * Default values, limits, and preset configurations.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/ExerciseCreator
 * @since 1.0.0
 */

import type { DraftExercise, PresetColor, QuickPreset } from './types';

// =====================================================
// LIMITS & CONSTRAINTS
// =====================================================

export const EXERCISE_CREATOR_LIMITS = {
  // Name constraints
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
  
  // Description constraints
  DESCRIPTION_MAX_LENGTH: 350,
  
  // Breathing duration constraints (per phase)
  DURATION_MIN: 0.0,
  DURATION_MAX: 20.0,
  DURATION_INCREMENT: 0.5,
  
  // Repetition constraints
  REPETITIONS_MIN: 1,
  REPETITIONS_MAX: 99,
  
  // Total exercise duration
  TOTAL_DURATION_MAX: 45 * 60, // 45 minutes in seconds
  
  // Tier limits
  FREE_TIER_MAX_EXERCISES: 3,
} as const;

// =====================================================
// DEFAULT VALUES
// =====================================================

/**
 * Default exercise state (Smart defaults)
 * 
 * Pre-fills with balanced 4-0-4-0 Box Breathing pattern
 * to give users a good starting point.
 */
export const DEFAULT_EXERCISE: DraftExercise = {
  name: '',
  description: null,
  breathingPattern: {
    inhale_seconds: 4.0,
    hold_after_inhale_seconds: 0.0,
    exhale_seconds: 4.0,
    hold_after_exhale_seconds: 0.0,
  },
  repetitions: 9,
  cardColor: '#2CBEC6', // Teal default
  isValid: false,
  totalDurationSeconds: 72, // (4+0+4+0) × 9 = 72s
};

// =====================================================
// PRESET COLORS (8 Options)
// =====================================================

/**
 * 8 preset colors for exercise cards
 * 
 * Design principles:
 * - Brand-safe colors (no pure red/blue)
 * - Sufficient contrast on dark background
 * - Visual variety for personalization
 * - Less is more (no custom picker in MVP)
 */
export const PRESET_COLORS: PresetColor[] = [
  { id: 'teal', hex: '#2CBEC6', label: 'Teal' },
  { id: 'gold', hex: '#D6A23A', label: 'Zlatá' },
  { id: 'purple', hex: '#6c5ce7', label: 'Fialová' },
  { id: 'green', hex: '#10B981', label: 'Zelená' },
  { id: 'red', hex: '#EF4444', label: 'Červená' },
  { id: 'blue', hex: '#3B82F6', label: 'Modrá' },
  { id: 'orange', hex: '#F59E0B', label: 'Oranžová' },
  { id: 'pink', hex: '#EC4899', label: 'Růžová' },
];

// =====================================================
// QUICK PRESETS (Repetition Counts)
// =====================================================

/**
 * Quick preset buttons for repetition count
 * 
 * Values chosen for practical session lengths:
 * - 9×: ~1-2 min (quick reset)
 * - 18×: ~2-4 min (standard session)
 * - 27×: ~4-6 min (deep practice)
 */
export const QUICK_PRESETS: QuickPreset[] = [
  { count: 9, label: '9×' },
  { count: 18, label: '18×' },
  { count: 27, label: '27×' },
];

// =====================================================
// VALIDATION MESSAGES
// =====================================================

export const VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: 'Název musí mít minimálně 3 znaky',
  NAME_TOO_LONG: 'Název může mít maximálně 50 znaků',
  NAME_DUPLICATE: 'Cvičení s tímto názvem už existuje',
  PATTERN_ALL_ZERO: 'Nastavte alespoň jeden dech (nádech nebo výdech musí být > 0)',
  DURATION_TOO_LONG: (minutes: number) => `Maximální délka cvičení je 45 minut (aktuálně ${minutes} min)`,
  REPETITIONS_INVALID: 'Počet opakování musí být 1-99',
} as const;

// =====================================================
// TIER MESSAGING
// =====================================================

export const TIER_LOCK_MESSAGES = {
  FREE_LIMIT_REACHED: {
    featureName: 'Více než 3 vlastní cvičení',
    description: 'Dosáhl jsi limit 3 cvičení na FREE tarifu.',
  },
  COMPLEX_MODE: {
    featureName: 'Komplexní nástroj na tvorbu cvičení',
    description: 'Multi-fázový editor je dostupný od tarifu SMART.',
  },
} as const;

// =====================================================
// ANIMATION TIMING
// =====================================================

export const ANIMATION_TIMING = {
  MODAL_OPEN: 250, // ms
  MODAL_CLOSE: 200, // ms
  TOGGLE_SWITCH: 250, // ms
  BUTTON_PRESS: 100, // ms
  COLOR_PILL_HOVER: 150, // ms
  SAVE_SUCCESS_DELAY: 500, // ms before auto-close
} as const;

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================

export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Enter', // or Cmd+Enter
  CLOSE: 'Escape',
  INCREMENT: 'ArrowUp',
  DECREMENT: 'ArrowDown',
} as const;
