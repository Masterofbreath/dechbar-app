/**
 * Authentication Module
 * 
 * Public exports for authentication
 * 
 * MIGRATION NOTE (v2.46.0):
 * - useAuth: Backward-compatible wrapper (safe for existing code)
 * - useAuthStore: Direct Zustand store access (recommended for new code)
 * - useInitializeAuth: Initialize auth store (call once in RootLayout.tsx)
 * - useLoadUserRoles: Load roles from DB after auth (call once in RootLayout.tsx)
 * - roleService: NEW - Role management service with caching
 * - roleCache: NEW - localStorage cache manager for roles
 */

export { useAuth } from './useAuth';
export { useAuthStore } from './authStore';
export { useInitializeAuth } from './useInitializeAuth';
export { useIsAdmin } from './hooks/useIsAdmin';
export { useLoadUserRoles } from './hooks/useLoadUserRoles';
export { roleService } from './roleService';
export { roleCache } from './roleCache';
export type { User, SignInCredentials, SignUpCredentials, AuthState } from './types';
