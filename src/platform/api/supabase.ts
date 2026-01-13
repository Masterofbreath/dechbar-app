import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist auth session in localStorage (default)
    persistSession: true,
    // Storage key for auth session
    storageKey: 'dechbar-auth',
    // Storage provider (default: localStorage)
    storage: window.localStorage,
    // Auto refresh token before expiration
    autoRefreshToken: true,
    // Detect session in URL (for OAuth callbacks)
    detectSessionInUrl: true,
    // Flow type for auth
    flowType: 'pkce',
  },
});

// Helper: Check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
};

// Helper: Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
