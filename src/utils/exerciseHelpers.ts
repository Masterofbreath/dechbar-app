/**
 * Exercise Helper Utilities
 * 
 * Temporary helpers for exercise type detection until DB migration in v2.0
 * 
 * @package DechBar_App
 * @subpackage Utils
 */

import type { Exercise } from '@/modules/mvp0/types/exercises';

/**
 * Preset protocol identifiers
 * These are admin-created protocols shown on Dnes page
 * 
 * @todo v2.0: Replace with exercise.type === 'protocol' after DB migration
 */
const PRESET_PROTOCOL_NAMES = ['RÁNO', 'RESET', 'NOC'] as const;

/**
 * Check if exercise is a preset protocol
 * 
 * Protocols are special admin-created exercises shown on Dnes page
 * with direct countdown start and protocol description display.
 * 
 * @param exercise - Exercise to check
 * @returns True if exercise is RÁNO, RESET, or NOC protocol
 * 
 * @example
 * if (isProtocol(exercise)) {
 *   // Show protocol description in countdown
 * } else {
 *   // Show breathing tips in countdown
 * }
 */
export function isProtocol(exercise: Exercise): boolean {
  return PRESET_PROTOCOL_NAMES.includes(exercise.name as any);
}

/**
 * Get exercise type label for UI display
 * 
 * @param exercise - Exercise to get type for
 * @returns Human-readable type label
 */
export function getExerciseTypeLabel(exercise: Exercise): string {
  if (isProtocol(exercise)) {
    return 'Protokol';
  }
  
  return exercise.category === 'custom' ? 'Vlastní cvičení' : 'Cvičení';
}
