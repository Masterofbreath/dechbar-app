/**
 * usePlatformDailyOverride
 *
 * Loads the admin-scheduled daily audio override shown on the Dnes view
 * in the "Denní program" section, between user's pinned program and the
 * platform-featured Akademie program.
 *
 * Returns the highest-priority active override whose time window is current:
 *   active_from <= now() < active_until  (or active_until IS NULL)
 *   AND is_active = true
 *   ORDER BY sort_order ASC (lowest = highest priority)
 *
 * Read-only. Admin manages via in-app admin panel (/app/admin/daily-program).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface DailyOverrideData {
  id: string;
  title: string;
  subtitle: string;
  audio_url: string;
  duration_seconds: number;
  cover_image_url: string | null;
  active_from: string;
  active_until: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface UsePlatformDailyOverrideReturn {
  data: DailyOverrideData | null;
  isLoading: boolean;
  error: string | null;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

async function fetchDailyOverride(): Promise<DailyOverrideData | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('platform_daily_override')
    .select('*')
    .eq('is_active', true)
    .lte('active_from', now)
    .or(`active_until.is.null,active_until.gt.${now}`)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as DailyOverrideData | null;
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function usePlatformDailyOverride(): UsePlatformDailyOverrideReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: akademieKeys.dailyOverride(),
    queryFn: fetchDailyOverride,
    staleTime: 1000 * 60 * 5,  // 5 min
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst denní program' : null,
  };
}
