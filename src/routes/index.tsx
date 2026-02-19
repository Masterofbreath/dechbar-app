/**
 * Router Configuration
 * 
 * Flat routing structure using React Router v6.4+ Data API.
 * Benefits:
 * - No nested <Routes> components
 * - Loader pattern for data fetching
 * - Route-level guards
 * - Automatic code splitting
 * - Better error handling
 * 
 * @package DechBar_App
 * @subpackage Routes
 * @since 2.45.0
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ErrorPage } from './layouts/ErrorPage';
import { authLoader } from './loaders/authLoader';
import { adminLoader } from './loaders/adminLoader';
import { AppLayout } from '@/platform/layouts/AppLayout';
import { AdminLayout } from '@/platform/layouts/AdminLayout';
import { Loader } from '@/platform/components';
import { useNavigation } from '@/platform/hooks';
import { useKeyboardShortcuts } from '@/platform/hooks';

// Public pages (eager load for landing)
import { LandingPage } from '@/modules/public-web/pages/LandingPage';
import { SciencePage } from '@/modules/public-web/pages/SciencePage';
import { ChallengePage } from '@/modules/public-web/pages/ChallengePage';
import { ChallengeThankYouPage } from '@/modules/public-web/pages/ChallengeThankYouPage';
import { DigitalniTichoPage } from '@/modules/public-web/pages/DigitalniTichoPage';
import { DigitalniTichoThankYouPage } from '@/modules/public-web/pages/DigitalniTichoThankYouPage';

// Auth pages
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';
import { ThankYouPage } from '@/pages/auth/ThankYouPage';

// Checkout pages
import { CheckoutSuccessPage } from '@/pages/CheckoutSuccessPage';

// MVP0 Module pages
import { 
  DnesPage, 
  CvicitPage, 
  AkademiePage, 
  PokrokPage,
  ProfilPage
} from '@/modules/mvp0';
import { SettingsPage } from '@/modules/mvp0/pages/SettingsPage';

// MVP0 Global Modals
import { ExerciseCreatorModal } from '@/modules/mvp0/components';
import { NotificationCenter, KPCenter, SettingsDrawer } from '@/platform/components';

// Admin pages (lazy loaded)
const AudioPlayerAdmin = lazy(() => import('@/platform/pages/admin/AudioPlayerAdmin'));
const AdminComingSoon = lazy(() => import('@/platform/pages/admin/AdminComingSoon'));

/**
 * NavigationRouter - Renders current tab content
 * (Used inside AppLayout)
 */
function NavigationRouter() {
  const { currentTab } = useNavigation();
  
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
}

/**
 * GlobalModals - Renders all modal overlays
 * (Rendered OUTSIDE AppLayout for proper z-index)
 */
function GlobalModals() {
  const { 
    isProfileOpen, 
    closeProfile,
    isExerciseCreatorOpen,
    exerciseCreatorOptions,
    closeExerciseCreator,
    isDeleteConfirmOpen,
    deleteConfirmData,
    closeDeleteConfirm,
    setCurrentTab,
  } = useNavigation();
  
  return (
    <>
      <NotificationCenter />
      <KPCenter />
      <SettingsDrawer />
      
      {/* Exercise Creator Modal */}
      {isExerciseCreatorOpen && (
        <ExerciseCreatorModal
          isOpen={true}
          onClose={closeExerciseCreator}
          onSaveSuccess={(exercise) => {
            console.log('[GlobalModals] Exercise saved:', exercise.name);
            closeExerciseCreator();
            setCurrentTab('cvicit');
          }}
          mode={exerciseCreatorOptions?.mode || 'create'}
          exerciseId={exerciseCreatorOptions?.exerciseId}
          sourceExercise={exerciseCreatorOptions?.sourceExercise}
        />
      )}
      
      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ProfilPage />
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && deleteConfirmData && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div 
            className="exercise-creator__dialog" 
            role="alertdialog" 
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-title">Smazat cvičení?</h3>
            <p>
              Opravdu chceš smazat cvičení <strong>"{deleteConfirmData.exerciseName}"</strong>?
              <br />
              <br />
              Tato akce je nevratná.
            </p>
            <div className="exercise-creator__dialog-actions">
              <button 
                type="button" 
                onClick={closeDeleteConfirm} 
                className="button button--secondary"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteConfirmData.onConfirm();
                  closeDeleteConfirm();
                }}
                className="button button--destructive"
              >
                Smazat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * AppLayoutWrapper - Wraps AppLayout with keyboard shortcuts
 */
function AppLayoutWrapper() {
  useKeyboardShortcuts();
  
  return (
    <>
      <AppLayout>
        <NavigationRouter />
      </AppLayout>
      <GlobalModals />
    </>
  );
}

/**
 * AdminLayoutWrapper - Wraps AdminLayout with Suspense
 */
function AdminLayoutWrapper() {
  return (
    <AdminLayout>
      <Suspense fallback={<Loader message="Načítám admin panel..." />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  );
}

/**
 * Router Configuration
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      // ============================================================
      // PUBLIC ROUTES (No auth required)
      // ============================================================
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'veda',
        element: <SciencePage />,
      },
      {
        path: 'vyzva',
        element: <ChallengePage />,
      },
      {
        path: 'vyzva/dekujeme',
        element: <ChallengeThankYouPage />,
      },
      {
        path: 'digitalni-ticho',
        element: <DigitalniTichoPage />,
      },
      {
        path: 'digitalni-ticho/dekujeme',
        element: <DigitalniTichoThankYouPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
      {
        path: 'dekujeme-za-registraci',
        element: <ThankYouPage />,
      },
      {
        path: 'checkout/success',
        element: <CheckoutSuccessPage />,
      },
      {
        path: 'checkout/cancel',
        element: <Navigate to="/?cancelled=true" replace />,
      },
      
      // ============================================================
      // APP ROUTES (Auth required)
      // ============================================================
      {
        path: 'app',
        loader: authLoader,
        element: <Outlet />,
        children: [
          {
            index: true,
            element: <AppLayoutWrapper />,
          },
          
          // Settings page (Základní nastavení - Dechové cvičení)
          {
            path: 'settings',
            element: <SettingsPage />,
          },
          
          // ============================================================
          // ADMIN ROUTES (Admin role required)
          // ============================================================
          {
            path: 'admin/*',
            loader: adminLoader,
            element: <AdminLayoutWrapper />,
            children: [
              {
                index: true,
                element: <Navigate to="media" replace />,
              },
              {
                path: 'media',
                element: <AudioPlayerAdmin />,
              },
              {
                path: 'analytics',
                element: <AdminComingSoon title="Analytika" />,
              },
              {
                path: 'gamification',
                element: <AdminComingSoon title="Gamifikace" />,
              },
              {
                path: 'users',
                element: <AdminComingSoon title="Uživatelé" />,
              },
              {
                path: 'system',
                element: <AdminComingSoon title="Systém" />,
              },
            ],
          },
        ],
      },
      
      // ============================================================
      // LEGACY REDIRECTS
      // ============================================================
      {
        path: 'dashboard',
        element: <Navigate to="/app" replace />,
      },
      
      // ============================================================
      // 404 - CATCH-ALL (Must be last!)
      // ============================================================
      {
        path: '*',
        element: <ErrorPage />,
      },
    ],
  },
]);
