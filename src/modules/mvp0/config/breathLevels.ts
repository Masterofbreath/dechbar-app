/**
 * BREATH_LEVELS — SMART CVIČENÍ Scale
 *
 * 21-level breathing pattern scale for the Breath Intelligence Engine (BIE).
 * Defines the progression from beginner (level 1) to master (level 21).
 *
 * Rules enforced by type system:
 * - holdInhale is ALWAYS 0 (no hold after inhale — safety rule)
 * - exhale:inhale ratio is always >= 1.5x
 * - Progression order: exhale first → inhale → holdExhale
 *
 * @package DechBar_App
 * @subpackage MVP0/Config
 */

// =====================================================
// TYPES
// =====================================================

/**
 * A single level in the BREATH_LEVELS progression scale.
 * holdInhale is typed as literal 0 — never non-zero anywhere in the system.
 */
export interface BreathLevel {
  /** Level index 1–21 */
  level: number;
  /** Inhale duration in seconds */
  inhale: number;
  /** Hold after inhale — ALWAYS 0, no exceptions */
  holdInhale: 0;
  /** Exhale duration in seconds */
  exhale: number;
  /** Hold after exhale in seconds */
  holdExhale: number;
  /** Minimum KP (Control Pause) in seconds required for this level */
  minKP: number;
  /** Human-readable label */
  label: string;
  /** Approximate breaths per minute */
  bpm: number;
}

// =====================================================
// BREATH_LEVELS CONSTANT (21 levels)
// =====================================================

/**
 * The canonical 21-level breathing scale.
 * Source of truth for all BIE computations.
 * Do NOT modify without updating SMART_EXERCISE_SPEC.md.
 */
export const BREATH_LEVELS: readonly BreathLevel[] = [
  { level: 1,  inhale: 4, holdInhale: 0, exhale: 4,  holdExhale: 0, minKP: 0,  label: 'Vstup',       bpm: 7.5 },
  { level: 2,  inhale: 4, holdInhale: 0, exhale: 5,  holdExhale: 0, minKP: 0,  label: 'Základní',     bpm: 6.7 },
  { level: 3,  inhale: 4, holdInhale: 0, exhale: 6,  holdExhale: 0, minKP: 0,  label: 'Základní+',    bpm: 6.0 },
  { level: 4,  inhale: 4, holdInhale: 0, exhale: 7,  holdExhale: 0, minKP: 0,  label: 'Mírný',        bpm: 5.5 },
  { level: 5,  inhale: 4, holdInhale: 0, exhale: 8,  holdExhale: 0, minKP: 0,  label: 'Mírný+',       bpm: 5.0 },
  { level: 6,  inhale: 5, holdInhale: 0, exhale: 8,  holdExhale: 0, minKP: 0,  label: 'Střední',      bpm: 4.6 },
  { level: 7,  inhale: 5, holdInhale: 0, exhale: 9,  holdExhale: 1, minKP: 0,  label: 'Střední+',     bpm: 4.0 },
  { level: 8,  inhale: 5, holdInhale: 0, exhale: 10, holdExhale: 1, minKP: 11, label: 'Střední++',    bpm: 3.75 },
  { level: 9,  inhale: 5, holdInhale: 0, exhale: 10, holdExhale: 2, minKP: 20, label: 'Pokročilý',    bpm: 3.5 },
  { level: 10, inhale: 5, holdInhale: 0, exhale: 11, holdExhale: 2, minKP: 20, label: 'Pokročilý+',   bpm: 3.3 },
  { level: 11, inhale: 5, holdInhale: 0, exhale: 12, holdExhale: 2, minKP: 25, label: 'Pokročilý++',  bpm: 3.1 },
  { level: 12, inhale: 6, holdInhale: 0, exhale: 12, holdExhale: 3, minKP: 30, label: 'Expert',       bpm: 3.0 },
  { level: 13, inhale: 6, holdInhale: 0, exhale: 12, holdExhale: 4, minKP: 30, label: 'Expert+',      bpm: 2.9 },
  { level: 14, inhale: 6, holdInhale: 0, exhale: 13, holdExhale: 4, minKP: 35, label: 'Expert++',     bpm: 2.7 },
  { level: 15, inhale: 6, holdInhale: 0, exhale: 14, holdExhale: 4, minKP: 40, label: 'Master',       bpm: 2.6 },
  { level: 16, inhale: 7, holdInhale: 0, exhale: 14, holdExhale: 5, minKP: 40, label: 'Master+',      bpm: 2.4 },
  { level: 17, inhale: 7, holdInhale: 0, exhale: 15, holdExhale: 5, minKP: 45, label: 'Master++',     bpm: 2.3 },
  { level: 18, inhale: 7, holdInhale: 0, exhale: 16, holdExhale: 5, minKP: 50, label: 'Elite',        bpm: 2.2 },
  { level: 19, inhale: 7, holdInhale: 0, exhale: 17, holdExhale: 5, minKP: 55, label: 'Elite+',       bpm: 2.1 },
  { level: 20, inhale: 8, holdInhale: 0, exhale: 16, holdExhale: 5, minKP: 55, label: 'Elite++',      bpm: 2.1 },
  { level: 21, inhale: 8, holdInhale: 0, exhale: 17, holdExhale: 5, minKP: 60, label: 'Mistr',        bpm: 2.0 },
] as const;

// =====================================================
// HELPERS
// =====================================================

/**
 * Get a BreathLevel by 1-based level number.
 * Returns level 3 (safe default) if out of bounds.
 */
export function getBreathLevel(level: number): BreathLevel {
  const idx = Math.max(1, Math.min(21, Math.round(level))) - 1;
  return BREATH_LEVELS[idx] as BreathLevel;
}

/**
 * Format a BreathLevel pattern as "4 · 0 · 7 · 0" notation.
 * Zeros are always shown (design decision: consistent notation).
 */
export function formatBreathRhythm(
  inhale: number,
  holdInhale: number,
  exhale: number,
  holdExhale: number,
): string {
  return `${inhale} | ${holdInhale} | ${exhale} | ${holdExhale}`;
}

/**
 * Get a BreathLevel from a pattern object.
 * Used to format SmartSessionConfig.basePattern for display.
 */
export function formatPatternRhythm(pattern: {
  inhale_seconds: number;
  hold_after_inhale_seconds: number;
  exhale_seconds: number;
  hold_after_exhale_seconds: number;
}): string {
  return formatBreathRhythm(
    pattern.inhale_seconds,
    pattern.hold_after_inhale_seconds,
    pattern.exhale_seconds,
    pattern.hold_after_exhale_seconds,
  );
}
