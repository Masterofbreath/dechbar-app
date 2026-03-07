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
    const snap = (label: string) => {
      const vv = window.visualViewport;
      // vv.offsetTop je záporný na iOS PWA (viewport posunutý nahoru o safe-area-inset-bottom).
      // Správná použitelná výška = height + offsetTop.
      const h = vv
        ? Math.round(vv.height + (vv.offsetTop ?? 0))
        : window.innerHeight;
      const prev = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--app-height') || '0'
      );
      document.documentElement.style.setProperty('--app-height', `${h}px`);

      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      const navRect = nav?.getBoundingClientRect();
      const gap = navRect ? window.innerHeight - navRect.bottom : null;

      console.group(`[AppHeight] ${label}`);
      console.log('vv.height    :', vv?.height ?? 'N/A');
      console.log('vv.offsetTop :', vv?.offsetTop ?? 'N/A');
      console.log('--app-height :', `${h}px  (delta: ${Math.round((h - prev) * 10) / 10}px)`);
      console.log('innerHeight  :', window.innerHeight);
      console.log('screen.h     :', screen.height);
      if (navRect) {
        console.log('nav.bottom   :', Math.round(navRect.bottom), `gap: ${Math.round(gap ?? 0)}px`);
        if (gap !== null && Math.abs(gap) > 2) {
          console.warn(`⚠️  gap ${Math.round(gap)}px`);
        } else {
          console.log('✅ BottomNav OK');
        }
      }
      console.groupEnd();
    };

    snap('① mount');
    requestAnimationFrame(() => snap('② rAF'));
    requestAnimationFrame(() => requestAnimationFrame(() => snap('③ rAF×2')));
    const t300 = setTimeout(() => snap('④ 300ms'), 300);
    const t800 = setTimeout(() => snap('⑤ 800ms'), 800);

    const vv = window.visualViewport;
    const onChange = () => snap('🔄 vv resize');
    vv?.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', () => snap('↩️ orientation'));

    return () => {
      clearTimeout(t300);
      clearTimeout(t800);
      vv?.removeEventListener('resize', onChange);
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
