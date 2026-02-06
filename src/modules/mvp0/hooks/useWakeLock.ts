/**
 * useWakeLock - Keep Screen On During Session
 * 
 * Prevents device screen from turning off during breathing exercises.
 * Uses Wake Lock API (iOS 16.4+, Android Chrome 84+).
 * 
 * @example
 * ```tsx
 * const wakeLock = useWakeLock();
 * 
 * // Request wake lock when session starts
 * wakeLock.request();
 * 
 * // Release when session ends
 * wakeLock.release();
 * ```
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 * @since 0.3.0
 */

import { useEffect, useRef, useCallback } from 'react';

interface WakeLockAPI {
  /**
   * Request screen wake lock (keep screen on)
   */
  request: () => Promise<void>;
  
  /**
   * Release wake lock (allow screen to sleep)
   */
  release: () => void;
  
  /**
   * Whether wake lock is currently active
   */
  isActive: boolean;
  
  /**
   * Whether Wake Lock API is supported in this browser
   */
  isSupported: boolean;
}

/**
 * Hook to manage screen wake lock during breathing sessions
 */
export function useWakeLock(): WakeLockAPI {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isActiveRef = useRef(false);
  
  // Check if Wake Lock API is supported
  const isSupported = 'wakeLock' in navigator;
  
  /**
   * Request wake lock
   */
  const request = useCallback(async () => {
    if (!isSupported) {
      console.log('[WakeLock] API not supported - screen may turn off');
      return;
    }
    
    try {
      // Request screen wake lock
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      isActiveRef.current = true;
      
      console.log('[WakeLock] Active - screen will stay on');
      
      // Handle wake lock release (e.g., user presses power button)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('[WakeLock] Released - screen may turn off');
        isActiveRef.current = false;
      });
    } catch (err) {
      // Wake lock request failed (e.g., battery saver mode, permissions)
      console.warn('[WakeLock] Request failed:', err);
      isActiveRef.current = false;
    }
  }, [isSupported]);
  
  /**
   * Release wake lock
   */
  const release = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      isActiveRef.current = false;
      
      console.log('[WakeLock] Manually released');
    }
  }, []);
  
  /**
   * Re-request wake lock when page becomes visible again
   * (Wake lock is automatically released when tab hidden)
   */
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActiveRef.current) {
        // Tab became visible again, but wake lock was released
        // Re-request it if we had an active lock before
        await request();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      release(); // Clean up on unmount
    };
  }, [request, release]);
  
  return {
    request,
    release,
    isActive: isActiveRef.current,
    isSupported,
  };
}
