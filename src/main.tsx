import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { validateEnv } from './config'
import './styles/globals.css'
import './styles/components/input.css'      // Premium Input component styles
import './styles/components/button.css'     // Premium Button component styles
import './styles/components/icon-button.css' // Premium IconButton component styles
import './styles/components/checkbox.css'   // Premium Checkbox component styles
import './styles/components/top-nav.css'    // TOP NAV styles
import './styles/components/bottom-nav.css' // BOTTOM NAV styles
import './styles/components/kp-display.css' // KP Display widget
import './styles/components/locked-feature-modal.css' // Universal paywall
import './styles/layouts/app-layout.css'    // AppLayout wrapper
import './styles/pages/dnes.css'            // DNES dashboard
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
