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
  useEffect(() => {
    const setAppHeight = (label: string) => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      const prev = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--app-height') || '0'
      );
      document.documentElement.style.setProperty('--app-height', `${h}px`);

      // DIAGNOSTIKA
      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      const navRect = nav?.getBoundingClientRect();
      const vv = window.visualViewport;
      console.group(`[AppHeight diag] useEffect → ${label}`);
      console.log('T (ms since nav)       :', Math.round(performance.now()));
      console.log('--app-height set to    :', `${h}px`);
      console.log('delta from inline/prev :', `${Math.round((h - prev) * 10) / 10}px ← if nonzero, timing issue!`);
      console.log('visualViewport.height  :', vv?.height ?? 'N/A');
      console.log('window.innerHeight     :', window.innerHeight);
      console.log('isPWA standalone       :', window.matchMedia('(display-mode: standalone)').matches);
      if (nav && navRect) {
        const gap = window.innerHeight - navRect.bottom;
        console.log('BottomNav rect.bottom  :', Math.round(navRect.bottom), `(gap below: ${Math.round(gap)}px) ← should be ~0`);
        console.log('BottomNav rect.height  :', Math.round(navRect.height));
        if (Math.abs(gap) > 2) {
          console.warn('⚠️  BottomNav gap DETECTED:', Math.round(gap) + 'px below viewport bottom!');
        } else {
          console.log('✅ BottomNav position OK');
        }
      } else {
        console.log('BottomNav DOM          : not found yet');
      }
      console.groupEnd();
    };

    setAppHeight('mount (sync)');
    requestAnimationFrame(() => setAppHeight('rAF after mount'));

    const vv = window.visualViewport;
    vv?.addEventListener('resize', () => setAppHeight('visualViewport resize'));
    window.addEventListener('orientationchange', () => setAppHeight('orientationchange'));

    return () => {
      vv?.removeEventListener('resize', () => setAppHeight('visualViewport resize'));
      window.removeEventListener('orientationchange', () => setAppHeight('orientationchange'));
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
