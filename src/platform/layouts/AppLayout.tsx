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

  // iOS PWA fix: BottomNav gap při prvním spuštění PWA.
  //
  // Root cause: iOS WebKit pozicuje position:fixed elementy vůči "large viewport"
  // (před finalizací safe-area insets). Gap zmizí AŽ po prvním scroll eventu —
  // scroll event triggeruje rekomposici fixed-position layerů se správnými metrikami.
  //
  // Proč CSS transform:translateZ(0) nestačí: vytváří compositing layer, ale
  // neaktualizuje souřadnice fixed elementu — to se děje pouze po scroll eventu
  // na scrollovatelném kontejneru nebo po visualViewport resize.
  //
  // Fix: dispatchovat nativní scroll event přímo na .app-layout__content
  // (ten skutečný scrollovatelný element v naší app, ne body/html).
  // scrollTop = 1 → 0 simuluje přesně to, co udělá uživatel → iOS rekomponuje.
  useEffect(() => {
    const fixBottomNav = () => {
      const content = document.querySelector<HTMLElement>('.app-layout__content');
      if (!content) return;
      const prev = content.scrollTop;
      content.scrollTop = prev + 1;
      requestAnimationFrame(() => {
        content.scrollTop = prev;
      });
    };

    // Double-rAF: 2. paint cycle kdy iOS finalizuje safe-area metriky
    requestAnimationFrame(() => requestAnimationFrame(fixBottomNav));

    // Pojistka: visualViewport resize = iOS finalizuje viewport asynchronně
    const vv = window.visualViewport;
    vv?.addEventListener('resize', fixBottomNav, { once: true });

    // Timeout fallback pro pomalá zařízení
    const t = setTimeout(fixBottomNav, 300);

    return () => {
      clearTimeout(t);
      vv?.removeEventListener('resize', fixBottomNav);
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
