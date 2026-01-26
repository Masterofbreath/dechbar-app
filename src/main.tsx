import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { validateEnv } from './config'
import './styles/globals.css'
import './styles/components/input.css'      // Premium Input component styles
import './styles/components/button.css'     // Premium Button component styles
import './styles/components/icon-button.css' // Premium IconButton component styles
import './styles/components/checkbox.css'   // Premium Checkbox component styles
import './styles/components/fullscreen-modal-mobile.css'  // ✅ Shared mobile fullscreen patterns
import './styles/components/top-nav.css'    // TOP NAV styles
import './styles/components/bottom-nav.css' // BOTTOM NAV styles
import './styles/components/kp-display.css' // KP Display widget
import './styles/components/notification-center.css' // Notification Center
import './styles/components/kp-center.css' // KP Center
// import './styles/components/kp-static-circle.css' // Removed - using shared BreathingCircle
import './styles/components/kp-onboarding.css' // KP Onboarding
import './styles/components/kp-timer.css' // KP Timer
import './styles/components/kp-result.css' // KP Result
import './styles/components/kp-history.css' // KP History
import './styles/components/kp-measurement-engine.css' // KP Measurement Engine
import './styles/components/settings-drawer.css' // Settings Drawer
import './styles/components/confirm-modal.css' // ConfirmModal component
import './styles/components/toast.css' // Toast notifications
import './styles/components/empty-state.css' // EmptyState component
import './styles/components/loading-skeleton.css' // LoadingSkeleton component
import './styles/components/locked-feature-modal.css' // Universal paywall
import './styles/components/exercise-card.css' // Exercise card component
import './styles/components/exercise-list.css' // Exercise list with tabs
import './styles/components/session-engine/index.css' // Session engine modal (modular)
import './styles/components/safety-questionnaire.css' // Safety questionnaire
import './styles/layouts/app-layout.css'    // AppLayout wrapper
import './styles/pages/dnes.css'            // DNES dashboard
import './styles/pages/cvicit.css'          // CVICIT exercise library
import './styles/modals.css'  // Base modal styles (shared)
import './styles/auth.css'    // Auth-specific styles
import App from './App.tsx'

// Validate environment variables before app starts
validateEnv();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
