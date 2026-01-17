/**
 * useInitializeAuth Hook
 * 
 * Initializes Zustand auth store session check and listener
 * Should be called ONCE in App.tsx root component
 * 
 * Responsibilities:
 * - Check existing session from Supabase on mount
 * - Initialize auth state change listener
 * - Cleanup subscription on unmount
 * 
 * @example
 * function App() {
 *   useInitializeAuth(); // ← Call once at app root
 *   // ... rest of app
 * }
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth
 */

import { useEffect } from 'react';
import { useAuthStore } from './authStore';

export function useInitializeAuth() {
  useEffect(() => {
    // Check session on mount (restore user from Supabase)
    useAuthStore.getState().checkSession();
    
    // Initialize auth state change listener (logout, login, token refresh)
    const unsubscribe = useAuthStore.getState().initializeAuthListener();
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);
}
