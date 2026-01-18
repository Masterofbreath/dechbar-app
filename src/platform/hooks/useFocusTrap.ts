/**
 * useFocusTrap Hook - Focus Trap for Modals
 * 
 * Traps keyboard focus inside a modal/dialog (accessibility).
 * Prevents tabbing outside modal while it's open.
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 * @since 0.2.0
 */

import { useEffect, useRef } from 'react';

/**
 * useFocusTrap - Trap focus inside element
 * 
 * @param isActive - Whether trap is active
 * @returns Ref to attach to container element
 * 
 * @example
 * const trapRef = useFocusTrap(isModalOpen);
 * <div ref={trapRef}>Modal content</div>
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    
    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');
      
      return Array.from(container.querySelectorAll(selectors));
    };
    
    // Handle Tab key
    const handleTab = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Shift + Tab (backwards)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forwards)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    // Listen for Tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        handleTab(e);
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element on mount
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
  
  return containerRef;
}
