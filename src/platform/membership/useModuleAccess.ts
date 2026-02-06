/**
 * useModuleAccess Hook
 * 
 * Check if user has access to a specific module.
 * Now reads from unified user state store (real-time synced).
 * 
 * @package DechBar_App
 * @subpackage Platform/Membership
 * @since Original
 * @updated 2.47.0 - Use unified user state store (no React Query!)
 */

import { useUserState } from '@/platform/user/userStateStore';

interface UseModuleAccessReturn {
  hasAccess: boolean;
  isLoading: boolean;
  module: { module_id: string } | null;
  error: Error | null;
}

/**
 * Check if user owns a specific module
 * 
 * @param moduleId - Module ID to check (e.g., 'studio', 'challenges', 'akademie')
 */
export function useModuleAccess(
  moduleId: string
): UseModuleAccessReturn {
  // ✅ NEW: Read from unified store (real-time synced!)
  const ownedModules = useUserState((state) => state.ownedModules);
  const isLoading = useUserState((state) => state.isLoading);
  
  const hasAccess = ownedModules.includes(moduleId);
  
  return {
    hasAccess,
    isLoading,
    module: hasAccess ? { module_id: moduleId } : null,
    error: null, // No errors in unified store (handled internally)
  };
}
