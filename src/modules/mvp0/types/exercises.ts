/**
 * Exercise System Types - DechBar MVP1
 * 
 * Type definitions for multi-phase breathing exercise system.
 * Matches Supabase database schema exactly.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Types
 */

// =====================================================
// CORE TYPES
// =====================================================

export type ExerciseCategory = 'preset' | 'custom';
export type ExerciseSubcategory = 'morning' | 'evening' | 'stress' | 'sleep' | 'focus' | 'energy';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type MembershipTier = 'ZDARMA' | 'SMART' | 'AI_COACH';
export type PhaseType = 'breathing' | 'silence';
export type Contraindication = 'epilepsy' | 'pregnancy' | 'cardiovascular' | 'asthma' | 'water_activities';
export type MoodType = 'stressed' | 'calm' | 'tired' | 'energized' | 'neutral';

// =====================================================
// BREATHING PATTERN STRUCTURES (JSONB Schema)
// =====================================================

/**
 * Single breathing phase definition
 */
export interface ExercisePhase {
  order: number;
  type: PhaseType;
  name: string;
  description: string;
  pattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: number;
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  } | null; // null for silence phases
  duration_seconds: number;
  cycles_count: number | null; // auto-calculated from duration
  instructions?: string; // optional (e.g., "Dýchej do břicha")
}

/**
 * Complete breathing pattern (stored in JSONB)
 */
export interface BreathingPattern {
  version: string; // "1.0"
  type: 'simple' | 'multi-phase';
  phases: ExercisePhase[];
  metadata: {
    total_duration_seconds: number;
    phase_count: number;
    difficulty: ExerciseDifficulty;
    tags: string[];
  };
}

// =====================================================
// DATABASE TABLES (matching Supabase schema)
// =====================================================

/**
 * Exercise database row
 */
export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  category: ExerciseCategory;
  subcategory: ExerciseSubcategory | null;
  created_by: string | null; // UUID (null = admin preset)
  is_public: boolean;
  required_tier: MembershipTier | null;
  breathing_pattern: BreathingPattern;
  total_duration_seconds: number;
  phase_count: number;
  difficulty: ExerciseDifficulty | null;
  tags: string[];
  contraindications: Contraindication[];
  card_color?: string | null; // Hex color for custom exercises (#RRGGBB)
  is_meditation_mode?: boolean; // NEW: If true, runs as meditation (no breathing pattern guidance)
  deleted_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Exercise session (history) database row
 */
export interface ExerciseSession {
  id: string;
  user_id: string; // UUID
  exercise_id: string | null; // UUID (nullable if exercise deleted)
  started_at: string; // ISO timestamp
  completed_at: string | null; // ISO timestamp
  was_completed: boolean;
  quality_rating: number | null; // 1-5 stars
  mood_before: MoodType | null;
  mood_after: MoodType | null;
  notes: string | null;
  created_at: string; // ISO timestamp
}

/**
 * Safety flags (stored in profiles.safety_flags JSONB)
 */
export interface SafetyFlags {
  questionnaire_completed: boolean;
  epilepsy: boolean;
  pregnancy: boolean;
  cardiovascular: boolean;
  asthma: boolean;
}

// =====================================================
// UI COMPONENT PROPS
// =====================================================

/**
 * Exercise card display data
 */
export interface ExerciseCardData {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number; // derived from total_duration_seconds
  phase_count: number;
  difficulty: ExerciseDifficulty | null;
  subcategory: ExerciseSubcategory | null;
  is_locked: boolean; // derived from tier + user membership
  tags: string[];
}

/**
 * Session Engine state
 */
export type SessionState = 'idle' | 'countdown' | 'active' | 'completed' | 'abandoned';

export interface SessionEngineState {
  state: SessionState;
  exercise: Exercise;
  currentPhaseIndex: number;
  currentPhaseProgress: number; // 0-100%
  currentPhaseTimeRemaining: number; // seconds
  totalTimeRemaining: number; // seconds
  startedAt: Date | null;
}

// =====================================================
// API PAYLOADS
// =====================================================

/**
 * Create exercise payload (user custom)
 */
export interface CreateExercisePayload {
  name: string;
  description?: string;
  subcategory?: ExerciseSubcategory;
  breathing_pattern: BreathingPattern;
  tags?: string[];
  card_color?: string; // Hex color (#RRGGBB)
}

/**
 * Complete session payload
 */
export interface CompleteSessionPayload {
  exercise_id: string | null; // null for smart ephemeral exercises (no DB row)
  started_at: Date;
  completed_at: Date;
  was_completed: boolean;
  mood_before?: MoodType;
  mood_after?: MoodType;
  difficulty_rating?: number; // 1-3 (1=easy, 2=just right, 3=hard)
  quality_rating?: number; // 1-5
  notes?: string;
  final_intensity_multiplier?: number; // 0.50–1.50, default 1.0 (intensity control)
  session_type?: 'preset' | 'custom' | 'smart';
  smart_context?: SmartContextSnapshot;
}

/**
 * Safety questionnaire answers
 */
export interface SafetyQuestionnaireAnswers {
  epilepsy: boolean;
  pregnancy: boolean;
  cardiovascular: boolean;
  asthma: boolean;
}

// =====================================================
// SMART CVIČENÍ TYPES
// =====================================================

/**
 * Duration mode preference stored in sessionSettingsStore.
 * fixed: exact seconds (300–900)
 * range: algorithmic selection within short/medium/long preset ranges
 */
export type SmartDurationMode =
  | { type: 'fixed'; seconds: number }
  | { type: 'range'; preset: 'short' | 'medium' | 'long' };

/**
 * Time context derived from device clock (new Date().getHours())
 */
export type SmartTimeContext = 'morning' | 'day' | 'evening' | 'night';

/**
 * Multi-phase profile for SMART session
 */
export type SmartPhaseProfile = 'standard' | 'dynamic_day' | 'evening_humming';

/**
 * Complete SMART session configuration — output of BIE computeSmartSession().
 * Passed from SmartExerciseButton → DnesPage → SessionEngineModal as smartConfig prop.
 */
export interface SmartSessionConfig {
  /** Level index 1–21 into BREATH_LEVELS scale */
  level: number;
  /** Base breathing pattern (holdInhale is always 0) */
  basePattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: 0;
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  };
  /** Total resolved duration in seconds */
  totalDurationSeconds: number;
  /** Multi-phase profile used */
  phaseProfile: SmartPhaseProfile;
  /** Time context at computation time */
  timeContext: SmartTimeContext;
  /** Number of completed SMART sessions (for calibration UI) */
  sessionCountSmart: number;
  /** Confidence score 0.0–1.0 */
  confidenceScore: number;
  /** True if sessionCountSmart < 10 */
  isCalibrating: boolean;
  /** True if loaded from cache (recalculate_after > now) */
  cacheValid: boolean;
}

/**
 * SMART context snapshot saved into exercise_sessions.smart_context JSONB.
 * Provides full audit trail for future AI COACH analysis.
 */
export interface SmartContextSnapshot {
  level: number;
  base_rhythm: {
    inhale: number;
    hold_inhale: 0;
    exhale: number;
    hold_exhale: number;
  };
  phase_profile: SmartPhaseProfile;
  time_context: SmartTimeContext;
  /** KP value in seconds at session start (null if no measurement) */
  kp_at_session: number | null;
  total_duration_seconds: number;
  confidence_score_at_start: number;
  session_count_at_start: number;
  phase_breakdown: Array<{
    order: number;
    duration_seconds: number;
    multiplier: number;
    type?: 'silence';
  }>;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Exercise with ownership check
 */
export interface ExerciseWithAccess extends Exercise {
  can_access: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

/**
 * Session with exercise details (for history display)
 */
export interface SessionWithExercise extends ExerciseSession {
  exercise: Pick<Exercise, 'id' | 'name' | 'total_duration_seconds' | 'difficulty'> | null;
}
