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
import { supabase } from './supabase';

export interface PublicStats {
  total_users: number;
  total_audio_tracks: number;
  community_members: number;
  certification_valid: boolean;
  total_minutes_breathed?: number;
}

const STATIC_FALLBACK: PublicStats = {
  total_users: 416,
  total_audio_tracks: 100,
  community_members: 416,
  certification_valid: true,
  total_minutes_breathed: 0,
};

/**
 * Fetch public statistics for landing page via Supabase Edge Function.
 * Falls back to static data if the function is unavailable.
 *
 * Edge Function: supabase/functions/public-stats/index.ts
 * Cache: 1h CDN (s-maxage=3600) + 5min client staleTime
 */
export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: async (): Promise<PublicStats> => {
      try {
        const { data, error } = await supabase.functions.invoke('public-stats');

        if (error || !data) {
          console.warn('[usePublicStats] Edge function unavailable, using fallback');
          return STATIC_FALLBACK;
        }

        return {
          total_users: data.total_users ?? STATIC_FALLBACK.total_users,
          total_audio_tracks: STATIC_FALLBACK.total_audio_tracks,
          community_members: data.community_members ?? STATIC_FALLBACK.community_members,
          certification_valid: true,
          total_minutes_breathed: data.total_minutes_breathed ?? 0,
        };
      } catch (err) {
        console.warn('[usePublicStats] Error fetching stats:', err);
        return STATIC_FALLBACK;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: STATIC_FALLBACK,
  });
}
