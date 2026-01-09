/**
 * useModuleAccess Hook
 * 
 * Check if user has access to a specific module
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import type { UserModule } from '../modules/types';

interface UseModuleAccessReturn {
  hasAccess: boolean;
  isLoading: boolean;
  module: UserModule | null;
  error: Error | null;
}

/**
 * Check if user owns a specific module
 * 
 * @param moduleId - Module ID to check (e.g., 'studio')
 * @param userId - User ID
 */
export function useModuleAccess(
  moduleId: string,
  userId?: string
): UseModuleAccessReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['module-access', moduleId, userId],
    queryFn: async (): Promise<UserModule | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (error) {
        console.error(`Error checking access to module ${moduleId}:`, error);
        throw error;
      }

      return data as UserModule | null;
    },
    enabled: !!userId && !!moduleId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const module = data || null;
  
  // Check if user has active access
  const hasAccess = module !== null && (
    module.purchase_type === 'lifetime' ||
    (module.subscription_status === 'active' && 
     (!module.current_period_end || new Date(module.current_period_end) > new Date()))
  );

  return {
    hasAccess,
    isLoading,
    module,
    error: error as Error | null,
  };
}
