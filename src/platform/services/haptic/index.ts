/**
 * Haptic Service - Barrel Export
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

export { default as HapticService } from './HapticService';
export { useHaptic } from './useHaptic';
export { HapticProvider, useHapticContext } from './HapticContext';
export { HAPTIC_PATTERNS, DEFAULT_HAPTIC_CONFIG } from './config';
export type { HapticPattern, HapticConfig } from './types';
