/**
 * AppLayout - Main Application Layout
 * 
 * Wraps all authenticated app screens with:
 * - TopNav (sticky top)
 * - Content area (scrollable)
 * - BottomNav (fixed bottom)
 * - StickyAudioPlayer (fixed, 60px above BottomNav) ⭐ NEW
 * 
 * Handles iOS/Android safe areas automatically.
 * 
 * @package DechBar_App
 * @subpackage Platform/Layouts
 * @since 0.2.0
 * @updated 2026-02-05 - Added StickyAudioPlayer integration
 */

import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';
import { TopNav } from '../components/navigation/TopNav';
import { BottomNav } from '../components/navigation/BottomNav';
import { StickyAudioPlayer } from '../components/AudioPlayer';
import { TrialExpiryModal } from '../components/TrialExpiryModal/TrialExpiryModal';
import { useAudioPlayerStore } from '../components/AudioPlayer/store';
import { usePlayerBroadcast } from '../components/AudioPlayer/usePlayerBroadcast';
import { useAuthStore } from '@/platform/auth';
import { useAppSession } from '@/platform/analytics';

export interface AppLayoutProps {
  /**
   * Page content
   */
  children: ReactNode;
  
  /**
   * Transparent TOP NAV (for special screens)
   * @default false
   */
  transparentTopNav?: boolean;
  
  /**
   * Hide bottom navigation (for fullscreen modals)
   * @default false
   */
  hideBottomNav?: boolean;
}

/**
 * AppLayout - Main layout wrapper
 * 
 * @example
 * <AppLayout>
 *   <DnesPage />
 * </AppLayout>
 */
export function AppLayout({ 
  children, 
  transparentTopNav = false,
  hideBottomNav = false 
}: AppLayoutProps) {
  const { currentTrack, mode } = useAudioPlayerStore();
  const hasPlayer = !!currentTrack && mode === 'sticky';
  const userId = useAuthStore((s) => s.user?.id);

  // Log app_open event once per mount (DAU Level 1 tracking)
  useAppSession({ userId });

  // Synchronizace přehrávače mezi záložkami ve stejném browseru (BroadcastChannel)
  usePlayerBroadcast();

  // iOS PWA fix: force recompositing of position:fixed layers after first render.
  //
  // Root cause: iOS WebKit initializes the compositing layer for position:fixed
  // elements against the "large viewport" (before safe-area insets are applied).
  // This causes BottomNav to render with a gap above the home indicator.
  // After the first scroll event iOS recomposes → gap disappears.
  //
  // Fix: window.scrollTo(0,1) + scrollTo(0,0) is the only reliable way to trigger
  // a full compositing layer recalculation in iOS WebKit (unlike getBoundingClientRect
  // which only forces a layout reflow, not a compositing update).
  //
  // visualViewport resize listener catches the case where the viewport finalizes
  // its dimensions asynchronously (e.g. slow iOS devices, heavy JS bundle).
  useEffect(() => {
    const forceRecomposite = () => {
      window.scrollTo(0, 1);
      window.scrollTo(0, 0);
    };

    // Double-rAF: waits for 2nd paint cycle when iOS has finalized safe-area metrics
    requestAnimationFrame(() => requestAnimationFrame(forceRecomposite));

    // Fallback timeout for slower devices / deferred safe-area calculation
    const t1 = setTimeout(forceRecomposite, 300);
    const t2 = setTimeout(forceRecomposite, 600);

    // visualViewport fires when iOS finalizes viewport dimensions asynchronously
    const vv = window.visualViewport;
    vv?.addEventListener('resize', forceRecomposite, { once: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      vv?.removeEventListener('resize', forceRecomposite);
    };
  }, []);

  return (
    <div className={`app-layout${hasPlayer ? ' app-layout--has-player' : ''}`}>
      <TopNav transparent={transparentTopNav} />
      
      <main className="app-layout__content" role="main">
        {children}
      </main>
      
      {!hideBottomNav && createPortal(<BottomNav />, document.body)}
      
      {/* Sticky Audio Player (global, shows when track playing) */}
      <StickyAudioPlayer />

      {/* Trial expiry modal — poslední dny trialu / po expiraci */}
      <TrialExpiryModal />
    </div>
  );
}
