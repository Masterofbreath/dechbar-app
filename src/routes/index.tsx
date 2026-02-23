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

import { lazy, Suspense, useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ErrorPage } from './layouts/ErrorPage';
import { authLoader } from './loaders/authLoader';
import { adminLoader } from './loaders/adminLoader';
import { AppLayout } from '@/platform/layouts/AppLayout';
import { AdminLayout } from '@/platform/layouts/AdminLayout';
import { Loader } from '@/platform/components';
import { useNavigation } from '@/platform/hooks';
import { useKeyboardShortcuts } from '@/platform/hooks';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';

/** Mapování module_id → kategorie slug v Akademii */
const MODULE_CATEGORY_MAP: Record<string, string> = {
  'digitalni-ticho': 'rezim',
  'membership-smart': 'rezim',
  'membership-ai-coach': 'rezim',
};

// Public pages (eager load for landing)
import { LandingPage } from '@/modules/public-web/pages/LandingPage';
import { SciencePage } from '@/modules/public-web/pages/SciencePage';
import { ChallengePage } from '@/modules/public-web/pages/ChallengePage';
import { ChallengeThankYouPage } from '@/modules/public-web/pages/ChallengeThankYouPage';
import { DigitalniTichoPage } from '@/modules/public-web/pages/DigitalniTichoPage';
import { DigitalniTichoThankYouPage } from '@/modules/public-web/pages/DigitalniTichoThankYouPage';
import { TermsPage } from '@/modules/public-web/pages/TermsPage';
import { PrivacyPage } from '@/modules/public-web/pages/PrivacyPage';
import { ContactPage } from '@/modules/public-web/pages/ContactPage';

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
 *
 * Deep link support:
 *   ?module=digitalni-ticho  → otevře Akademie tab + přímo ProgramDetail pro daný modul
 *   ?tab=akademie             → otevře Akademie tab (na CategoryGrid)
 *
 * Příklad magic link z emailu po platbě:
 *   https://app.zdravedychej.cz/app?module=digitalni-ticho
 */
function NavigationRouter() {
  const { currentTab, setCurrentTab } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep link: přečti ?module= a nastav pendingModuleId v akademie nav
  useEffect(() => {
    const moduleId = searchParams.get('module');
    const tab = searchParams.get('tab');

    if (moduleId) {
      // Lazy import — nechceme circular dependency
      import('@/modules/akademie/hooks/useAkademieNav').then(({ useAkademieNav }) => {
        const { setPendingModuleId, selectCategory } = useAkademieNav.getState();
        selectCategory('rezim'); // zajisti, že jsme v správné kategorii
        setPendingModuleId(moduleId);
      });
      setCurrentTab('akademie');
      // Smaž query param z URL (čistá URL)
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('module');
        next.delete('tab');
        return next;
      }, { replace: true });
    } else if (tab === 'akademie') {
      setCurrentTab('akademie');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('tab');
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Záměrně pouze při mount — čteme URL jednou

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
 * Handles deep link params from magic link emails (?module=digitalni-ticho&welcome=true)
 */
function AppLayoutWrapper() {
  useKeyboardShortcuts();

  const [searchParams, setSearchParams] = useSearchParams();
  const { setCurrentTab } = useNavigation();
  const { selectCategory, setPendingModuleId } = useAkademieNav();

  useEffect(() => {
    const moduleId = searchParams.get('module');
    if (!moduleId) return;

    const categorySlug = MODULE_CATEGORY_MAP[moduleId] ?? 'rezim';

    // Přepni na Akademii, otevři správnou kategorii, nastav pending program
    setCurrentTab('akademie');
    selectCategory(categorySlug);
    setPendingModuleId(moduleId);

    // Vyčisti URL params (zachová čisté /app)
    setSearchParams({}, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Záměrně pouze při mount — deep link se zpracuje jednou
  
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
        // Na PROD: dočasný redirect → /vyzva (kampaň, aktivní do 2026-02-26)
        // Na DEV/localhost: zobrazí LandingPage (hlavní homepage s Header + login)
        index: true,
        element: import.meta.env.PROD
          ? <Navigate to="/vyzva" replace />
          : <LandingPage />,
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
        path: 'obchodni-podminky',
        element: <TermsPage />,
      },
      {
        path: 'ochrana-osobnich-udaju',
        element: <PrivacyPage />,
      },
      {
        path: 'kontakt',
        element: <ContactPage />,
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
