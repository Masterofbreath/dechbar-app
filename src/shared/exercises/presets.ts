/**
 * Preset Exercises - Shared Constants
 * 
 * Single source of truth for preset exercise data.
 * Auto-syncs between MVp0 app and Demo mockup.
 * 
 * IMPORTANT: Any changes here propagate to both Demo and MVp0!
 * - Safe changes: duration, description, tags (auto-sync)
 * - Breaking changes: required fields, renames (need demo update)
 * 
 * @package DechBar_App
 * @subpackage Shared/Exercises
 */

import type { Exercise } from './types';

export const PRESET_EXERCISES: Exercise[] = [
  // ========================================
  // DNES VIEW PROTOCOLS (3 protocols)
  // ========================================
  
  {
    id: 'rano',
    name: 'RÁNO',
    duration: 420, // 7 min
    total_duration_seconds: 420, // MVp0 compatibility
    description: 'Ranní aktivační protokol pro energický start dne',
    category: 'preset' as const,
    subcategory: 'morning' as const,
    difficulty: 'beginner' as const,
    icon: 'sun',
    tags: ['morning', 'energy', 'activation'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Ranní aktivace',
        description: 'Energizující dechový vzor',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 0,
          exhale_seconds: 6,
          hold_after_exhale_seconds: 0
        },
        duration_seconds: 420,
        cycles_count: 42
      }],
      metadata: {
        total_duration_seconds: 420,
        phase_count: 1,
        difficulty: 'beginner',
        tags: ['morning', 'energy', 'activation']
      }
    }
  },
  {
    id: 'reset',
    name: 'RESET',
    duration: 300, // 5 min
    total_duration_seconds: 300, // MVp0 compatibility
    description: 'Reset stresu během dne',
    category: 'preset' as const,
    subcategory: 'stress' as const,
    difficulty: 'beginner' as const,
    icon: 'refresh',
    tags: ['stress', 'calm', 'reset'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Reset stresu',
        description: 'Uklidňující dechový vzor',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 4,
          exhale_seconds: 6,
          hold_after_exhale_seconds: 2
        },
        duration_seconds: 300,
        cycles_count: 19
      }],
      metadata: {
        total_duration_seconds: 300,
        phase_count: 1,
        difficulty: 'beginner',
        tags: ['stress', 'calm', 'reset']
      }
    }
  },
  {
    id: 'noc',
    name: 'NOC',
    duration: 600, // 10 min
    total_duration_seconds: 600, // MVp0 compatibility
    description: 'Večerní relaxační protokol pro kvalitní spánek',
    category: 'preset' as const,
    subcategory: 'evening' as const,
    difficulty: 'beginner' as const,
    icon: 'moon',
    tags: ['evening', 'sleep', 'relaxation'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Večerní relaxace',
        description: 'Relaxační dechový vzor pro spánek',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 0,
          exhale_seconds: 8,
          hold_after_exhale_seconds: 0
        },
        duration_seconds: 600,
        cycles_count: 50
      }],
      metadata: {
        total_duration_seconds: 600,
        phase_count: 1,
        difficulty: 'beginner',
        tags: ['evening', 'sleep', 'relaxation']
      }
    }
  },
  
  // ========================================
  // CVIČIT VIEW EXERCISES (3 free exercises)
  // ========================================
  
  {
    id: 'box',
    name: 'BOX breathing',
    duration: 300, // 5 min
    total_duration_seconds: 300, // MVp0 compatibility
    description: 'Technika 4 | 4 | 4 | 4 pro okamžitou soustředěnost',
    category: 'preset' as const,
    subcategory: 'focus' as const,
    difficulty: 'beginner' as const,
    icon: 'square',
    tags: ['soustředění', 'klid', 'snížení stresu'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Box Breathing',
        description: 'Čtvercový dechový vzor 4-4-4-4',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 4,
          exhale_seconds: 4,
          hold_after_exhale_seconds: 4
        },
        duration_seconds: 300,
        cycles_count: 19
      }],
      metadata: {
        total_duration_seconds: 300,
        phase_count: 1,
        difficulty: 'beginner',
        tags: ['soustředění', 'klid', 'snížení stresu']
      }
    }
  },
  {
    id: 'calm',
    name: 'Uklidnění',
    duration: 420, // 7 min
    total_duration_seconds: 420, // MVp0 compatibility
    description: 'Prodloužený výdech pro rychlé uklidnění',
    category: 'preset' as const,
    subcategory: 'stress' as const,
    difficulty: 'beginner' as const,
    icon: 'meditation', // Meditation icon for calming exercise
    tags: ['klid', 'snížení stresu', 'úleva od úzkosti'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Uklidnění',
        description: 'Klidný dechový vzor',
        pattern: {
          inhale_seconds: 4,
          hold_after_inhale_seconds: 0, // OPRAVENO: z 2 na 0 (match real app)
          exhale_seconds: 6,
          hold_after_exhale_seconds: 0  // OPRAVENO: z 2 na 0 (match real app)
        },
        duration_seconds: 420,
        cycles_count: 30
      }],
      metadata: {
        total_duration_seconds: 420,
        phase_count: 1,
        difficulty: 'beginner',
        tags: ['klid', 'snížení stresu', 'úleva od úzkosti']
      }
    }
  },
  {
    id: 'coherence',
    name: 'Srdeční koherence',
    duration: 300, // 5 min (OPRAVENO z 3 min)
    total_duration_seconds: 300, // MVp0 compatibility (OPRAVENO z 180)
    description: 'Optimální rytmus pro srdeční variabilitu (HRV)',
    category: 'preset' as const,
    subcategory: 'focus' as const,
    difficulty: 'beginner' as const, // OPRAVENO z 'intermediate'
    icon: 'heart',
    tags: ['koherence', 'hrv', 'soustředění'],
    locked: false,
    phase_count: 1,
    // MVp0 required fields
    created_by: null,
    is_public: true,
    required_tier: null,
    deleted_at: null,
    contraindications: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    breathing_pattern: {
      version: '1.0',
      type: 'simple',
      phases: [{
        order: 1,
        type: 'breathing',
        name: 'Srdeční koherence',
        description: 'Harmonizace srdeční variability',
        pattern: {
          inhale_seconds: 5,
          hold_after_inhale_seconds: 0,
          exhale_seconds: 5,
          hold_after_exhale_seconds: 0
        },
        duration_seconds: 300, // OPRAVENO z 180
        cycles_count: 30 // OPRAVENO z 18 (300s / 10s per cycle)
      }],
      metadata: {
        total_duration_seconds: 300, // OPRAVENO z 180
        phase_count: 1,
        difficulty: 'beginner', // OPRAVENO z 'intermediate'
        tags: ['koherence', 'hrv', 'soustředění']
      }
    }
  },
];

/**
 * Get exercise by name (case-insensitive)
 * 
 * @param name Exercise name to find
 * @returns Exercise or undefined
 */
export function getExerciseByName(name: string): Exercise | undefined {
  return PRESET_EXERCISES.find(ex => 
    ex.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get exercises by category
 * 
 * @param category 'preset' or 'custom'
 * @returns Filtered exercises
 */
export function getExercisesByCategory(category: 'preset' | 'custom'): Exercise[] {
  return PRESET_EXERCISES.filter(ex => ex.category === category);
}

/**
 * Get exercises for Dnes view (protocols)
 */
export function getDnesProtocols(): Exercise[] {
  return PRESET_EXERCISES.filter(ex =>
    ['RÁNO', 'RESET', 'NOC'].includes(ex.name)
  );
}

/**
 * Get exercises for Cvičit view
 */
export function getCvicitExercises(): Exercise[] {
  return PRESET_EXERCISES.filter(ex =>
    ['BOX breathing', 'Calm', 'Coherence'].includes(ex.name)
  );
}
