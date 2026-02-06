/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  vocative_name?: string; // Auto-generated vocative (5th case) for greetings
  avatar_url?: string;
  roles?: string[]; // User roles from user_roles table (admin, ceo, member, etc.)
}

export interface SignInCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name?: string;
  gdpr_consent?: boolean;
  gdpr_consent_date?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}
