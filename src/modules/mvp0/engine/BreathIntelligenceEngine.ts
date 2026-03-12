/**
 * Breath Intelligence Engine (BIE)
 *
 * Deterministic algorithm (no LLM) that computes the optimal breathing session
 * configuration for a given user. Runs on the frontend, < 100ms.
 *
 * Processing pipeline (6 tiers, each can only lower or maintain the previous tier's output):
 *   TIER 1: Safety Gate  — hard limit from health conditions
 *   TIER 2: KP Cap       — hard limit from Control Pause measurement
 *   TIER 3: Time Context — daily modulator based on device clock
 *   TIER 4: Session Intelligence — learning from last 5–7 SMART sessions
 *   TIER 5: Progression Gate — rate-limit advancement
 *   TIER 6: Behavioral Preference — nudge toward preferred profile
 *
 * Cold Start: 0 SMART sessions → level 3, 7 min, standard profile.
 *
 * SAFETY RULE: holdInhale is ALWAYS 0. Never add hold after inhale.
 *
 * @package DechBar_App
 * @subpackage MVP0/Engine
 */

import { getBreathLevel } from '../config/breathLevels';
import type {
  SmartSessionConfig,
  SmartContextSnapshot,
  SmartDurationMode,
  SmartTimeContext,
  SmartPhaseProfile,
  SafetyFlags,
} from '../types/exercises';
import type { Exercise, BreathingPattern, ExercisePhase } from '../types/exercises';

// =====================================================
// INPUT TYPES
// =====================================================

export interface SmartSessionHistory {
  final_intensity_multiplier: number | null;
  difficulty_rating: number | null; // 1=easy, 2=just right, 3=hard
  was_completed: boolean;
  started_at: string; // ISO string
  smart_context: SmartContextSnapshot | null;
}

export interface BIEInput {
  safetyFlags: SafetyFlags | null;
  latestKP: number | null;
  /** Last 7 completed SMART sessions (most recent first) */
  smartHistory: SmartSessionHistory[];
  sessionCountSmart: number;
  currentLevel: number;
  lastLevelChangeAt: string | null; // ISO string
  streak: number;
  smartDurationMode: SmartDurationMode;
}

// =====================================================
// INTERNAL CONSTANTS
// =====================================================

// Cold start level depends on KP — faster entry for experienced breathers.
// Safety: KP Cap (Tier 2) will still enforce the hard ceiling regardless.
function resolveColdStartLevel(kp: number | null): number {
  if (kp === null || kp < 20) return 3; // unknown or weak KP → safe entry
  if (kp < 30) return 5;               // solid KP (20–29s) → skip basics
  return 7;                             // KP 30s+ → start at Střední+
}

// COLD_START_DURATION is reserved for future adaptive warm-up logic
const _COLD_START_DURATION = 420; // 7 min
const MIN_DURATION = 300; // 5 min
const MAX_DURATION = 900; // 15 min
// Exported so SessionEngineModal can compute silence duration without reading exercise phases
// (avoids stale closure bugs — single source of truth for silence calculation)
export const MIN_SILENCE = 30;

// KP → maxLevel mapping (TIER 2)
const KP_CAP_TABLE: Array<{ maxKP: number; maxLevel: number; noHolds: boolean }> = [
  { maxKP: 10,  maxLevel: 3,  noHolds: true },
  { maxKP: 20,  maxLevel: 5,  noHolds: true },
  { maxKP: 30,  maxLevel: 9,  noHolds: false },
  { maxKP: 40,  maxLevel: 13, noHolds: false },
  { maxKP: 50,  maxLevel: 16, noHolds: false },
  { maxKP: Infinity, maxLevel: 21, noHolds: false },
];

// Night mode KP → max rhythm (no holds, no level above these)
const NIGHT_KP_RHYTHMS: Array<{ maxKP: number; inhale: number; exhale: number }> = [
  { maxKP: 10,  inhale: 4, exhale: 6 },
  { maxKP: 20,  inhale: 5, exhale: 7 },
  { maxKP: 30,  inhale: 6, exhale: 9 },
  { maxKP: Infinity, inhale: 7, exhale: 10 },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getTimeContext(hour?: number): SmartTimeContext {
  const h = hour !== undefined ? hour : new Date().getHours();
  if (h >= 4 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

function clampLevel(level: number, min = 1, max = 21): number {
  return Math.max(min, Math.min(max, Math.round(level)));
}

/**
 * Resolve total duration seconds from SmartDurationMode and context signals.
 */
function resolveDuration(
  mode: SmartDurationMode,
  timeContext: SmartTimeContext,
  streak: number,
): number {
  if (mode.type === 'fixed') {
    // Round to nearest minute so ±1 min buttons always land on clean values
    return Math.round(Math.max(MIN_DURATION, Math.min(MAX_DURATION, mode.seconds)) / 60) * 60;
  }

  const ranges = {
    short:  [300, 480],  // 5–8 min
    medium: [420, 600],  // 7–10 min (default)
    long:   [600, 900],  // 10–15 min
  } as const;

  const [rangeMin, rangeMax] = ranges[mode.preset];

  // Morning → shorter end, evening/night → longer end for relaxation
  let fraction = 0.5;
  if (timeContext === 'morning') fraction = 0.25;
  else if (timeContext === 'evening' || timeContext === 'night') fraction = 0.75;

  // High streak → longer end
  if (streak >= 7) fraction = Math.min(1, fraction + 0.25);

  const rawSeconds = rangeMin + (rangeMax - rangeMin) * fraction;
  return Math.round(rawSeconds / 60) * 60;
}

// =====================================================
// TIER PROCESSORS
// =====================================================

interface TierState {
  maxLevel: number;
  noHolds: boolean;
  maxDuration: number | null;
  forceNightRhythm: boolean;
}

/** TIER 1: Safety Gate — overrides everything */
function applyTier1Safety(flags: SafetyFlags | null): Partial<TierState> {
  if (!flags) return {};

  const hasCritical =
    flags.pregnancy ||
    flags.cardiovascular ||
    flags.epilepsy;

  if (hasCritical) {
    return { maxLevel: 3, noHolds: true, maxDuration: 600 };
  }

  if (flags.asthma) {
    return { maxLevel: 3, noHolds: true, maxDuration: null };
  }

  return {};
}

/** TIER 2: KP Cap */
function applyTier2KP(kp: number | null): Partial<TierState> {
  if (kp === null) return {};

  const entry = KP_CAP_TABLE.find((row) => kp < row.maxKP);
  if (!entry) return {};

  return { maxLevel: entry.maxLevel, noHolds: entry.noHolds };
}

/** TIER 3: Time Context */
function applyTier3TimeContext(
  context: SmartTimeContext,
  _currentLevel: number,
  _kp: number | null,
): Partial<TierState> & { targetLevelAdjust: number } {
  if (context === 'night') {
    return {
      noHolds: true,
      forceNightRhythm: true,
      targetLevelAdjust: 0,
    };
  }

  // Evening, morning, day: no level adjustment.
  // Level is controlled exclusively by Tier 4 (session performance).
  // Evening used to have -1 penalty but that caused progressive level drops
  // for users who train in the evening — phaseProfile (evening_humming) already
  // handles the calming effect without needing to reduce the pattern difficulty.
  return { targetLevelAdjust: 0 };
}

/** TIER 4: Session Intelligence — rolling 5–7 sessions */
function applyTier4SessionIntelligence(
  history: SmartSessionHistory[],
  _currentLevel: number,
): { levelDelta: number; reason: string } {
  if (history.length === 0) {
    return { levelDelta: 0, reason: 'no-history' };
  }

  const recent = history.slice(0, 5);
  const _completed = recent.filter((s) => s.was_completed);

  // DECREASE signals — immediate, no gate
  const lastSession = history[0];
  if (!lastSession) return { levelDelta: 0, reason: 'empty' };

  if (!lastSession.was_completed) {
    return { levelDelta: -1, reason: 'incomplete-session' };
  }

  if (
    lastSession.was_completed &&
    lastSession.final_intensity_multiplier !== null &&
    lastSession.final_intensity_multiplier <= 0.75
  ) {
    return { levelDelta: -1, reason: 'low-multiplier' };
  }

  if (lastSession.difficulty_rating === 3) {
    return { levelDelta: -1, reason: 'high-difficulty' };
  }

  // INCREASE signals — need 2 qualifying sessions
  const last2 = history.slice(0, 2);
  const last2Completed = last2.filter((s) => s.was_completed);

  if (last2Completed.length >= 2) {
    const allHighMultiplier = last2Completed.every(
      (s) => s.final_intensity_multiplier !== null && s.final_intensity_multiplier >= 1.25,
    );
    const allEasy = last2Completed.every((s) => s.difficulty_rating === 1);

    if (allHighMultiplier || allEasy) {
      return { levelDelta: 1, reason: 'strong-performance' };
    }
  }

  return { levelDelta: 0, reason: 'stable' };
}

/** TIER 5: Progression Gate — require consistent high-performance sessions */
function applyTier5ProgressionGate(
  levelDelta: number,
  history: SmartSessionHistory[],
): number {
  if (levelDelta <= 0) return levelDelta; // decreases always pass immediately

  const last3Completed = history
    .filter((s) => s.was_completed)
    .slice(0, 3);

  if (last3Completed.length < 2) {
    return 0; // Need at least 2 sessions to confirm consistent performance
  }

  const last2 = last3Completed.slice(0, 2);

  // Fast track: 2× max multiplier (1.50) = strong enough signal on its own
  const bothMaxMultiplier = last2.every(
    (s) => s.final_intensity_multiplier !== null && s.final_intensity_multiplier >= 1.50,
  );
  if (bothMaxMultiplier) return levelDelta;

  // Standard track: 3 qualifying sessions (multiplier >= 1.25 or difficulty = easy)
  if (last3Completed.length < 3) return 0;

  const allStrong = last3Completed.every(
    (s) =>
      (s.final_intensity_multiplier !== null && s.final_intensity_multiplier >= 1.25) ||
      s.difficulty_rating === 1,
  );

  return allStrong ? levelDelta : 0;
}

/** TIER 6: Behavioral Preference — nudge phase profile */
function applyTier6Behavioral(
  timeContext: SmartTimeContext,
  _history: SmartSessionHistory[],
): SmartPhaseProfile {
  if (timeContext === 'night' || timeContext === 'evening') {
    return 'evening_humming';
  }

  if (timeContext === 'day') {
    return 'dynamic_day';
  }

  return 'standard';
}

// =====================================================
// MAIN: computeSmartSession
// =====================================================

/**
 * Compute the optimal SMART session configuration for the given user context.
 * Always returns a valid config — falls back to cold start on any error.
 */
export function computeSmartSession(input: BIEInput): SmartSessionConfig {
  try {
    return computeSmartSessionUnsafe(input);
  } catch {
    return getColdStartConfig(input.smartDurationMode);
  }
}

function getColdStartConfig(durationMode: SmartDurationMode, kp: number | null = null): SmartSessionConfig {
  const coldLevel = resolveColdStartLevel(kp);
  const level = getBreathLevel(coldLevel);
  const timeContext = getTimeContext();
  const totalDurationSeconds = resolveDuration(durationMode, timeContext, 0);
  return {
    level: coldLevel,
    basePattern: {
      inhale_seconds: level.inhale,
      hold_after_inhale_seconds: 0,
      exhale_seconds: level.exhale,
      hold_after_exhale_seconds: level.holdExhale,
    },
    totalDurationSeconds,
    phaseProfile: 'standard',
    timeContext,
    sessionCountSmart: 0,
    confidenceScore: 0,
    isCalibrating: true,
    cacheValid: false,
  };
}

function computeSmartSessionUnsafe(input: BIEInput): SmartSessionConfig {
  const {
    safetyFlags,
    latestKP,
    smartHistory,
    sessionCountSmart,
    currentLevel,
    lastLevelChangeAt: _lastLevelChangeAt,
    streak: _streak,
    smartDurationMode,
  } = input;

  // Cold start
  if (sessionCountSmart === 0 || currentLevel === 0) {
    return getColdStartConfig(smartDurationMode, latestKP);
  }

  const timeContext = getTimeContext();

  // Accumulated state from tiers
  let tierMaxLevel = 21;
  let tierNoHolds = false;
  let tierMaxDuration: number | null = null;
  let tierForceNightRhythm = false;

  // TIER 1 — Safety Gate
  const t1 = applyTier1Safety(safetyFlags);
  if (t1.maxLevel !== undefined) tierMaxLevel = Math.min(tierMaxLevel, t1.maxLevel);
  if (t1.noHolds) tierNoHolds = true;
  if (t1.maxDuration !== undefined && t1.maxDuration !== null) {
    tierMaxDuration = t1.maxDuration;
  }

  // TIER 2 — KP Cap
  const t2 = applyTier2KP(latestKP);
  if (t2.maxLevel !== undefined) tierMaxLevel = Math.min(tierMaxLevel, t2.maxLevel);
  if (t2.noHolds) tierNoHolds = true;

  // TIER 3 — Time Context
  const t3 = applyTier3TimeContext(timeContext, currentLevel, latestKP);
  if (t3.noHolds) tierNoHolds = true;
  if (t3.forceNightRhythm) tierForceNightRhythm = true;

  // TIER 4 — Session Intelligence
  const t4 = applyTier4SessionIntelligence(smartHistory, currentLevel);

  // TIER 5 — Progression Gate
  const gatedDelta = applyTier5ProgressionGate(t4.levelDelta, smartHistory);

  // Compute target level
  const targetLevel = clampLevel(currentLevel + gatedDelta + t3.targetLevelAdjust, 1, tierMaxLevel);

  // TIER 6 — Behavioral Preference
  const phaseProfile = applyTier6Behavioral(timeContext, smartHistory);

  // Resolve final pattern — apply night override if needed
  let finalPattern: SmartSessionConfig['basePattern'];

  if (tierForceNightRhythm) {
    // Night: find max rhythm for this KP, no holds —
    // BUT never exceed the user's current base level rhythm.
    const nightRow = NIGHT_KP_RHYTHMS.find((r) => (latestKP ?? 0) < r.maxKP)
      ?? NIGHT_KP_RHYTHMS[NIGHT_KP_RHYTHMS.length - 1]!;

    const baseData = getBreathLevel(targetLevel);

    // Cap night rhythm to user's base level — never jump above their current zone
    const nightInhale = Math.min(nightRow.inhale, baseData.inhale);
    const nightExhale = Math.min(nightRow.exhale, baseData.exhale);

    finalPattern = {
      inhale_seconds: nightInhale,
      hold_after_inhale_seconds: 0,
      exhale_seconds: nightExhale,
      hold_after_exhale_seconds: 0, // no holds at night
    };
    // Level stays at targetLevel — rhythm is softened, not level-jumped
  } else {
    const levelData = getBreathLevel(targetLevel);
    const holdExhale = tierNoHolds ? 0 : levelData.holdExhale;
    finalPattern = {
      inhale_seconds: levelData.inhale,
      hold_after_inhale_seconds: 0,
      exhale_seconds: levelData.exhale,
      hold_after_exhale_seconds: holdExhale,
    };
  }

  // Duration
  let totalDuration = resolveDuration(smartDurationMode, timeContext, _streak);
  if (tierMaxDuration !== null) {
    totalDuration = Math.min(totalDuration, tierMaxDuration);
  }
  totalDuration = Math.max(MIN_DURATION, totalDuration);

  // Confidence score
  const confidenceScore = Math.min(1.0, sessionCountSmart / 10);
  const isCalibrating = sessionCountSmart < 10;

  return {
    level: targetLevel,
    basePattern: finalPattern,
    totalDurationSeconds: totalDuration,
    phaseProfile,
    timeContext,
    sessionCountSmart,
    confidenceScore,
    isCalibrating,
    cacheValid: false,
  };
}

// =====================================================
// BUILD SMART EXERCISE
// =====================================================

/**
 * Generate an ephemeral Exercise object from a SmartSessionConfig.
 * This object is NEVER saved to the exercises table.
 * It satisfies the full Exercise interface required by SessionEngineModal.
 */
export function buildSmartExercise(config: SmartSessionConfig): Exercise {
  const phases = buildPhases(config);
  const totalDuration = phases.reduce((sum, p) => sum + p.duration_seconds, 0);

  const breathingPattern: BreathingPattern = {
    version: '1.0',
    type: 'multi-phase',
    phases,
    metadata: {
      total_duration_seconds: totalDuration,
      phase_count: phases.length,
      difficulty: config.level <= 5 ? 'beginner' : config.level <= 12 ? 'intermediate' : 'advanced',
      tags: ['smart', 'auto-generated'],
    },
  };

  const now = new Date().toISOString();

  return {
    id: `smart-ephemeral-${Date.now()}`,
    name: 'SMART CVIČENÍ',
    description: null,
    category: 'custom',
    subcategory: null,
    created_by: null,
    is_public: false,
    required_tier: 'SMART',
    breathing_pattern: breathingPattern,
    total_duration_seconds: totalDuration,
    phase_count: phases.length,
    difficulty: breathingPattern.metadata.difficulty,
    tags: ['smart'],
    contraindications: [],
    card_color: null,
    is_meditation_mode: false,
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Build the multi-phase array for a SMART session based on phaseProfile.
 * Multiplier × 1.15 / × 1.25 is rounded to whole exhale seconds.
 * Never exceeds Tier 2 KP cap (already enforced by config).
 */
function buildPhases(config: SmartSessionConfig): ExercisePhase[] {
  const T = config.totalDurationSeconds;
  const base = config.basePattern;

  if (config.phaseProfile === 'dynamic_day') {
    return buildDynamicDayPhases(T, base);
  }

  if (config.phaseProfile === 'evening_humming') {
    return buildEveningHummingPhases(T, base);
  }

  return buildStandardPhases(T, base, config.timeContext);
}

function buildStandardPhases(
  T: number,
  base: SmartSessionConfig['basePattern'],
  _timeContext: SmartTimeContext,
): ExercisePhase[] {
  // Morning & Standard: 4-phase
  const silenceDuration = Math.max(MIN_SILENCE, Math.round(T * 0.05));
  const remaining = T - silenceDuration;
  const nastupDuration = Math.round(remaining * (20 / 95));
  const peakDuration = Math.round(remaining * (55 / 95));
  const doznenDuration = remaining - nastupDuration - peakDuration;

  // Peak multiplier: × 1.15 on exhale (round down, never exceed)
  const peakExhale = Math.floor(base.exhale_seconds * 1.15);

  return [
    makeBreathingPhase(1, 'Nástup', 'Pomalé zahřátí dechu.', nastupDuration, base),
    makeBreathingPhase(2, 'Hlavní trénink', 'Plný dechový vzorec.', peakDuration, {
      ...base, exhale_seconds: peakExhale,
    }),
    makeBreathingPhase(3, 'Doznění', 'Návrat k základnímu rytmu.', doznenDuration, base),
    makeSilencePhase(4, silenceDuration),
  ];
}

function buildDynamicDayPhases(
  T: number,
  base: SmartSessionConfig['basePattern'],
): ExercisePhase[] {
  // 5-phase: 20% / 35% / 20% / 20% / 5%
  const silenceDuration = Math.max(MIN_SILENCE, Math.round(T * 0.05));
  const remaining = T - silenceDuration;
  const nastupDuration  = Math.round(remaining * (20 / 95));
  const narostDuration  = Math.round(remaining * (35 / 95));
  const peakDuration    = Math.round(remaining * (20 / 95));
  const doznenDuration  = remaining - nastupDuration - narostDuration - peakDuration;

  const narostExhale = Math.floor(base.exhale_seconds * 1.15);
  const peakExhale   = Math.floor(base.exhale_seconds * 1.25);

  return [
    makeBreathingPhase(1, 'Nástup',  'Zahřátí dechu.', nastupDuration, base),
    makeBreathingPhase(2, 'Nárůst',  'Postupné zvyšování intenzity.', narostDuration, {
      ...base, exhale_seconds: narostExhale,
    }),
    makeBreathingPhase(3, 'Vrchol',  'Testovací interval — preview dalšího levelu.', peakDuration, {
      ...base, exhale_seconds: peakExhale,
    }),
    makeBreathingPhase(4, 'Doznění', 'Návrat k základnímu rytmu.', doznenDuration, base),
    makeSilencePhase(5, silenceDuration),
  ];
}

function buildEveningHummingPhases(
  T: number,
  base: SmartSessionConfig['basePattern'],
): ExercisePhase[] {
  // 4-phase (no intensity increase in evening/night)
  const silenceDuration = Math.max(MIN_SILENCE, Math.round(T * 0.05));
  const remaining = T - silenceDuration;
  const nastupDuration  = Math.round(remaining * (20 / 95));
  const hlavniDuration  = Math.round(remaining * (45 / 95));
  const bzuceniDuration = remaining - nastupDuration - hlavniDuration;

  return [
    makeBreathingPhase(1, 'Nástup', 'Klidné zahřátí.', nastupDuration, base),
    makeBreathingPhase(2, 'Hlavní', 'Základní dechový vzorec.', hlavniDuration, base),
    {
      ...makeBreathingPhase(3, 'Bzučení', 'Při výdechu jemně bzuč — parasympatická aktivace.', bzuceniDuration, base),
      instructions: 'Při výdechu jemně bzuč (hm...)',
    },
    makeSilencePhase(4, silenceDuration),
  ];
}

function makeBreathingPhase(
  order: number,
  name: string,
  description: string,
  durationSeconds: number,
  pattern: SmartSessionConfig['basePattern'],
): ExercisePhase {
  const cycleDuration =
    pattern.inhale_seconds +
    pattern.hold_after_inhale_seconds +
    pattern.exhale_seconds +
    pattern.hold_after_exhale_seconds;

  const cycles = cycleDuration > 0 ? Math.round(durationSeconds / cycleDuration) : 1;

  return {
    order,
    type: 'breathing',
    name,
    description,
    pattern: {
      inhale_seconds: pattern.inhale_seconds,
      hold_after_inhale_seconds: pattern.hold_after_inhale_seconds,
      exhale_seconds: pattern.exhale_seconds,
      hold_after_exhale_seconds: pattern.hold_after_exhale_seconds,
    },
    duration_seconds: durationSeconds,
    cycles_count: cycles,
  };
}

function makeSilencePhase(order: number, durationSeconds: number): ExercisePhase {
  return {
    order,
    type: 'silence',
    name: 'Ticho',
    description: 'Vychutnaj si ticho a klid po cvičení.',
    pattern: null,
    duration_seconds: durationSeconds,
    cycles_count: null,
  };
}

// =====================================================
// SMART CONTEXT SNAPSHOT
// =====================================================

/**
 * Build the smart_context JSONB payload to save with a SMART session.
 */
export function buildSmartContextSnapshot(
  config: SmartSessionConfig,
  kpAtSession: number | null,
  exercise: Exercise,
): SmartContextSnapshot {
  return {
    level: config.level,
    base_rhythm: {
      inhale: config.basePattern.inhale_seconds,
      hold_inhale: 0,
      exhale: config.basePattern.exhale_seconds,
      hold_exhale: config.basePattern.hold_after_exhale_seconds,
    },
    phase_profile: config.phaseProfile,
    time_context: config.timeContext,
    kp_at_session: kpAtSession,
    total_duration_seconds: config.totalDurationSeconds,
    confidence_score_at_start: config.confidenceScore,
    session_count_at_start: config.sessionCountSmart,
    phase_breakdown: exercise.breathing_pattern.phases.map((p) => ({
      order: p.order,
      duration_seconds: p.duration_seconds,
      multiplier: p.type === 'silence' ? 0 : 1.0,
      ...(p.type === 'silence' ? { type: 'silence' as const } : {}),
    })),
  };
}
