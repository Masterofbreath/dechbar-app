import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Primary Supabase client — PKCE flow for magic links (protects against email scanners)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'dechbar-auth',
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Implicit-flow client — used ONLY for password reset.
//
// WHY: PKCE flow_state on the Supabase server expires after 300 s. If the user
// takes longer than 5 minutes to click the reset link they receive a 422
// "invalid flow state, flow state has expired" error. Implicit flow embeds the
// access_token in the URL hash fragment, which:
//   1. Never expires before the OTP expiry (configured in Supabase dashboard).
//   2. Is NOT sent to servers (hash fragments are browser-only), so email
//      security scanners cannot consume the token before the user clicks.
export const supabaseImplicit = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    storageKey: 'dechbar-auth-implicit',
    storage: window.localStorage,
    autoRefreshToken: false,
    detectSessionInUrl: true,
    flowType: 'implicit',
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
