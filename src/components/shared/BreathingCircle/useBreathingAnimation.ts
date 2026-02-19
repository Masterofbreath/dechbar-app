/**
 * useBreathingAnimation - RAF-based breathing circle animation
 * 
 * Manages requestAnimationFrame-based breathing circle scaling
 * with cubic-bezier easing
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/BreathingCircle
 */

import { useRef, useCallback } from 'react';

export function useBreathingAnimation() {
  const circleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const animateBreathingCircle = useCallback((
    type: 'inhale' | 'exhale',
    durationMs: number
  ) => {
    
    if (!circleRef.current) {
      return;
    }
    
    // Cancel previous animation first
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const startTime = performance.now();
    const startScale = type === 'inhale' ? 1.0 : 1.5;
    const endScale = type === 'inhale' ? 1.5 : 1.0;
    
    // Cubic-bezier easing (same as CSS ease-in-out)
    const easeInOutCubic = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    
    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeInOutCubic(progress);
      const scale = startScale + (endScale - startScale) * easedProgress;
      
      
      if (circleRef.current) {
        circleRef.current.style.transform = `scale(${scale})`;
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        // Clear ref when complete
        animationFrameRef.current = null;
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);
  
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);
  
  return { circleRef, animateBreathingCircle, cleanup };
}
