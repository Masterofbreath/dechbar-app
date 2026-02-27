/**
 * useReferralCapture — Global Referral URL Capture Hook
 *
 * Runs ONCE on app mount in RootLayout.
 * Reads `?ref=XXXXXX` from the current URL and stores it in localStorage.
 *
 * Works for ALL pages — current and future — because RootLayout wraps everything.
 * No need to add anything to individual pages ever.
 *
 * Examples of URLs that get tracked:
 *   https://www.dechbar.cz/?ref=847293
 *   https://www.dechbar.cz/vyzva?ref=847293
 *   https://www.dechbar.cz/digitalni-ticho?ref=847293
 *   https://app.zdravedychej.cz/app?ref=847293  (in-app deep link)
 *   (any future page automatically)
 *
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @since 0.4.1
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureReferralFromUrl } from '@/utils/referral';

/**
 * Hook that captures the referral code from the URL on app mount.
 *
 * CRITICAL — WHY we capture `location.search` at render time (not inside useEffect):
 *
 * React fires effects bottom-up (children before parent). When the index route renders
 * `<Navigate to="/vyzva" replace />`, that component's effect fires FIRST and changes
 * `window.location` from `/?ref=847293` to `/vyzva` (no query params).
 * By the time this hook's effect runs, `window.location.search` is already empty.
 *
 * Solution: Read `location.search` from React Router's context DURING the render phase
 * (synchronous — before any effects run) and pass it to `captureReferralFromUrl()`.
 * The effect closure captures the render-time value, so it's always correct.
 *
 * Usage: Call once in RootLayout.tsx — that's it, forever.
 */
export function useReferralCapture(): void {
  const location = useLocation();

  // Capture search string at RENDER TIME (synchronous, before any child effects fire).
  // This is a plain string — safe to put in useEffect's closure.
  const searchAtMount = location.search;

  useEffect(() => {
    // Pass the render-time search string — NOT window.location.search
    // (window.location may already be changed by a child <Navigate> by now)
    captureReferralFromUrl(searchAtMount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty — capture the initial landing URL only once
}
