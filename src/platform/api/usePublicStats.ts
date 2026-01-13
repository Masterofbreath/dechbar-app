/**
 * usePublicStats Hook
 * 
 * Provides public statistics for landing page (community size, tracks, etc.)
 * Uses React Query for caching and provides fallback data if API fails.
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

import { useQuery } from '@tanstack/react-query';

export interface PublicStats {
  total_users: number;
  total_audio_tracks: number;
  community_members: number;
  certification_valid: boolean;
}

/**
 * Fetch public statistics for landing page
 * 
 * For MVP, returns static data.
 * In future, will call Supabase Edge Function for real-time stats.
 * 
 * @returns React Query result with PublicStats
 */
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async (): Promise<PublicStats> => {
      // MVP: Static data
      // Future: Call Supabase Edge Function
      // const { data, error } = await supabase.functions.invoke('public-stats');
      
      return {
        total_users: 1150,
        total_audio_tracks: 100,
        community_members: 1150,
        certification_valid: true,
      };
    },
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Refetch on window focus
    refetchOnWindowFocus: true,
    // Don't fail the whole app if stats fail
    retry: 1,
    // Fallback data if API fails (landing page stays functional)
    placeholderData: {
      total_users: 1150,
      total_audio_tracks: 100,
      community_members: 1150,
      certification_valid: true,
    },
  });
}
