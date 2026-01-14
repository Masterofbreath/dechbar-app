/**
 * useAuth Hook
 * 
 * Authentication state and actions
 */

import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import type { User, SignInCredentials, SignUpCredentials } from './types';
import { getVocative } from '@/utils/inflection';
import { isWebApp } from '@/platform/utils/environment';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signUpWithMagicLink: (email: string, options?: { gdprConsent?: boolean; emailRedirectTo?: string }) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple' | 'facebook', options?: { redirectTo?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Ensure minimum loading time for premium UX
 * 
 * Currently used ONLY for logout (1500ms smooth transition).
 * Login flow uses Button loading state (no artificial delay).
 * 
 * Timing Strategy:
 * - 1500ms: Logout (0.75 breathing cycles)
 *   → Smooth exit (web: redirect to /, native: stay in /app)
 *   → Prevents jarring instant disappear
 * 
 * - Login: NO artificial delay (Button "Načítám..." is sufficient)
 *   → Real network time: 0.5-2s (Supabase auth)
 *   → AuthModal fade-out: 400ms (smooth transition)
 *   → Dashboard fade-in: 600ms (smooth entrance)
 *   → Total: ~1-3s natural, smooth transition
 * 
 * @param promise - Async operation (logout, etc.)
 * @param minTime - Minimum duration in milliseconds (default 1500ms for logout)
 * @returns Promise result
 * 
 * @example
 * await ensureMinLoadingTime(
 *   supabase.auth.signOut(),
 *   1500  // Smooth logout
 * );
 */
async function ensureMinLoadingTime<T>(
  promise: Promise<T>,
  minTime: number = 1500
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Execute the actual operation
    const result = await promise;
    
    // Calculate elapsed time
    const elapsed = Date.now() - startTime;
    
    // If faster than minTime, wait for remaining time
    if (elapsed < minTime) {
      await new Promise(resolve => 
        setTimeout(resolve, minTime - elapsed)
      );
    }
    
    return result;
  } catch (error) {
    // Even on error, ensure minimum time (UX consistency)
    const elapsed = Date.now() - startTime;
    if (elapsed < minTime) {
      await new Promise(resolve => 
        setTimeout(resolve, minTime - elapsed)
      );
    }
    throw error; // Re-throw after min time
  }
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata.full_name,
          vocative_name: session.user.user_metadata.vocative_name,
          avatar_url: session.user.user_metadata.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata.full_name,
          vocative_name: session.user.user_metadata.vocative_name,
          avatar_url: session.user.user_metadata.avatar_url,
        });
      }
    } catch (err: any) {
      // Ignore AbortError (normal during component unmount/redirect)
      if (err.name === 'AbortError') {
        console.log('ℹ️ Session check aborted (component unmounting)');
        return;
      }
      
      // Log only real errors
      console.error('Error checking session:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn({ email, password, remember = true }: SignInCredentials) {
    try {
      setIsLoading(true);
      setError(null);

      // Parallel execution: Login + Preload (utilize 5000ms loading time)
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Preload critical data during login (runs in parallel, failures ignored)
      // Using 5000ms window to prefetch EVERYTHING for instant dashboard
      const preloadPromise = Promise.allSettled([
        // Prefetch user profile data
        supabase.from('profiles').select('*').limit(1).then(() => 
          console.log('✅ Profiles table prefetched')
        ),
        
        // Prefetch modules metadata (for dashboard)
        supabase.from('modules').select('id, name, description').then(() =>
          console.log('✅ Modules metadata prefetched')
        ),
        
        // NEW: Prefetch user progress data (utilize 5s window)
        (async () => {
          try {
            await supabase.from('user_progress').select('*').limit(10);
            console.log('✅ User progress prefetched');
          } catch {
            // Ignore if table doesn't exist yet
          }
        })(),
        
        // NEW: Prefetch achievements (utilize 5s window)
        (async () => {
          try {
            await supabase.from('achievements').select('*').limit(5);
            console.log('✅ Achievements prefetched');
          } catch {
            // Ignore if table doesn't exist yet
          }
        })(),
      ]);

      // Wait for both login and preload (no artificial delay - button handles loading state)
      const [loginResult] = await Promise.all([loginPromise, preloadPromise]);

      if (loginResult.error) throw loginResult.error;
      
      // If remember=false, we need to move the session to sessionStorage
      if (!remember) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Remove from localStorage
          localStorage.removeItem('dechbar-auth');
          // Store in sessionStorage
          sessionStorage.setItem('dechbar-auth', JSON.stringify(session));
        }
      }
    } catch (err) {
      console.error('Error signing in:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp({ email, password, full_name, gdpr_consent, gdpr_consent_date }: SignUpCredentials) {
    try {
      setIsLoading(true);
      setError(null);

      // Auto-generate vocative for personalized greetings
      const vocative_name = full_name ? getVocative(full_name) : undefined;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            vocative_name, // Auto-generated vocative (5th case)
            gdpr_consent,
            gdpr_consent_date,
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      setError(null);

      // Logout with 1500ms minimum (smooth exit, logo breathing visible)
      const { error } = await ensureMinLoadingTime(
        supabase.auth.signOut(),
        1500  // 0.75 breathing cycles (premium but not too slow)
      );

      if (error) throw error;

      setUser(null);

      // 🎯 REDIRECT LOGIC: Web vs. Native
      if (isWebApp()) {
        // Web: Instant redirect (no flash of AuthModal)
        // Using replace() instead of href to prevent back button loop
        window.location.replace('/');
      } else {
        // Native: Stay in /app (ProtectedRoute will show AuthModal)
        console.log('📱 Native app: Logged out, showing AuthModal');
      }
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err as Error);
      throw err;
    } finally {
      // Don't set isLoading = false if redirecting to homepage
      // This prevents flash of AuthModal during redirect
      if (!isWebApp()) {
        setIsLoading(false);
      }
    }
  }

  async function resetPassword(email: string) {
    try {
      setError(null);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err as Error);
      throw err;
    }
  }

  async function signUpWithMagicLink(
    email: string, 
    options?: { gdprConsent?: boolean; emailRedirectTo?: string }
  ) {
    try {
      setError(null);

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
      setError(err as Error);
      throw err;
    }
  }

  async function signInWithOAuth(
    provider: 'google' | 'apple' | 'facebook',
    options?: { redirectTo?: string }
  ) {
    try {
      setError(null);

      // OAuth popup is the loading indicator
      // User sees: Click → Google popup → Choose account → Redirect to /app
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: options?.redirectTo || `${window.location.origin}/app`,
        },
      });

      if (error) throw error;

      console.log(`✅ OAuth sign-in initiated with ${provider}`);
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err);
      setError(err as Error);
      throw err;
    }
  }

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signUpWithMagicLink,
    signInWithOAuth,
    signOut,
    resetPassword,
  };
}
