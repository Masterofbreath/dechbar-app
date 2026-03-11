/**
 * TRON_LEVELS — Cesta na Trůn Level Scale
 *
 * 21-level scale for walking breath-hold training (dynamic CO2 tolerance).
 * Unlike SMART (static), Trůn has fixed inhale/exhale (3|0|3) and only
 * the holdExhale progresses — from 3s (Level 1) to 23s (Level 21).
 *
 * Rules:
 * - inhale is ALWAYS 3s
 * - holdInhale is ALWAYS 0 (safety rule, same as SMART)
 * - exhale is ALWAYS 3s
 * - holdExhale progresses +1s per level (3s → 23s)
 * - minKP = 20s for ALL levels (safety gate — checked before access)
 *
 * @package DechBar_App
 * @subpackage MVP0/Config
 */

// =====================================================
// TYPES
// =====================================================

/**
 * A single level in the TRON_LEVELS progression scale.
 * inhale/exhale are fixed at 3s, holdInhale is typed as literal 0.
 */
export interface TronLevel {
  /** Level index 1–21 */
  level: number;
  /** Inhale duration — ALWAYS 3s */
  inhale: 3;
  /** Hold after inhale — ALWAYS 0, no exceptions */
  holdInhale: 0;
  /** Exhale duration — ALWAYS 3s */
  exhale: 3;
  /** Hold after exhale in seconds — the only progressing variable */
  holdExhale: number;
  /** Human-readable label */
  label: string;
  /** Approximate breath cycles per minute */
  bpm: number;
}

// =====================================================
// TRON_LEVELS CONSTANT (21 levels)
// =====================================================

/**
 * The canonical 21-level Trůn scale.
 * Source of truth for all Trůn session computations.
 *
 * Formula: holdExhale = level + 2  (L1=3s, L21=23s)
 * Cycle time = 3 + 0 + 3 + holdExhale = (6 + holdExhale) seconds
 */
export const TRON_LEVELS: readonly TronLevel[] = [
  { level: 1,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 3,  label: 'Start',     bpm: parseFloat((60 / 9).toFixed(1)) },
  { level: 2,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 4,  label: 'Začátečník', bpm: parseFloat((60 / 10).toFixed(1)) },
  { level: 3,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 5,  label: 'Začátečník+', bpm: parseFloat((60 / 11).toFixed(1)) },
  { level: 4,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 6,  label: 'Mírný',     bpm: parseFloat((60 / 12).toFixed(1)) },
  { level: 5,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 7,  label: 'Mírný+',    bpm: parseFloat((60 / 13).toFixed(1)) },
  { level: 6,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 8,  label: 'Střední',   bpm: parseFloat((60 / 14).toFixed(1)) },
  { level: 7,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 9,  label: 'Střední+',  bpm: parseFloat((60 / 15).toFixed(1)) },
  { level: 8,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 10, label: 'Střední++', bpm: parseFloat((60 / 16).toFixed(1)) },
  { level: 9,  inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 11, label: 'Pokročilý', bpm: parseFloat((60 / 17).toFixed(1)) },
  { level: 10, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 12, label: 'Pokročilý+', bpm: parseFloat((60 / 18).toFixed(1)) },
  { level: 11, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 13, label: 'Pokročilý++', bpm: parseFloat((60 / 19).toFixed(1)) },
  { level: 12, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 14, label: 'Expert',    bpm: parseFloat((60 / 20).toFixed(1)) },
  { level: 13, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 15, label: 'Expert+',   bpm: parseFloat((60 / 21).toFixed(1)) },
  { level: 14, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 16, label: 'Expert++',  bpm: parseFloat((60 / 22).toFixed(1)) },
  { level: 15, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 17, label: 'Master',    bpm: parseFloat((60 / 23).toFixed(1)) },
  { level: 16, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 18, label: 'Master+',   bpm: parseFloat((60 / 24).toFixed(1)) },
  { level: 17, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 19, label: 'Master++',  bpm: parseFloat((60 / 25).toFixed(1)) },
  { level: 18, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 20, label: 'Elite',     bpm: parseFloat((60 / 26).toFixed(1)) },
  { level: 19, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 21, label: 'Elite+',    bpm: parseFloat((60 / 27).toFixed(1)) },
  { level: 20, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 22, label: 'Elite++',   bpm: parseFloat((60 / 28).toFixed(1)) },
  { level: 21, inhale: 3, holdInhale: 0, exhale: 3, holdExhale: 23, label: 'Trůn',      bpm: parseFloat((60 / 29).toFixed(1)) },
] as const;

// =====================================================
// HELPERS
// =====================================================

/**
 * Get a TronLevel by 1-based level number.
 * Returns level 1 (safe default) if out of bounds.
 */
export function getTronLevel(level: number): TronLevel {
  const idx = Math.max(1, Math.min(21, Math.round(level))) - 1;
  return TRON_LEVELS[idx] as TronLevel;
}

/**
 * Format a Trůn pattern as "3 | 0 | 3 | X" notation.
 */
export function formatTronRhythm(holdExhale: number): string {
  return `3 | 0 | 3 | ${holdExhale}`;
}

/**
 * Apply intensity multiplier to holdExhale.
 * Multiplier steps: 0.5, 0.75, 1.0, 1.25, 1.5
 * Result is rounded to 1 decimal place, min 1s.
 */
export function applyTronIntensity(baseHoldExhale: number, multiplier: number): number {
  return Math.max(1, Math.round(baseHoldExhale * multiplier * 10) / 10);
}

/**
 * Intensity multiplier steps — same as SMART (5 steps).
 * Applied ONLY to holdExhale, not to inhale/exhale.
 */
export const TRON_MULTIPLIER_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
export type TronMultiplierStep = typeof TRON_MULTIPLIER_STEPS[number];

/** Default multiplier index (1.0×) */
export const TRON_DEFAULT_MULTIPLIER_IDX = 2;

/** Minimum KP required to access Trůn (safety gate) */
export const TRON_MIN_KP = 20;
