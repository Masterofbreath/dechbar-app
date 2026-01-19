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
}

/**
 * Complete session payload
 */
export interface CompleteSessionPayload {
  exercise_id: string;
  started_at: Date;
  completed_at: Date;
  was_completed: boolean;
  mood_before?: MoodType;
  mood_after?: MoodType;
  difficulty_rating?: number; // 1-3 (1=easy, 2=just right, 3=hard)
  quality_rating?: number; // 1-5
  notes?: string;
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
