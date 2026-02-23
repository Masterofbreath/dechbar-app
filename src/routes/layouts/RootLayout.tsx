/**
 * RootLayout Component
 * 
 * Top-level wrapper for all routes.
 * Initializes auth system, real-time sync, and provides global error boundary.
 * 
 * @package DechBar_App
 * @subpackage Routes/Layouts
 * @since 2.45.0
 * @updated 2.47.0 - Added unified real-time user state sync
 * @updated 2.48.0 - Added Google Analytics SPA page tracking
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
    fbq: (...args: unknown[]) => void;
  }
}

import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { useInitializeAuth } from '@/platform/auth';
import { useRealtimeUserState } from '@/platform/user/useRealtimeUserState';
import { isNativeApp } from '@/platform/utils/environment';
import { Toast } from '@/components/shared';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize auth (runs once on app mount)
  useInitializeAuth();
  
  // ✅ NEW: Real-time sync for user state (roles + membership + modules)
  // Replaces useLoadUserRoles - now handles ALL user data with real-time updates
  useRealtimeUserState();

  // Google Analytics — SPA page tracking
  // Fires on every route change (index.html config has send_page_view: false to avoid duplicate)
  useEffect(() => {
    if (typeof window.gtag === 'undefined') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  // Meta Pixel — SPA page tracking
  // fbq('init') je v index.html, PageView se tracuje tady při každé navigaci
  useEffect(() => {
    if (typeof window.fbq === 'undefined') return;
    window.fbq('track', 'PageView');
  }, [location.pathname, location.search]);
  
  // Deep Link Handler (Native only)
  useEffect(() => {
    if (!isNativeApp()) return;

    let listener: { remove: () => void } | undefined;

    const setupDeepLink = async () => {
      listener = await CapacitorApp.addListener('appUrlOpen', (event) => {
        console.log('🔗 Deep link opened:', event.url);
        
        try {
          const url = new URL(event.url);
          const path = url.pathname;
          const search = url.search;
          
          if (path.includes('/reset-password')) {
            navigate('/reset-password' + search);
          } else if (path.includes('/app')) {
            navigate('/app' + search);
          } else {
            navigate('/app');
          }
        } catch (err) {
          console.error('❌ Deep link parse error:', err);
          navigate('/app');
        }
      });
    };

    setupDeepLink();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [navigate]);
  
  return (
    <>
      <Outlet />
      <Toast />
    </>
  );
}
