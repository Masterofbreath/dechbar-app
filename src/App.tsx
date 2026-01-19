/**
 * App Component
 * 
 * Main application with routing and authentication
 * Routing structure:
 * - dechbar.cz/ → Landing page (public)
 * - dechbar.cz/app → Dashboard (auth required)
 * - dechbar.cz/app/* → Modules (ownership required)
 * 
 * @package DechBar_App
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { useAuth, useInitializeAuth } from '@/platform/auth';
import { isNativeApp } from '@/platform/utils/environment';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { Loader, NotificationCenter, KPCenter, SettingsDrawer } from '@/platform/components';
import { AppLayout } from '@/platform/layouts';
import { useNavigation, useKeyboardShortcuts } from '@/platform/hooks';

// Public Web Module - Landing Page + Science Page (eager load, not lazy)
import { LandingPage } from '@/modules/public-web/pages/LandingPage';
import { SciencePage } from '@/modules/public-web/pages/SciencePage';

// MVP0 Module - Core Pages
import { 
  DnesPage, 
  CvicitPage, 
  AkademiePage, 
  PokrokPage,
  ProfilPage
} from '@/modules/mvp0';

// Deep Link Router Component (needs to be inside BrowserRouter to use useNavigate)
function DeepLinkRouter() {
  const navigate = useNavigate();

  // 🔗 Deep Link Handler (Native only)
  useEffect(() => {
    if (!isNativeApp()) return;

    let listener: any;

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

  return null; // This component doesn't render anything
}

// Navigation Router Component - Renders current tab content
function NavigationRouter() {
  const { currentTab, isProfileOpen, closeProfile } = useNavigation();
  
  // ✅ Global keyboard shortcuts (Cmd+K, Cmd+,, Esc, 1-4)
  // Must be inside Router context
  useKeyboardShortcuts();
  
  // Render modals
  const renderModals = () => (
    <>
      <NotificationCenter />
      <KPCenter />
      <SettingsDrawer />
      {isProfileOpen && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ProfilPage />
          </div>
        </div>
      )}
    </>
  );
  
  // Render current tab content
  const renderContent = () => {
    switch (currentTab) {
      case 'dnes':
        return <DnesPage />;
      case 'cvicit':
        return <CvicitPage />;
      case 'akademie':
        return <AkademiePage />;
      case 'pokrok':
        return <PokrokPage />;
      default:
        return <DnesPage />;
    }
  };
  
  return (
    <>
      {renderContent()}
      {renderModals()}
    </>
  );
}

function App() {
  const { user, isLoading } = useAuth();
  
  // ✅ Initialize Zustand auth store (session check + listener)
  useInitializeAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <Loader message="Dýchej s námi..." />;
  }

  return (
    <BrowserRouter>
      <DeepLinkRouter />
      <Routes>
        {/* ========================================
            PUBLIC ROUTES (No auth required)
            ======================================== */}
        
        {/* Landing page - accessible to all (authenticated and unauthenticated) */}
        <Route 
          path="/" 
          element={<LandingPage />} 
        />

        {/* Science page - deep dive into breathing science (public) */}
        <Route 
          path="/veda" 
          element={<SciencePage />} 
        />

        {/* Reset password page (public, accessed from email link) */}
        <Route 
          path="/reset-password" 
          element={<ResetPasswordPage />} 
        />

        {/* ========================================
            APP ROUTES (Auth required, Bluetooth-safe)
            All under /app/* to maintain Bluetooth context
            ======================================== */}
        
        {/* Dashboard - main app entry point (MVP0 with navigation) */}
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <NavigationRouter />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy dashboard route (old implementation, keep for backwards compatibility) */}
        <Route 
          path="/app/old-dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Legacy /dashboard redirect → /app */}
        <Route 
          path="/dashboard" 
          element={<Navigate to="/app" replace />} 
        />

        {/* ========================================
            MODULE ROUTES (/app/studio, /app/challenges, etc.)
            Future: Lazy-loaded modules with ModuleGuard
            ======================================== */}

        {/* Placeholder for future modules
        <Route 
          path="/app/studio/*" 
          element={
            <ModuleGuard moduleId="studio">
              <Suspense fallback={<Loading />}>
                <StudioModule />
              </Suspense>
            </ModuleGuard>
          } 
        />
        */}

        {/* ========================================
            404 - Redirect to landing or app
            ======================================== */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/app" : "/"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
