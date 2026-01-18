/**
 * useScrollLock Hook
 * 
 * Global utility for preventing body scroll with scrollbar compensation.
 * Prevents layout shift when modals open by preserving scrollbar space.
 * Also compensates fixed/sticky elements (e.g., headers, navigation).
 * 
 * Usage:
 * ```tsx
 * import { useScrollLock } from '@/platform/hooks';
 * 
 * function MyModal({ isOpen }) {
 *   useScrollLock(isOpen);
 *   // ...
 * }
 * 
 * // Mark fixed elements for compensation:
 * <header data-fixed-element>...</header>
 * ```
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @version 1.1.0
 */

import { useEffect } from 'react';

/**
 * Lock body scroll with scrollbar width compensation
 * Prevents layout shift when modal opens
 * Also compensates fixed/sticky elements marked with data-fixed-element
 * 
 * @param isLocked - Whether scroll should be locked
 * 
 * @example
 * ```tsx
 * // In any modal component
 * function AuthModal({ isOpen }) {
 *   useScrollLock(isOpen);
 *   
 *   return (
 *     <div className="modal-overlay">
 *       {/* modal content *\/}
 *     </div>
 *   );
 * }
 * 
 * // Mark fixed elements for compensation
 * function Header() {
 *   return (
 *     <header data-fixed-element className="landing-header">
 *       {/* header content *\/}
 *     </header>
 *   );
 * }
 * ```
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    // ✅ Calculate scrollbar width
    // (difference between window width and document width)
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // ✅ Store original values for cleanup
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // ✅ Lock scroll + compensate for scrollbar width on body
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // ✅ Find all fixed/sticky elements and compensate them too
    const fixedElements = document.querySelectorAll('[data-fixed-element]');
    const originalPaddings = new Map<Element, string>();
    const originalRights = new Map<Element, string>();
    
    fixedElements.forEach(element => {
      if (element instanceof HTMLElement) {
        const computedStyle = window.getComputedStyle(element);
        const isFixed = computedStyle.position === 'fixed';
        const hasRightZero = computedStyle.right === '0px';
        
        // Store original values for cleanup
        originalPaddings.set(element, element.style.paddingRight);
        originalRights.set(element, element.style.right);
        
        // For fixed elements with right: 0, adjust right position instead of padding
        // This prevents the element from expanding and shifting its content
        if (isFixed && hasRightZero && scrollbarWidth > 0) {
          element.style.right = `${scrollbarWidth}px`;
        } else {
          // For other fixed/sticky elements, use padding compensation
          element.style.paddingRight = `${scrollbarWidth}px`;
        }
      }
    });

    // ✅ Cleanup on unmount or when isLocked changes to false
    return () => {
      // Restore body styles
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      
      // Restore fixed elements styles
      fixedElements.forEach(element => {
        if (element instanceof HTMLElement) {
          const originalPadding = originalPaddings.get(element);
          const originalRight = originalRights.get(element);
          
          element.style.paddingRight = originalPadding || '';
          element.style.right = originalRight || '';
        }
      });
    };
  }, [isLocked]);
}
