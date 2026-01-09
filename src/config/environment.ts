/**
 * Environment Configuration
 * 
 * Type-safe access to environment variables.
 * All variables must be prefixed with VITE_ to be accessible in browser.
 */

export const env = {
  // Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },

  // Payment providers
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY as string,
  },
  gopay: {
    goid: import.meta.env.VITE_GOPAY_GOID as string,
  },

  // Analytics & Tracking
  analytics: {
    googleId: import.meta.env.VITE_GA_ID as string,
  },

  // Email & Marketing
  ecomail: {
    apiKey: import.meta.env.VITE_ECOMAIL_API_KEY as string,
  },

  // Environment
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE as 'development' | 'production' | 'test',
} as const;

/**
 * Validate required environment variables
 * Call this at app startup
 */
export function validateEnv(): void {
  const required = [
    { key: 'VITE_SUPABASE_URL', value: env.supabase.url },
    { key: 'VITE_SUPABASE_ANON_KEY', value: env.supabase.anonKey },
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(', ');
    throw new Error(
      `Missing required environment variables: ${missingKeys}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}
