/**
 * useAuth Hook
 * 
 * Backward-compatible wrapper for Zustand authStore
 * Allows existing components to work without changes
 * 
 * MIGRATION NOTE:
 * This is a thin wrapper around Zustand store for backward compatibility.
 * In new code, prefer direct `useAuthStore` import for better performance.
 * 
 * @deprecated In new code, prefer `import { useAuthStore } from '@/platform/auth'`
 * @example
 * // Old way (still works):
 * const { user, signOut } = useAuth();
 * 
 * // New way (recommended):
 * const user = useAuthStore(state => state.user);
 * const signOut = useAuthStore(state => state.signOut);
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth
 */

import { useAuthStore } from './authStore';
import type { User, SignInCredentials, SignUpCredentials } from './types';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: Error | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signUpWithMagicLink: (email: string, options?: { gdprConsent?: boolean; emailRedirectTo?: string }) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'facebook', options?: { redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * useAuth - Backward-compatible wrapper
 * 
 * Uses Zustand selectors for optimal re-renders
 * Each property creates a separate subscription
 */
export function useAuth(): UseAuthReturn {
  // Use Zustand selectors (optimal re-renders)
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const isLoggingOut = useAuthStore(state => state.isLoggingOut);
  const error = useAuthStore(state => state.error);
  const signIn = useAuthStore(state => state.signIn);
  const signUp = useAuthStore(state => state.signUp);
  const signUpWithMagicLink = useAuthStore(state => state.signUpWithMagicLink);
  const signInWithOAuth = useAuthStore(state => state.signInWithOAuth);
  const signOut = useAuthStore(state => state.signOut);
  const resetPassword = useAuthStore(state => state.resetPassword);
  
  return {
    user,
    isLoading,
    isLoggingOut,
    error,
    signIn,
    signUp,
    signUpWithMagicLink,
    signInWithOAuth,
    signOut,
    resetPassword,
  };
}
