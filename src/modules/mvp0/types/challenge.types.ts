/**
 * Challenge Types - Březnová Dechová Výzva
 * 
 * Type definitions for 21-day breathing challenge system.
 * Matches Supabase challenge_registrations + challenge_progress schema.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Types
 * @since 0.3.0
 */

// =====================================================
// CORE TYPES
// =====================================================

/**
 * Challenge registration data from database
 */
export interface ChallengeData {
  id: string;
  user_id: string;
  challenge_id: string; // e.g., 'challenge-2026-03'
  email: string;
  kp_value: number;
  conversion_source: string | null;
  magic_link_sent_at: string; // ISO timestamp
  smart_trial_eligible: boolean;
  smart_trial_expires_at: string | null; // ISO timestamp
  created_at: string; // ISO timestamp
  metadata?: {
    kp_value?: number;
    source?: string;
    registered_before_deadline?: boolean;
  };
}

/**
 * Single day progress in challenge
 */
export interface ChallengeDayData {
  id: string;
  user_id: string;
  challenge_id: string;
  day_number: number; // 1-21
  exercise_id: string | null;
  completed_at: string | null; // ISO timestamp
  duration_seconds: number | null;
  created_at: string; // ISO timestamp
}

/**
 * Active challenge status (hook return type)
 */
export interface ActiveChallengeStatus {
  // Challenge data
  challenge: ChallengeData | null;
  
  // Current state
  isActive: boolean; // True if challenge is within time window
  currentDay: number; // 1-21 (calculated from start date)
  completedDays: number; // Count of completed days
  progress: ChallengeDayData[]; // All day progress records
  
  // UI visibility
  isVisible: boolean; // True if admin/CEO OR has active challenge
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
}

/**
 * Challenge time windows (constants)
 */
export interface ChallengeTimeWindow {
  registrationDeadline: Date; // 28.2.2026 23:59
  challengeStart: Date; // 1.3.2026 00:00
  challengeEnd: Date; // 21.3.2026 23:59
}

// =====================================================
// API PAYLOADS
// =====================================================

/**
 * Mark challenge day as completed payload
 */
export interface MarkChallengeDayPayload {
  user_id: string;
  challenge_id: string;
  day_number: number;
  exercise_id: string;
  duration_seconds: number;
}

/**
 * Get challenge progress payload
 */
export interface GetChallengeProgressPayload {
  user_id: string;
  challenge_id: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Challenge day with completion status
 */
export interface ChallengeDayWithStatus {
  day: number;
  isCompleted: boolean;
  completedAt: string | null;
  exerciseId: string | null;
}
