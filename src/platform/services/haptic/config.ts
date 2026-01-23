/**
 * Haptic Config
 * 
 * Pattern definitions for haptic feedback.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

import type { HapticPattern } from './types';

/**
 * Haptic vibration patterns (in milliseconds)
 * Single number = one vibration
 * Array = pattern with pauses between vibrations
 */
export const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  // Simple patterns
  light: 10,        // Quick tap
  medium: 20,       // Normal feedback
  heavy: 30,        // Strong feedback
  
  // Complex patterns
  success: [10, 50, 10],      // Short-pause-short
  error: [50, 100, 50],        // Long-pause-long
  warning: [20, 80, 20],       // Medium pattern
  notification: [15, 30, 15],  // Quick double-tap
  reward: [10, 30, 10, 30, 20], // Celebration pattern
};

/**
 * Default haptic configuration
 */
export const DEFAULT_HAPTIC_CONFIG = {
  enabled: true,
  intensity: 'medium' as const,
  reducedMotion: false,
  batteryAware: true,
  analytics: true,
};
