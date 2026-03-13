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

import { lazy, Suspense, useEffect, useRef } from 'react';
import { createBrowserRouter, Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { ErrorPage } from './layouts/ErrorPage';
import { authLoader } from './loaders/authLoader';
import { webAuthLoader } from './loaders/webAuthLoader';
import { adminLoader } from './loaders/adminLoader';
import { AppLayout } from '@/platform/layouts/AppLayout';
import { AdminLayout } from '@/platform/layouts/AdminLayout';
import { Loader } from '@/platform/components';
import { useNavigation, useSwipeNavigation, NAV_ORDER } from '@/platform/hooks';
import { useKeyboardShortcuts } from '@/platform/hooks';
import { useAkademieNav } from '@/modules/akademie/hooks/useAkademieNav';

/** Mapování module_id → kategorie slug v Akademii */
const MODULE_CATEGORY_MAP: Record<string, string> = {
  'digitalni-ticho': 'rezim',
  'kdyz-je-toho-moc': 'rezim',
  'membership-smart': 'rezim',
  'membership-ai-coach': 'rezim',
  // Add new Akademie modules here as they are created
};

// Public pages (eager load for landing)
import { LandingPage } from '@/modules/public-web/pages/LandingPage';
import { MujUcetPage } from '@/modules/public-web/pages/MujUcetPage';
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
} from '@/modules/mvp0';
import { ProfilPage } from '@/modules/mvp0/pages/ProfilPage';
import { UcetPage } from '@/modules/mvp0/pages/UcetPage';
import { SettingsPage } from '@/modules/mvp0/pages/SettingsPage';
import { AboutPage } from '@/modules/mvp0/pages/AboutPage';
import { AppTermsPage } from '@/modules/mvp0/pages/AppTermsPage';
import { AppPrivacyPage } from '@/modules/mvp0/pages/AppPrivacyPage';

// MVP0 Global Modals
import { ExerciseCreatorModal } from '@/modules/mvp0/components';
import { SettingsDrawer } from '@/platform/components';
import { FeedbackModal } from '@/platform/components/FeedbackModal';

// Admin pages (lazy loaded)
const AdminComingSoon = lazy(() => import('@/platform/pages/admin/AdminComingSoon'));
const AkademieAdmin = lazy(() => import('@/platform/pages/admin/AkademieAdmin/AkademieAdmin'));
const NotificationsAdmin = lazy(() => import('@/platform/pages/admin/NotificationsAdmin/NotificationsAdmin'));
const DailyProgramAdmin = lazy(() => import('@/platform/pages/admin/DailyProgramAdmin/DailyProgramAdmin'));
const AnalyticsAdmin = lazy(() => import('@/platform/pages/admin/AnalyticsAdmin/AnalyticsAdmin'));
const FeedbackAdmin  = lazy(() => import('@/platform/pages/admin/FeedbackAdmin/FeedbackAdmin'));
const ExercisesAdmin = lazy(() => import('@/platform/pages/admin/ExercisesAdmin/ExercisesAdmin'));
const BusinessAdmin  = lazy(() => import('@/platform/pages/admin/BusinessAdmin/BusinessAdmin'));
const EconomicsAdmin = lazy(() => import('@/platform/pages/admin/EconomicsAdmin/EconomicsAdmin'));
const PaymentsAdmin  = lazy(() => import('@/platform/pages/admin/PaymentsAdmin/PaymentsAdmin'));
const NapovedaAdmin  = lazy(() => import('@/platform/pages/admin/NapovedaAdmin/NapovedaAdmin').then((m) => ({ default: m.NapovedaAdmin })));

/**
 * TabCarousel - Apple-style carousel tab switcher
 *
 * All 4 tabs are mounted in a flex row.
 * The CSS track is driven by --carousel-index and --carousel-offset (live drag px).
 * Swipe gestures are handled by useSwipeNavigation which returns dragOffset + isDragging.
 *
 * Deep link support:
 *   ?module=digitalni-ticho  → otevře Akademie tab + přímo ProgramDetail pro daný modul
 *   ?tab=akademie             → otevře Akademie tab (na CategoryGrid)
 */
function TabCarousel() {
  const { currentTab, setCurrentTab } = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { ref, dragOffset, isDragging } = useSwipeNavigation<HTMLDivElement>();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  const currentIndex = NAV_ORDER.indexOf(currentTab);

  // Reset scroll to top when switching tabs — "always start fresh"
  useEffect(() => {
    const pageEl = pageRefs.current[NAV_ORDER.indexOf(currentTab)];
    if (pageEl) pageEl.scrollTop = 0;
  }, [currentTab]);

  // Deep link: přečti ?module= / ?tab= a nastav správný tab + program
  // Závisí na searchParams — spustí se při mount I při interní navigaci (CTA notifikace)
  useEffect(() => {
    const moduleId = searchParams.get('module');
    const tab = searchParams.get('tab') as 'dnes' | 'cvicit' | 'akademie' | 'pokrok' | null;
    const validTabs = ['dnes', 'cvicit', 'akademie', 'pokrok'] as const;

    if (moduleId) {
      import('@/modules/akademie/hooks/useAkademieNav').then(({ useAkademieNav }) => {
        const { setPendingModuleId, selectCategory } = useAkademieNav.getState();
        selectCategory('rezim');
        setPendingModuleId(moduleId);
      });
      setCurrentTab('akademie');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('module');
        next.delete('tab');
        return next;
      }, { replace: true });
    } else if (tab && validTabs.includes(tab)) {
      setCurrentTab(tab);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('tab');
        return next;
      }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Závisí na searchParams — reaguje na interní navigaci i hard refresh

  return (
    <div ref={ref} className="tab-carousel">
      <div
        className="tab-carousel__track"
        style={{
          '--carousel-index':  currentIndex,
          '--carousel-offset': `${dragOffset}px`,
          transition: isDragging
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        } as React.CSSProperties}
      >
        {/* Pages must match NAV_ORDER: dnes[0] cvicit[1] akademie[2] pokrok[3] */}
        <div className="tab-carousel__page" ref={el => { pageRefs.current[0] = el; }}><DnesPage /></div>
        <div className="tab-carousel__page" ref={el => { pageRefs.current[1] = el; }}><CvicitPage /></div>
        <div className="tab-carousel__page" ref={el => { pageRefs.current[2] = el; }}><AkademiePage /></div>
        <div className="tab-carousel__page" ref={el => { pageRefs.current[3] = el; }}><PokrokPage /></div>
      </div>
    </div>
  );
}

/**
 * GlobalModals - Renders all modal overlays
 * (Rendered OUTSIDE AppLayout for proper z-index)
 */
function GlobalModals() {
  const { 
    isExerciseCreatorOpen,
    exerciseCreatorOptions,
    closeExerciseCreator,
    isDeleteConfirmOpen,
    deleteConfirmData,
    closeDeleteConfirm,
    setCurrentTab,
    isFeedbackOpen,
    closeFeedback,
  } = useNavigation();
  
  return (
    <>
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
      
      {/* Feedback Modal */}
      {isFeedbackOpen && (
        <FeedbackModal isOpen={true} onClose={closeFeedback} />
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
        <TabCarousel />
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

      // Web account management — requires auth, redirects to / if not logged in
      {
        path: 'muj-ucet',
        loader: webAuthLoader,
        element: <MujUcetPage />,
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

          // Profile page — personal identity, KP stats, referral code
          {
            path: 'profil',
            element: <ProfilPage />,
          },

          // Account page — membership plan, purchased modules, security
          {
            path: 'ucet',
            element: <UcetPage />,
          },

          // About page
          {
            path: 'about',
            element: <AboutPage />,
          },

          // In-app legal pages (content shared with public web)
          {
            path: 'terms',
            element: <AppTermsPage />,
          },
          {
            path: 'privacy',
            element: <AppPrivacyPage />,
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
                element: <Navigate to="akademie" replace />,
              },
              {
                path: 'akademie',
                element: <AkademieAdmin />,
              },
              {
                path: 'notifications',
                element: <NotificationsAdmin />,
              },
              {
                path: 'feedback',
                element: <FeedbackAdmin />,
              },
              {
                path: 'daily-program',
                element: <DailyProgramAdmin />,
              },
              {
                path: 'analytics',
                element: <AnalyticsAdmin />,
              },
              {
                path: 'business',
                element: <BusinessAdmin />,
              },
              {
                path: 'economics',
                element: <EconomicsAdmin />,
              },
              {
                path: 'exercises',
                element: <ExercisesAdmin />,
              },
              {
                path: 'payments',
                element: <PaymentsAdmin />,
              },
              {
                path: 'napoveda',
                element: <NapovedaAdmin />,
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
