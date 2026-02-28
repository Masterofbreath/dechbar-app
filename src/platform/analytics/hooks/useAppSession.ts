/**
 * useAppSession — App Open Tracking Hook
 *
 * Logs a single 'app_open' event to user_activity_log on mount.
 * Used for DAU Level 1 tracking.
 *
 * Design:
 *  - Runs exactly once per AppLayout mount (useRef deduplication)
 *  - Fire-and-forget — never blocks render
 *  - Platform detected via Capacitor (fallback to 'web')
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { useEffect, useRef } from 'react';
import { logAppOpen } from '../client';
import type { Platform } from '../types';

function detectPlatform(): Platform {
  try {
    // Dynamic import to avoid build errors in non-Capacitor envs
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Capacitor } = require('@capacitor/core');
    const p = Capacitor.getPlatform() as string;
    if (p === 'ios' || p === 'android') return p;
  } catch {
    // Capacitor not available — web env
  }
  return 'web';
}

interface UseAppSessionOptions {
  userId?: string;
}

/**
 * Call once in AppLayout to log app_open for authenticated user.
 * No return value — purely a side-effect hook.
 */
export function useAppSession({ userId }: UseAppSessionOptions): void {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!userId || firedRef.current) return;
    firedRef.current = true;

    const platform = detectPlatform();
    logAppOpen(userId, platform);
  }, [userId]);
}
