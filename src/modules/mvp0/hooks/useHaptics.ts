/**
 * useHaptics - Haptic Feedback Management
 * 
 * Provides vibration feedback for breathing exercises.
 * Uses Capacitor Haptics API for iOS/Android native platforms.
 * 
 * @example
 * const haptics = useHaptics();
 * haptics.trigger('inhale'); // Vibrate for inhale phase
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useCallback, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNativePlatform } from '../utils/capacitorUtils';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import type { BreathingPhaseAudio, HapticIntensity } from '../types/audio';

interface HapticsAPI {
  /**
   * Trigger haptic feedback for breathing phase
   */
  trigger: (phase: BreathingPhaseAudio) => Promise<void>;
  
  /**
   * Whether haptics are supported on this platform
   */
  isSupported: boolean;
  
  /**
   * Whether haptics are currently enabled
   */
  isEnabled: boolean;
}

/**
 * Hook to manage haptic feedback during breathing sessions
 */
export function useHaptics(): HapticsAPI {
  const { hapticsEnabled, hapticIntensity } = useSessionSettings();
  const isSupported = isNativePlatform; // Only native platforms support haptics
  const lastTriggerRef = useRef<number>(0);
  
  /**
   * Get Capacitor haptic style for intensity setting
   */
  const getHapticStyle = useCallback((intensity: HapticIntensity): ImpactStyle => {
    if (intensity === 'light') return ImpactStyle.Light;
    if (intensity === 'medium') return ImpactStyle.Medium;
    if (intensity === 'heavy') return ImpactStyle.Heavy;
    return ImpactStyle.Medium; // Default fallback
  }, []);
  
  /**
   * Trigger haptic feedback for breathing phase
   */
  const trigger = useCallback(async (phase: BreathingPhaseAudio) => {
    // Guard: Check if enabled & supported
    if (!hapticsEnabled || !isSupported) {
      return;
    }
    
    // Throttle: Prevent duplicate triggers (min 100ms apart)
    const now = Date.now();
    if (now - lastTriggerRef.current < 100) {
      console.log('[Haptics] Throttled (too soon)');
      return;
    }
    lastTriggerRef.current = now;
    
    try {
      const style = getHapticStyle(hapticIntensity);
      
      // Different patterns per phase
      if (phase === 'inhale') {
        // INHALE: 1× tap (200ms)
        await Haptics.impact({ style });
      } else if (phase === 'hold') {
        // HOLD: 2× tap (100ms pause between)
        await Haptics.impact({ style });
        await new Promise(resolve => setTimeout(resolve, 100));
        await Haptics.impact({ style });
      } else if (phase === 'exhale') {
        // EXHALE: 1× long (400ms) - simulate with heavy
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      console.log(`[Haptics] Triggered: ${phase} (${hapticIntensity})`);
    } catch (err) {
      console.error('[Haptics] Error:', err);
    }
  }, [hapticsEnabled, hapticIntensity, isSupported, getHapticStyle]);
  
  return {
    trigger,
    isSupported,
    isEnabled: hapticsEnabled && isSupported,
  };
}
