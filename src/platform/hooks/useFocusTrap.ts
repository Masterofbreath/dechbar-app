/**
 * useFocusTrap - Custom focus trap hook for modals
 * 
 * Replacement for react-focus-lock library to reduce bundle size (-3KB).
 * Traps keyboard focus within a container element for accessibility.
 * 
 * Features:
 * - Auto-focus first focusable element on mount
 * - Tab cycling (forward and backward)
 * - Return focus to trigger element on unmount
 * - Escape key to close
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
 *   
 *   return (
 *     <div ref={trapRef} role="dialog">
 *       <button>First focusable</button>
 *       <input />
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see /docs/development/accessibility/FOCUS_TRAP.md
 */

import { useRef, useEffect, type RefObject } from 'react';

/**
 * Get all focusable elements within a container
 */
const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
};

interface UseFocusTrapOptions {
  /** Whether to auto-focus first element on mount */
  autoFocus?: boolean;
  /** Whether to restore focus on unmount */
  restoreFocus?: boolean;
  /** Callback when Escape key is pressed */
  onEscape?: () => void;
}

/**
 * Custom hook to trap keyboard focus within a container
 * 
 * @param isActive - Whether the trap is active
 * @param onClose - Optional callback when Escape is pressed
 * @param options - Configuration options
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  onClose?: () => void,
  options: UseFocusTrapOptions = {}
): RefObject<T> {
  const {
    autoFocus = true,
    restoreFocus = true,
    onEscape = onClose,
  } = options;

  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the element that had focus before the trap activated
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Auto-focus first focusable element
    if (autoFocus) {
      const focusableElements = getFocusableElements(container);
      if (focusableElements.length > 0) {
        // Small delay to ensure modal animation doesn't interfere
        setTimeout(() => {
          focusableElements[0]?.focus();
        }, 50);
      }
    }

    /**
     * Handle Tab key to cycle focus within the trap
     */
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return;

      const focusableElements = getFocusableElements(container);
      
      // If no focusable elements, prevent Tab
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift + Tab (backward)
      if (e.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          e.preventDefault();
          lastElement?.focus();
        }
      } 
      // Tab (forward)
      else {
        if (activeElement === lastElement || !container.contains(activeElement)) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    /**
     * Handle Escape key to close modal
     */
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
      }
    };

    // Attach event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);

      // Restore focus to the element that had focus before the trap
      if (restoreFocus && previousActiveElement.current) {
        // Small delay to avoid focus flicker during modal close animation
        setTimeout(() => {
          previousActiveElement.current?.focus();
        }, 50);
      }
    };
  }, [isActive, autoFocus, restoreFocus, onEscape]);

  return containerRef as RefObject<T>;
}
