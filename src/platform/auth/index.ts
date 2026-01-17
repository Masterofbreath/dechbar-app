/**
 * Authentication Module
 * 
 * Public exports for authentication
 * 
 * MIGRATION NOTE:
 * - useAuth: Backward-compatible wrapper (safe for existing code)
 * - useAuthStore: Direct Zustand store access (recommended for new code)
 * - useInitializeAuth: Initialize auth store (call once in App.tsx)
 */

export { useAuth } from './useAuth';
export { useAuthStore } from './authStore';
export { useInitializeAuth } from './useInitializeAuth';
export type { User, SignInCredentials, SignUpCredentials, AuthState } from './types';
