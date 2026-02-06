/**
 * Auth Store - Zustand
 * 
 * Global authentication state management using Zustand
 * Replaces separate useState instances in useAuth hook for shared state across components
 * 
 * Key Benefits:
 * - Shared state prevents LoginView flash during logout
 * - Optimized re-renders with selective subscriptions
 * - Redux DevTools integration for debugging
 * - Consistent with project's state management strategy
 * 
 * @see docs/development/01_WORKFLOW.md - State Management section
 * @package DechBar_App
 * @subpackage Platform/Auth
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '../api/supabase';
import type { User, SignInCredentials, SignUpCredentials } from './types';
import { getVocative } from '@/utils/inflection';
import { isWebApp } from '@/platform/utils/environment';
import { roleService } from './roleService';
import { useUserState } from '@/platform/user/userStateStore';

/**
 * Auth Store Interface
 * 
 * State properties and actions for authentication management
 */
interface AuthStore {
  // State
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;  // ← KEY: Shared across all components!
  error: Error | null;
  
  // Internal setters (private by convention)
  _setUser: (user: User | null) => void;
  _setIsLoading: (loading: boolean) => void;
  _setIsLoggingOut: (loggingOut: boolean) => void;
  _setError: (error: Error | null) => void;
  
  // Public actions
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signUpWithMagicLink: (email: string, options?: { gdprConsent?: boolean; emailRedirectTo?: string }) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'facebook', options?: { redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Session management
  checkSession: () => Promise<void>;
  initializeAuthListener: () => () => void;
}

/**
 * Ensure minimum loading time for premium UX
 * 
 * @param promise - Async operation
 * @param minTime - Minimum duration in milliseconds
 */
async function ensureMinLoadingTime<T>(
  promise: Promise<T>,
  minTime: number = 1500
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await promise;
    const elapsed = Date.now() - startTime;
    
    if (elapsed < minTime) {
      await new Promise(resolve => 
        setTimeout(resolve, minTime - elapsed)
      );
    }
    
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    if (elapsed < minTime) {
      await new Promise(resolve => 
        setTimeout(resolve, minTime - elapsed)
      );
    }
    throw error;
  }
}

/**
 * Auth Store
 * 
 * Global Zustand store for authentication state
 * Uses devtools middleware for Redux DevTools integration
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // ============================================================
      // INITIAL STATE
      // ============================================================
      user: null,
      isLoading: true,
      isLoggingOut: false,
      error: null,
      
      // ============================================================
      // INTERNAL SETTERS (Private by convention)
      // ============================================================
      _setUser: (user) => set({ user }, false, 'setUser'),
      _setIsLoading: (isLoading) => set({ isLoading }, false, 'setIsLoading'),
      _setIsLoggingOut: (isLoggingOut) => set({ isLoggingOut }, false, 'setIsLoggingOut'),
      _setError: (error) => set({ error }, false, 'setError'),
      
      // ============================================================
      // SESSION MANAGEMENT
      // ============================================================
      
      /**
       * Check current session from Supabase
       * Called on app initialization
       */
      checkSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (session?.user) {
            // Set basic user info (no roles yet)
            get()._setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata.full_name,
              vocative_name: session.user.user_metadata.vocative_name,
              avatar_url: session.user.user_metadata.avatar_url,
            });
            
            // ✅ NEW: Fetch unified user state (roles + membership + modules)
            await useUserState.getState().fetchUserState(session.user.id);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            console.log('ℹ️ Session check aborted (component unmounting)');
            return;
          }
          console.error('Error checking session:', err);
          get()._setError(err as Error);
        } finally {
          get()._setIsLoading(false);
        }
      },
      
      /**
       * Initialize Supabase auth state listener
       * Returns cleanup function
       */
      initializeAuthListener: () => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            get()._setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata.full_name,
              vocative_name: session.user.user_metadata.vocative_name,
              avatar_url: session.user.user_metadata.avatar_url,
              roles: session.user.user_metadata.roles || [], // ← Synchronous read from metadata
            });
          } else {
            get()._setUser(null);
          }
          get()._setIsLoading(false);
        });
        
        return () => subscription.unsubscribe();
      },
      
      // ============================================================
      // AUTHENTICATION ACTIONS
      // ============================================================
      
      /**
       * Sign in with email/password
       */
      signIn: async ({ email, password, remember = true }) => {
        try {
          get()._setIsLoading(true);
          get()._setError(null);
          
          // Parallel execution: Login + Preload
          const loginPromise = supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          // Preload critical data during login
          const preloadPromise = Promise.allSettled([
            (async () => {
              try {
                await supabase.from('profiles').select('*').limit(1);
                console.log('✅ Profiles table prefetched');
              } catch {}
            })(),
            
            (async () => {
              try {
                await supabase.from('modules').select('id, name, description');
                console.log('✅ Modules metadata prefetched');
              } catch {}
            })(),
            
            (async () => {
              try {
                await supabase.from('user_progress').select('*').limit(10);
                console.log('✅ User progress prefetched');
              } catch {}
            })(),
            
            (async () => {
              try {
                await supabase.from('achievements').select('*').limit(5);
                console.log('✅ Achievements prefetched');
              } catch {}
            })(),
          ]);
          
          const [loginResult] = await Promise.all([loginPromise, preloadPromise]);
          
          if (loginResult.error) throw loginResult.error;
          
          // Handle "Remember Me" functionality
          if (!remember) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              localStorage.removeItem('dechbar-auth');
              sessionStorage.setItem('dechbar-auth', JSON.stringify(session));
            }
          }
        } catch (err) {
          console.error('Error signing in:', err);
          get()._setError(err as Error);
          throw err;
        } finally {
          get()._setIsLoading(false);
        }
      },
      
      /**
       * Sign up with email/password
       */
      signUp: async ({ email, password, full_name, gdpr_consent, gdpr_consent_date }) => {
        try {
          get()._setIsLoading(true);
          get()._setError(null);
          
          // Auto-generate vocative for personalized greetings
          const vocative_name = full_name ? getVocative(full_name) : undefined;
          
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name,
                vocative_name,
                gdpr_consent,
                gdpr_consent_date,
              },
            },
          });
          
          if (error) throw error;
        } catch (err) {
          console.error('Error signing up:', err);
          get()._setError(err as Error);
          throw err;
        } finally {
          get()._setIsLoading(false);
        }
      },
      
      /**
       * Sign out
       * 
       * ✅ KEY FIX: isLoggingOut is GLOBAL state!
       * ProtectedRoute sees this immediately and shows Loader instead of LoginView
       */
      signOut: async () => {
        try {
          get()._setIsLoading(true);
          get()._setIsLoggingOut(true);  // ← SHARED STATE across all components!
          get()._setError(null);
          
          // ✅ NEW: Clear unified user state
          useUserState.getState().clearUserState();
          
          // Clear role cache on logout
          const userId = get().user?.id;
          if (userId) {
            roleService.clearCache(userId);
          }
          
          const { error } = await ensureMinLoadingTime(
            supabase.auth.signOut(),
            1500  // Smooth exit with breathing animation
          );
          
          if (error) throw error;
          
          if (isWebApp()) {
            // Web: Set user null, then redirect to homepage
            get()._setUser(null);
            window.location.replace('/');
          } else {
            // Native: Set user null, ProtectedRoute will show AuthModal
            get()._setUser(null);
            get()._setIsLoggingOut(false);
            console.log('📱 Native app: Logged out, showing AuthModal');
          }
        } catch (err) {
          console.error('Error signing out:', err);
          get()._setError(err as Error);
          get()._setIsLoggingOut(false);
          throw err;
        } finally {
          if (!isWebApp()) {
            get()._setIsLoading(false);
          }
        }
      },
      
      /**
       * Sign up with Magic Link (email only)
       */
      signUpWithMagicLink: async (email, options) => {
        try {
          get()._setError(null);
          
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: options?.emailRedirectTo || `${window.location.origin}/app`,
              data: {
                gdpr_consent: options?.gdprConsent || false,
                signed_up_at: new Date().toISOString(),
              },
            },
          });
          
          if (error) throw error;
          
          console.log('✅ Magic link sent successfully to:', email);
        } catch (err) {
          console.error('Error sending magic link:', err);
          get()._setError(err as Error);
          throw err;
        }
      },
      
      /**
       * Sign in with OAuth (Google/Apple/Facebook)
       */
      signInWithOAuth: async (provider, options) => {
        try {
          get()._setError(null);
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: options?.redirectTo || `${window.location.origin}/app`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          });
          
          if (error) throw error;
          
          // ✅ Post-OAuth: Generate vocative_name + Store GDPR consent
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const full_name = session.user.user_metadata.full_name;
            const needsVocative = !session.user.user_metadata.vocative_name;
            const needsGdpr = !session.user.user_metadata.gdpr_consent;
            
            // Update user metadata if needed
            if (needsVocative || needsGdpr) {
              const updateData: any = {};
              
              // Add vocative_name
              if (needsVocative && full_name) {
                updateData.vocative_name = getVocative(full_name);
              }
              
              // Add GDPR consent (OAuth registration = implicit consent)
              if (needsGdpr) {
                updateData.gdpr_consent = true;
                updateData.gdpr_consent_date = new Date().toISOString();
              }
              
              await supabase.auth.updateUser({
                data: updateData,
              });
              
              get()._setUser({
                id: session.user.id,
                email: session.user.email!,
                full_name,
                vocative_name: updateData.vocative_name || session.user.user_metadata.vocative_name,
                avatar_url: session.user.user_metadata.avatar_url,
              });
              
              console.log(`✅ Updated OAuth user metadata:`, updateData);
            }
          }
          
          console.log(`✅ OAuth sign-in initiated with ${provider}`);
        } catch (err) {
          console.error(`Error signing in with ${provider}:`, err);
          get()._setError(err as Error);
          throw err;
        }
      },
      
      /**
       * Reset password (send email)
       */
      resetPassword: async (email) => {
        try {
          get()._setError(null);
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          
          if (error) throw error;
        } catch (err) {
          console.error('Error resetting password:', err);
          get()._setError(err as Error);
          throw err;
        }
      },
    }),
    { name: 'auth-store' }  // Redux DevTools name
  )
);
