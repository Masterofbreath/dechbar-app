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
  // Why window.scrollTo doesn't work here: our app scrolls .app-layout__content,
  // not body/html. iOS WebKit ignores scrollTo() on a non-scrollable root element.
  //
  // Fix: Force a style mutation on the fixed element itself — toggling a no-op CSS
  // property (translateZ(0) → translateZ(0.001px) → back) forces iOS WebKit to
  // invalidate and recompose the fixed-position layer with correct viewport metrics.
  //
  // visualViewport resize listener catches the async case (slow devices / heavy bundle).
  useEffect(() => {
    const forceRecomposite = () => {
      // Query the BottomNav directly (rendered via portal into body)
      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      if (!nav) return;
      // Toggling will-change forces a compositing layer refresh in iOS WebKit
      nav.style.willChange = 'transform';
      requestAnimationFrame(() => {
        nav.style.willChange = '';
      });
    };

    // Double-rAF: waits for 2nd paint cycle when iOS has finalized safe-area metrics
    requestAnimationFrame(() => requestAnimationFrame(forceRecomposite));

    // Fallback timeouts for slower devices / deferred safe-area calculation
    const t1 = setTimeout(forceRecomposite, 200);
    const t2 = setTimeout(forceRecomposite, 500);

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
