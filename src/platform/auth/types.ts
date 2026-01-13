/**
 * Authentication Types
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}
