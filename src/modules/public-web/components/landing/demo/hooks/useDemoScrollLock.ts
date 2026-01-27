/**
 * useDemoScrollLock Hook
 * 
 * NO-OP scroll lock for demo mockup context.
 * 
 * Why NO-OP?
 * - Demo mockup is small (375x812px) and lives inside SVG foreignObject
 * - Locking document.body causes iOS Safari bugs (scroll propagation)
 * - Demo has its own overlay → user gets visual feedback
 * - User scrolls the PARENT PAGE, not the demo mockup
 * - No need to prevent scroll since modal is isolated
 * 
 * Usage:
 * ```tsx
 * import { useDemoScrollLock } from '../hooks/useDemoScrollLock';
 * 
 * function DemoModal({ isOpen }) {
 *   useDemoScrollLock(isOpen);  // No-op, safe for foreignObject
 *   // ...
 * }
 * ```
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Hooks
 * @version 1.0.0
 */

/**
 * Scroll lock for demo mockup (no-op implementation)
 * Does NOT lock document.body to avoid iOS Safari foreignObject bugs
 * 
 * @param isLocked - Whether scroll should be locked (ignored)
 * 
 * @example
 * ```tsx
 * // Replace platform useScrollLock with this in demo modals
 * import { useDemoScrollLock } from '../hooks/useDemoScrollLock';
 * 
 * function DemoEmailModal({ isOpen }) {
 *   useDemoScrollLock(isOpen);  // No-op, prevents body scroll lock
 *   
 *   return (
 *     <div className="modal-overlay">
 *       ...modal content...
 *     </div>
 *   );
 * }
 * ```
 */
export function useDemoScrollLock(isLocked: boolean): void {
  // NO-OP implementation
  // Demo mockup doesn't need scroll lock because:
  // 1. User scrolls parent page, not demo mockup
  // 2. Modal overlay provides visual "lock" feedback
  // 3. Locking document.body causes iOS Safari bugs in foreignObject
  // 4. Demo is small (375x812px), no internal scrolling needed
  
  // Explicitly ignore the parameter to satisfy TypeScript
  void isLocked;
  
  // No useEffect, no document.body manipulation
  // Just return immediately
  return;
}
