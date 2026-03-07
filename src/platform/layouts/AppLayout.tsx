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

  // iOS PWA fix: při cold-start PWA iOS WebKit nejprve renderuje layout s "large viewport"
  // (safe-area insets = 0), teprve po chvíli finalizuje skutečné hodnoty safe-area.
  // Výsledek: celý .app-layout je o ~safe-area-inset-bottom (34px) kratší než displej
  // a BottomNav visí výše. Po prvním scrollu iOS přepočítá → bug zmizí.
  //
  // Fix: --app-height CSS proměnná nastavená ze window.visualViewport.height.
  // visualViewport API vrací OKAMŽITĚ správnou výšku bez toolbarů (=skutečná dostupná výška).
  // Tuto proměnnou pak používáme místo 100dvh/100vh na .app-layout.
  // Při každé změně viewportu (rotace, keyboard) hodnotu aktualizujeme.
  // iOS PWA fix: --app-height = window.innerHeight, aktualizováno při každé změně.
  // BottomNav (position:fixed; bottom:0) sedí vždy na spodku innerHeight.
  // .app-layout potřebuje min-height = innerHeight aby nevznikal prázdný pruh.
  // Na iOS PWA se innerHeight mění při toolbar animaci → trackujeme maximum.
  useEffect(() => {
    let maxH = window.innerHeight;

    const update = () => {
      const h = window.innerHeight;
      // Zachovej maximum — iOS toolbar animace přechodně sníží innerHeight,
      // nechceme layout zmenšovat a pak zvětšovat (flicker).
      if (h > maxH) maxH = h;
      document.documentElement.style.setProperty('--app-height', `${maxH}px`);

      // Diagnostika — odstraň až bug vyřešen
      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      const rect = nav?.getBoundingClientRect();
      const gap = rect ? h - rect.bottom : null;
      console.log(`[AppHeight] innerH=${h} maxH=${maxH} navBottom=${rect ? Math.round(rect.bottom) : 'N/A'} gap=${gap !== null ? Math.round(gap) : 'N/A'}px`);
    };

    update();
    requestAnimationFrame(update);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', () => {
      maxH = 0; // Reset max při rotaci — nová orientace = nové dimenze
      update();
    });

    return () => {
      vv?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
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
