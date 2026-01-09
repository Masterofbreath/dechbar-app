/**
 * useModules Hook
 * 
 * Fetch all active modules from Supabase database.
 * This is the SINGLE SOURCE OF TRUTH for module pricing and metadata.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import type { Module } from './types';

/**
 * Fetch all active modules
 * 
 * Modules are loaded from database, ensuring pricing is always current.
 * Data is cached for 5 minutes to reduce API calls.
 */
export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: async (): Promise<Module[]> => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }

      return data as Module[];
    },
    // Cache for 5 minutes (pricing doesn't change often)
    staleTime: 5 * 60 * 1000,
    // Keep in cache for 10 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch specific module by ID
 * 
 * @param moduleId - Module ID (e.g., 'studio', 'challenges')
 */
export function useModule(moduleId: string) {
  return useQuery({
    queryKey: ['module', moduleId],
    queryFn: async (): Promise<Module> => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) {
        console.error(`Error fetching module ${moduleId}:`, error);
        throw error;
      }

      return data as Module;
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Only fetch if moduleId is provided
    enabled: !!moduleId,
  });
}

/**
 * Fetch user's purchased modules
 * 
 * @param userId - User ID
 */
export function useUserModules(userId?: string) {
  return useQuery({
    queryKey: ['user-modules', userId],
    queryFn: async (): Promise<UserModule[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_modules')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user modules:', error);
        throw error;
      }

      return data as UserModule[];
    },
    // Only fetch if userId exists
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute (user purchases change less often)
  });
}

export type { Module, UserModule } from './types';
