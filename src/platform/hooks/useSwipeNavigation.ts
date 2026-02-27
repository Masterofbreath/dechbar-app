/**
 * useSwipeNavigation — Carousel-style horizontal swipe between bottom nav tabs.
 *
 * Returns live `dragOffset` (px) and `isDragging` flag so the caller
 * can drive a CSS carousel transform in real time.
 *
 * Gesture behaviour:
 *   - touchmove → live translateX on the carousel track (60 fps via rAF)
 *   - touchend  → if |dragOffset| > MIN_HORIZONTAL: snap to next/prev tab
 *                 otherwise: snap back to current tab
 *   - Edges: rubber-band resistance (0.2×) when at first/last tab
 *   - Vertical scroll is NOT interrupted — direction lock after first 6px
 *
 * Safety guards:
 *   - Left-edge (≤ 40px) reserved for useSwipeBack
 *   - Blocked during immersive-mode (active session)
 *   - Blocked when any modal/overlay is open
 *
 * Usage:
 *   const { ref, dragOffset, isDragging } = useSwipeNavigation<HTMLDivElement>();
 *
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigation, type NavTab } from '@/platform/hooks';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';
import { useAkademiePrefetch } from '@/modules/akademie/hooks/useAkademiePrefetch';
import { useAuth } from '@/platform/auth';
import { useHaptic } from '@/platform/services/haptic';

export const NAV_ORDER: NavTab[] = ['dnes', 'cvicit', 'akademie', 'pokrok'];

const MIN_HORIZONTAL  = 50;   // px drag distance required to commit to tab switch
const EDGE_RUBBER     = 0.20; // resistance factor when at first/last tab
const EDGE_EXCLUDE    = 40;   // px from left edge (reserved for useSwipeBack)
const DIRECTION_LOCK  = 6;    // px before we decide horizontal vs. vertical

export interface UseSwipeNavigationReturn<T extends HTMLElement> {
  ref: React.RefObject<T>;
  dragOffset: number;
  isDragging: boolean;
}

export function useSwipeNavigation<T extends HTMLElement = HTMLDivElement>(): UseSwipeNavigationReturn<T> {
  const {
    currentTab,
    setCurrentTab,
    isNotificationsOpen,
    isSettingsOpen,
    isProfileOpen,
    isKPDetailOpen,
    isExerciseCreatorOpen,
  } = useNavigation();
  const resetAkademie = useAkademieNav((s) => s.reset);
  const { prefetchAll }  = useAkademiePrefetch();
  const { user }         = useAuth();
  const { trigger }      = useHaptic();

  const ref = useRef<T>(null);

  // Render-triggering state (drives the carousel transform)
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Refs for values read inside native event handlers (avoid stale closures)
  const startX         = useRef<number | null>(null);
  const startY         = useRef<number | null>(null);
  const isHorizontal   = useRef<boolean | null>(null); // null = undecided
  const dragOffsetRef  = useRef(0);                    // mirrors dragOffset state
  const rafRef         = useRef<number | null>(null);  // rAF throttle handle

  const currentTabRef = useRef(currentTab);
  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);

  const anyModalOpenRef = useRef(false);
  useEffect(() => {
    anyModalOpenRef.current =
      isNotificationsOpen || isSettingsOpen || isProfileOpen ||
      isKPDetailOpen || isExerciseCreatorOpen;
  }, [isNotificationsOpen, isSettingsOpen, isProfileOpen, isKPDetailOpen, isExerciseCreatorOpen]);

  const navigateToTab = useCallback((tab: NavTab) => {
    if (tab === currentTabRef.current) return;
    if (tab === 'akademie') {
      resetAkademie();
      prefetchAll(user?.id);
    }
    trigger('medium');
    setCurrentTab(tab);
  }, [setCurrentTab, resetAkademie, prefetchAll, user, trigger]);

  // ── Event handlers ────────────────────────────────────────────────────────

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (document.body.classList.contains('immersive-mode')) return;
    if (anyModalOpenRef.current) return;

    const touch = e.touches[0];
    // Left edge reserved for useSwipeBack (native back gesture feel)
    if (touch.clientX <= EDGE_EXCLUDE) return;

    startX.current       = touch.clientX;
    startY.current       = touch.clientY;
    isHorizontal.current = null;
    setIsDragging(true);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    if (anyModalOpenRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startX.current;
    const dy = Math.abs(touch.clientY - startY.current);

    // Direction lock: decide horizontal vs. vertical after first meaningful movement
    if (isHorizontal.current === null && (Math.abs(dx) > DIRECTION_LOCK || dy > DIRECTION_LOCK)) {
      isHorizontal.current = Math.abs(dx) > dy;
    }

    // Vertical scroll — do not intercept
    if (isHorizontal.current === false) return;
    if (isHorizontal.current === null)  return; // still deciding

    // Prevent vertical scroll while swiping horizontally
    e.preventDefault();

    // Rubber-band resistance at edges (can't drag past first/last tab)
    const currentIndex = NAV_ORDER.indexOf(currentTabRef.current);
    const atStart  = currentIndex === 0;
    const atEnd    = currentIndex === NAV_ORDER.length - 1;
    const resistedDx =
      (dx > 0 && atStart) || (dx < 0 && atEnd)
        ? dx * EDGE_RUBBER
        : dx;

    // Throttle React state updates to animation frame (prevents over-rendering)
    dragOffsetRef.current = resistedDx;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDragOffset(resistedDx);
    });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (startX.current === null) return;

    const currentDx = dragOffsetRef.current;
    startX.current       = null;
    startY.current       = null;
    isHorizontal.current = null;
    dragOffsetRef.current = 0;

    // Always turn off dragging — CSS transition kicks in
    setIsDragging(false);

    const currentIndex = NAV_ORDER.indexOf(currentTabRef.current);

    if (currentDx < -MIN_HORIZONTAL && currentIndex < NAV_ORDER.length - 1) {
      // Swipe LEFT → advance to next tab; React batches setDragOffset(0) + setCurrentTab
      navigateToTab(NAV_ORDER[currentIndex + 1]);
    } else if (currentDx > MIN_HORIZONTAL && currentIndex > 0) {
      // Swipe RIGHT → go to previous tab
      navigateToTab(NAV_ORDER[currentIndex - 1]);
    }

    // Reset offset (snaps back to current or new tab position via CSS transition)
    setDragOffset(0);
  }, [navigateToTab]);

  // ── Attach listeners ──────────────────────────────────────────────────────

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    // passive: false required to call e.preventDefault() in touchmove
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    el.addEventListener('touchcancel', onTouchEnd,  { passive: true });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return { ref, dragOffset, isDragging };
}
