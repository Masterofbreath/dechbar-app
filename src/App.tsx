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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/platform/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Public Web Module - Landing Page (eager load, not lazy)
import { LandingPage } from '@/modules/public-web/pages/LandingPage';

function App() {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-background)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg 
            style={{ 
              animation: 'spin 1s linear infinite',
              width: '48px',
              height: '48px',
              color: 'var(--color-accent)',
              margin: '0 auto 16px'
            }}
            viewBox="0 0 24 24"
          >
            <circle 
              style={{ opacity: 0.25 }}
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              fill="none"
            />
            <path 
              style={{ opacity: 0.75 }}
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p style={{ color: 'var(--color-text-secondary)' }}>Načítám DechBar App...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================
            PUBLIC ROUTES (No auth required)
            ======================================== */}
        
        {/* Landing page - redirect to /app if logged in */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/app" replace /> : <LandingPage />} 
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
        
        {/* Dashboard - main app entry point */}
        <Route 
          path="/app" 
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
