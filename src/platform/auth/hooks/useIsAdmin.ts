/**
 * useIsAdmin Hook
 * 
 * Hook to check if current user has admin role.
 * Used for conditional rendering of admin features and AdminGuard component.
 * 
 * Now reads from unified user state store (real-time synced).
 * 
 * @returns true if user has 'admin' or 'ceo' role
 * 
 * @package DechBar_App
 * @subpackage Platform/Auth/Hooks
 * @since 2.44.0
 * @updated 2.47.0 - Use unified user state store
 */

import { useUserState } from '@/platform/user/userStateStore';

export function useIsAdmin(): boolean {
  // ✅ NEW: Read from unified store (real-time synced!)
  const isAdmin = useUserState((state) => state.isAdmin);
  return isAdmin;
}
