/**
 * useShakeLock — Shake-to-screen-off gesture for Trůn sessions
 *
 * Detects a sharp shake (DeviceMotionEvent) and attempts to turn off
 * the screen so the user can pocket the phone after starting a Trůn session.
 *
 * Screen lock strategy (best-effort):
 * 1. screen.orientation.lock('portrait') — locks orientation, triggers screen dimming on some browsers
 * 2. document.documentElement.requestFullscreen() + manual blur — not reliable cross-platform
 * 3. On mobile browsers there is NO reliable JS API to lock the screen.
 *    The most we can do is: show a fullscreen black overlay + tell the user to press the power button.
 *    This still provides a great UX — one shake = "I'm ready, show me the lock hint".
 *
 * Shake detection: 3 direction reversals within 500ms window, acceleration > threshold.
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const SHAKE_THRESHOLD = 15;   // m/s² — min acceleration to count as shake impulse
const SHAKE_COUNT = 3;        // number of threshold crossings needed
const SHAKE_WINDOW_MS = 600;  // window within which all crossings must happen
const COOLDOWN_MS = 3000;     // min ms between shake events (prevent double-fire)

export interface UseShakeLockReturn {
  /** True while the "lock hint overlay" is visible after a shake */
  showLockHint: boolean;
  /** Dismiss the lock hint manually */
  dismissHint: () => void;
  /** Whether DeviceMotion API is available on this device */
  isSupported: boolean;
  /** Request iOS 13+ DeviceMotion permission — call from a user gesture */
  requestPermission: () => Promise<void>;
}

export function useShakeLock(enabled: boolean): UseShakeLockReturn {
  const [showLockHint, setShowLockHint] = useState(false);

  const lastShakeRef = useRef<number>(0);
  const crossingsRef = useRef<number[]>([]);
  const lastAccelRef = useRef<number>(0);
  const permissionAskedRef = useRef(false);

  // Derive isSupported without setState-in-effect — just check at render time
  const isSupported = typeof window !== 'undefined' && 'DeviceMotionEvent' in window;

  const dismissHint = useCallback(() => setShowLockHint(false), []);

  const requestPermission = useCallback(async () => {
    if (permissionAskedRef.current) return;
    permissionAskedRef.current = true;

    // @ts-expect-error — iOS 13+ only API, not in standard TS lib types
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        // @ts-expect-error — iOS 13+ only API, not in standard TS lib types
        const result = await DeviceMotionEvent.requestPermission();
        if (result !== 'granted') return;
      } catch {
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isSupported) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const magnitude = Math.sqrt(
        (acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2
      );

      const now = Date.now();

      if (magnitude > SHAKE_THRESHOLD && magnitude - lastAccelRef.current > SHAKE_THRESHOLD * 0.5) {
        crossingsRef.current.push(now);
        crossingsRef.current = crossingsRef.current.filter(t => now - t < SHAKE_WINDOW_MS);

        if (crossingsRef.current.length >= SHAKE_COUNT) {
          crossingsRef.current = [];
          if (now - lastShakeRef.current > COOLDOWN_MS) {
            lastShakeRef.current = now;
            setShowLockHint(true);
            setTimeout(() => setShowLockHint(false), 5000);
          }
        }
      }

      lastAccelRef.current = magnitude;
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, isSupported]);

  return { showLockHint, dismissHint, isSupported, requestPermission };
}
