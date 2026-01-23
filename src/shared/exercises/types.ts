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

/**
 * Minimal Exercise interface for Demo
 * Compatible with MVp0's full Exercise type
 */
export interface Exercise {
  id: string;
  name: string;
  duration: number; // seconds (alias for total_duration_seconds)
  description?: string;
  category: ExerciseCategory;
  subcategory?: ExerciseSubcategory;
  difficulty?: ExerciseDifficulty;
  tags?: string[];
  icon?: string;
  locked?: boolean; // For demo: indicates SMART tier required
  
  // MVp0 compatibility fields (optional for demo)
  total_duration_seconds?: number;
  phase_count?: number;
  breathing_pattern?: {
    version: string;
    type: string;
    phases: Array<{
      order: number;
      type: string;
      name: string;
      description: string;
      pattern: {
        inhale_seconds: number;
        hold_after_inhale_seconds: number;
        exhale_seconds: number;
        hold_after_exhale_seconds: number;
      };
      duration_seconds: number;
      cycles_count: number;
    }>;
    metadata: {
      total_duration_seconds: number;
      phase_count: number;
      difficulty: string;
      tags: string[];
    };
  };
  created_by?: string | null;
  is_public?: boolean;
  required_tier?: string | null;
  contraindications?: string[];
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BreathingPattern {
  inhale_seconds: number;
  hold_after_inhale_seconds: number;
  exhale_seconds: number;
  hold_after_exhale_seconds: number;
}
