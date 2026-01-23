/**
 * useSwipeToDismiss Hook
 * 
 * iOS-style swipe-down-to-dismiss gesture for modals.
 * Tracks touch events, threshold, and provides transform styles.
 * 
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

import { useState, useCallback, type CSSProperties } from 'react';
import { useHaptic } from '@/platform/services/haptic';

export interface UseSwipeToDismissOptions {
  onDismiss: () => void;
  threshold?: number; // pixels to swipe down to dismiss (default 100)
  enabled?: boolean; // default true
  direction?: 'down' | 'up'; // default 'down'
}

/**
 * useSwipeToDismiss - Swipe gesture for dismissing modals
 * 
 * @example
 * const { handlers, style } = useSwipeToDismiss({ onDismiss: handleClose });
 * <div {...handlers} style={style}>Modal content</div>
 */
export function useSwipeToDismiss(options: UseSwipeToDismissOptions) {
  const { onDismiss, threshold = 100, enabled = true, direction = 'down' } = options;
  const { trigger } = useHaptic();
  
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, [enabled]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !enabled) return;
    const deltaY = e.touches[0].clientY - startY;
    
    // Only allow swipes in specified direction
    if (direction === 'down' && deltaY > 0) {
      setCurrentY(deltaY);
    } else if (direction === 'up' && deltaY < 0) {
      setCurrentY(Math.abs(deltaY));
    }
  }, [isDragging, startY, enabled, direction]);
  
  const handleTouchEnd = useCallback(() => {
    if (!enabled) return;
    
    // Check if threshold exceeded
    if (currentY > threshold) {
      // Haptic feedback on dismiss
      trigger('heavy');
      onDismiss();
    }
    
    // Reset state
    setIsDragging(false);
    setCurrentY(0);
  }, [currentY, threshold, enabled, onDismiss, trigger]);
  
  // Transform style based on current drag position
  const style: CSSProperties = {
    transform: `translateY(${direction === 'down' ? currentY : -currentY}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
  };
  
  return {
    isDragging,
    currentY,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    style,
  };
}
