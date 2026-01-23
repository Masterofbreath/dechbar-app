/**
 * Haptic Types
 * 
 * Type definitions for haptic feedback system.
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Haptic
 */

export type HapticPattern = 
  | 'light'        // Button tap, toggle
  | 'medium'       // Tab switch, modal open
  | 'heavy'        // Swipe dismiss, important action
  | 'success'      // Success feedback
  | 'error'        // Error feedback
  | 'warning'      // Warning
  | 'notification' // New notification
  | 'reward';      // Achievement unlocked

export interface HapticConfig {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy';
  reducedMotion: boolean;
  batteryAware: boolean;
  analytics: boolean;
}
