/**
 * App Component
 * 
 * Main application entry point using React Router v6.4+ Data API.
 * Uses flat routing structure with createBrowserRouter for:
 * - Better performance (automatic code splitting)
 * - Loader pattern (data fetching before render)
 * - Route-level guards (auth/admin checks in loaders)
 * - Cleaner architecture (no nested <Routes>)
 * 
 * @package DechBar_App
 * @since 2.45.0
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Loader } from '@/platform/components';

function App() {
  return (
    <RouterProvider 
      router={router} 
      fallbackElement={<Loader message="Dýchej s námi..." />}
    />
  );
}

export default App;
