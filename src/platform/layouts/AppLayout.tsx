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
  // (před finalizací safe-area insets). Gap zmizí AŽ po prvním scroll eventu na window.
  //
  // Proč scrollTop mutace na .app-layout__content nefunguje:
  // Element má overflow:hidden na ose X → iOS WebKit nevyvolá window-level scroll
  // event → position:fixed přepočet nenastane.
  //
  // Fix: window.dispatchEvent(new Event('scroll')) — window scroll event je přesně
  // ten signál, na který iOS WebKit čeká pro přepočet fixed-position layerů.
  // Žádná viditelná změna obsahu, pouze interní iOS layout invalidation.
  useEffect(() => {
    const fixBottomNav = () => {
      window.dispatchEvent(new Event('scroll'));
    };

    // Double-rAF: 2. paint cycle kdy iOS finalizuje safe-area metriky
    requestAnimationFrame(() => requestAnimationFrame(fixBottomNav));

    // Pojistka: visualViewport resize = iOS finalizuje viewport asynchronně
    const vv = window.visualViewport;
    vv?.addEventListener('resize', fixBottomNav, { once: true });

    // Timeout fallback pro pomalá zařízení / heavy JS bundle
    const t = setTimeout(fixBottomNav, 400);

    return () => {
      clearTimeout(t);
      vv?.removeEventListener('resize', fixBottomNav);
    };
  }, []);

  // 🔍 DIAGNOSTIKA BottomNav gap — aktivní, zachytí hodnoty v konzoli Safari DevTools.
  // Postup: iPhone → Safari → Develop → [tvůj iPhone] → dechbar.cz → Console
  // Smaž tento useEffect až bug vyřešíme.
  useEffect(() => {
    const log = (label: string) => {
      const nav = document.querySelector<HTMLElement>('.bottom-nav');
      const navRect = nav?.getBoundingClientRect();
      const vv = window.visualViewport;
      const css = nav ? getComputedStyle(nav) : null;
      console.group(`[BottomNav diag] ${label}`);
      console.log('window.innerHeight       :', window.innerHeight);
      console.log('screen.height            :', screen.height);
      console.log('visualViewport.height    :', vv?.height);
      console.log('visualViewport.offsetTop :', vv?.offsetTop);
      console.log('nav.getBoundingClientRect:', navRect);
      console.log('nav computed bottom      :', css?.bottom);
      console.log('nav computed transform   :', css?.transform);
      console.log('safe-area-inset-bottom   :', getComputedStyle(document.documentElement).getPropertyValue('--sab') || '(add --sab to :root)');
      console.log('display-mode standalone  :', window.matchMedia('(display-mode: standalone)').matches);
      console.groupEnd();
    };

    // T=0: ihned po renderu
    log('T=0 (immediate)');
    // T=rAF: po prvním paint
    requestAnimationFrame(() => log('T=rAF'));
    // T=500ms: po dispatch scroll eventu
    const t1 = setTimeout(() => log('T=500ms'), 500);
    // T=2000ms: po stabilizaci (po případném ručním scrollu to bude ok)
    const t2 = setTimeout(() => log('T=2000ms'), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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
