/**
 * useExerciseNameExists - Async Unique Name Check
 * 
 * React Query hook to check if exercise name already exists for current user.
 * Used for preventing duplicate custom exercise names.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/ExerciseCreator/Hooks
 * @since 1.0.0
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth';

/**
 * Check if exercise name exists (debounced via React Query)
 * 
 * @param name - Exercise name to check
 * @param excludeId - Exclude this ID (for edit mode)
 * @returns true if name exists (duplicate), false if unique
 */
export function useExerciseNameExists(name: string, excludeId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['exercise-name-exists', user?.id, name, excludeId],
    queryFn: async () => {
      if (!user || !name || name.length < 3) return false;
      
      let query = supabase
        .from('exercises')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('category', 'custom')
        .ilike('name', name)
        .is('deleted_at', null);
      
      // Exclude current exercise in edit mode
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      
      return (count || 0) > 0;
    },
    enabled: !!user && name.length >= 3,
    staleTime: 5000, // 5s cache (acts as debounce)
  });
}
