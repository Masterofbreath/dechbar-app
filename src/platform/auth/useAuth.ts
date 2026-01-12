/**
 * useAuth Hook
 * 
 * Authentication state and actions
 */

import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import type { User, SignInCredentials, SignUpCredentials } from './types';
import { getVocative } from '@/utils/inflection';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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
    } catch (err) {
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

      // Sign in with password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
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

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
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

  return {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
