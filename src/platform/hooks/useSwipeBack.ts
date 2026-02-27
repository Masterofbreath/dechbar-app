/**
 * useSwipeBack — horizontal swipe-right gesture to trigger navigate(-1).
 *
 * Detects a right swipe starting from the left edge of the screen (within 40px).
 * Edge-swipe matches native iOS "back" gesture feel.
 *
 * Usage:
 *   const ref = useSwipeBack();
 *   <div ref={ref} ...>
 *
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const EDGE_THRESHOLD = 40;   // px from left edge to start swipe
const MIN_DISTANCE   = 60;   // px minimum horizontal travel to trigger
const MAX_VERTICAL   = 80;   // px max vertical drift (distinguish from scroll)

export function useSwipeBack<T extends HTMLElement = HTMLDivElement>() {
  const navigate = useNavigate();
  const ref = useRef<T>(null);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= EDGE_THRESHOLD) {
      startX.current = touch.clientX;
      startY.current = touch.clientY;
    } else {
      startX.current = null;
      startY.current = null;
    }
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (startX.current === null || startY.current === null) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = Math.abs(touch.clientY - startY.current);

    if (dx >= MIN_DISTANCE && dy <= MAX_VERTICAL) {
      navigate(-1);
    }

    startX.current = null;
    startY.current = null;
  }, [navigate]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchEnd]);

  return ref;
}
