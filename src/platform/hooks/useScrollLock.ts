/**
 * useScrollLock Hook
 * 
 * Prevents the scrollable content area from scrolling while a modal is open.
 * 
 * ⚠️ iOS WebKit CRITICAL: We intentionally lock `.app-layout__content` (the actual
 * scrollable element) instead of `document.body`. Setting `body.style.overflow = 'hidden'`
 * causes an iOS WebKit bug: body becomes a scroll container, and `position: fixed`
 * elements (including the Portal BottomNav — direct child of body) get repositioned
 * relative to body's scroll area instead of the viewport. When overflow is restored,
 * iOS has a stale paint → BottomNav shows with a gap until the user scrolls.
 * 
 * By locking the content element directly, body overflow is never touched and
 * the Portal BottomNav always stays at the correct viewport-relative position.
 * 
 * Usage:
 * ```tsx
 * import { useScrollLock } from '@/platform/hooks';
 * 
 * function MyModal({ isOpen }) {
 *   useScrollLock(isOpen);
 * }
 * ```
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @version 2.0.0
 */

import { useEffect } from 'react';

/**
 * Lock the app content scroll area while a modal is open.
 * Targets `.app-layout__content` — the actual scrollable container.
 * Never touches document.body to avoid iOS WebKit fixed-positioning bugs.
 * 
 * @param isLocked - Whether scroll should be locked
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // Target the actual scrollable element, not body
    const contentEl = document.querySelector<HTMLElement>('.app-layout__content');

    if (!contentEl) {
      // Fallback: no content element found — do nothing (better than touching body)
      return;
    }

    const originalOverflow = contentEl.style.overflow;

    // Lock the content scroll area
    contentEl.style.overflow = 'hidden';

    return () => {
      contentEl.style.overflow = originalOverflow;
    };
  }, [isLocked]);
}
