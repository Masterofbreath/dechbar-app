/**
 * Shared Exercise Types
 * 
 * Single source of truth for exercise type definitions.
 * Used by: MVp0, Demo, Future modules
 * 
 * Compatible with MVp0 Exercise type (extends with optional fields).
 * 
 * @package DechBar_App
 * @subpackage Shared/Exercises
 */

export type ExerciseCategory = 'preset' | 'custom';
export type ExerciseSubcategory = 'morning' | 'evening' | 'stress' | 'sleep' | 'focus' | 'energy';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type MembershipTier = 'ZDARMA' | 'SMART' | 'AI_COACH';
export type PhaseType = 'breathing' | 'silence';
export type Contraindication = 'epilepsy' | 'pregnancy' | 'cardiovascular' | 'asthma' | 'water_activities';

/**
 * Breathing Pattern (matches MVp0 structure exactly)
 */
export interface BreathingPattern {
  version: string; // "1.0"
  type: 'simple' | 'multi-phase';
  phases: Array<{
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
    cycles_count: number | null;
    instructions?: string;
  }>;
  metadata: {
    total_duration_seconds: number;
    phase_count: number;
    difficulty: ExerciseDifficulty;
    tags: string[];
  };
}

/**
 * Minimal Exercise interface for Demo
 * Compatible with MVp0's full Exercise type
 */
export interface Exercise {
  // Core fields
  id: string;
  name: string;
  description: string | null;
  category: ExerciseCategory;
  subcategory: ExerciseSubcategory | null;
  difficulty: ExerciseDifficulty | null;
  tags: string[];
  
  // MVp0 required fields
  created_by: string | null; // UUID (null = admin preset)
  is_public: boolean;
  required_tier: MembershipTier | null;
  total_duration_seconds: number;
  phase_count: number;
  deleted_at: string | null;
  contraindications: Contraindication[]; // Required empty array for presets
  breathing_pattern: BreathingPattern; // REQUIRED
  created_at: string; // ISO timestamp - REQUIRED
  updated_at: string; // ISO timestamp - REQUIRED
  
  // Demo convenience fields
  duration?: number; // Alias for total_duration_seconds
  icon?: string; // Demo UI only
  locked?: boolean; // Demo UI: indicates SMART tier required
}
