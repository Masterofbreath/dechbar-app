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

import type { ReactNode } from 'react';
import { TopNav } from '../components/navigation/TopNav';
import { BottomNav } from '../components/navigation/BottomNav';
import { StickyAudioPlayer } from '../components/AudioPlayer';

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
  return (
    <div className="app-layout">
      <TopNav transparent={transparentTopNav} />
      
      <main className="app-layout__content" role="main">
        {children}
      </main>
      
      {!hideBottomNav && <BottomNav />}
      
      {/* Sticky Audio Player (global, shows when track playing) */}
      <StickyAudioPlayer />
    </div>
  );
}
