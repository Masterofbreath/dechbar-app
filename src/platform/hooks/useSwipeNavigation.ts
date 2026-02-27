/**
 * useSwipeNavigation — horizontal swipe to navigate between bottom nav tabs.
 *
 * Swipe LEFT  → next tab  (dnes → cvicit → akademie → pokrok)
 * Swipe RIGHT → prev tab  (pokrok → akademie → cvicit → dnes)
 *
 * Safety guards:
 * - Excludes left-edge swipe (≤ 40px) — reserved for useSwipeBack
 * - Blocks during immersive mode (active session)
 * - Blocks when any modal/overlay is open
 *
 * Usage:
 *   const ref = useSwipeNavigation<HTMLDivElement>();
 *   <div ref={ref} ...>
 *
 * @package DechBar_App
 * @subpackage Platform/Hooks
 */

import { useRef, useEffect, useCallback } from 'react';
import { useNavigation, type NavTab } from '@/platform/hooks';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';
import { useAkademiePrefetch } from '@/modules/akademie/hooks/useAkademiePrefetch';
import { useAuth } from '@/platform/auth';
import { useHaptic } from '@/platform/services/haptic';

const NAV_ORDER: NavTab[] = ['dnes', 'cvicit', 'akademie', 'pokrok'];

const MIN_HORIZONTAL = 60;  // px horizontal distance to trigger
const MAX_VERTICAL   = 80;  // px max vertical drift (distinguish from scroll)
const EDGE_EXCLUDE   = 40;  // px from left edge (reserved for useSwipeBack)

export function useSwipeNavigation<T extends HTMLElement = HTMLDivElement>() {
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
  const { prefetchAll } = useAkademiePrefetch();
  const { user } = useAuth();
  const { trigger } = useHaptic();

  const ref = useRef<T>(null);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  // Stable refs for values read inside native event handlers (avoids stale closures)
  const currentTabRef = useRef(currentTab);
  useEffect(() => { currentTabRef.current = currentTab; }, [currentTab]);

  const anyModalOpenRef = useRef(false);
  useEffect(() => {
    anyModalOpenRef.current =
      isNotificationsOpen ||
      isSettingsOpen ||
      isProfileOpen ||
      isKPDetailOpen ||
      isExerciseCreatorOpen;
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

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (document.body.classList.contains('immersive-mode')) return;
    if (anyModalOpenRef.current) return;

    const touch = e.touches[0];
    // Left edge is reserved for useSwipeBack (swipe-right-to-go-back)
    if (touch.clientX <= EDGE_EXCLUDE) {
      startX.current = null;
      return;
    }

    startX.current = touch.clientX;
    startY.current = touch.clientY;
  }, []);

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (startX.current === null || startY.current === null) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX.current;
    const dy = Math.abs(touch.clientY - startY.current);

    startX.current = null;
    startY.current = null;

    if (Math.abs(dx) < MIN_HORIZONTAL || dy > MAX_VERTICAL) return;

    const currentIndex = NAV_ORDER.indexOf(currentTabRef.current);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < NAV_ORDER.length - 1) {
      // Swipe LEFT → next tab
      navigateToTab(NAV_ORDER[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe RIGHT → previous tab
      navigateToTab(NAV_ORDER[currentIndex - 1]);
    }
  }, [navigateToTab]);

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
