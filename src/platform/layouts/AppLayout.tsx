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

  // iOS PWA fix: visualViewport resize listener jako pojistka pro případ,
  // kdy iOS finalizuje safe-area metriky asynchronně po prvním renderu.
  // Primární fix je CSS transform:translateZ(0) na .bottom-nav (bottom-nav.css).
  useEffect(() => {
    const forceRecomposite = () => {
      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      if (!nav) return;
      nav.style.willChange = 'transform';
      requestAnimationFrame(() => { nav.style.willChange = ''; });
    };

    // visualViewport fires when iOS finalizes viewport dimensions asynchronously
    const vv = window.visualViewport;
    vv?.addEventListener('resize', forceRecomposite, { once: true });

    // Single timeout fallback — pomalá zařízení / heavy bundle
    const t = setTimeout(forceRecomposite, 300);

    return () => {
      clearTimeout(t);
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
