/**
 * useKPAdminStats — Admin KP Distribution & Coverage Hook
 *
 * Volá dvě SECURITY DEFINER RPC funkce pro admin KP analýzu:
 *   admin_get_kp_distribution() → histogram bucketů KP hodnot
 *   admin_get_kp_coverage()     → coverage stats + medián (odolný vůči outlierům)
 *
 * Admin check je na route level (adminLoader) — zde stačí authenticated.
 * staleTime: 10 min — KP data se mění max 1× denně na uživatele.
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

// ── Typy ─────────────────────────────────────────────────────

export interface KPBucket {
  bucket_label: string;
  bucket_min: number;
  bucket_max: number;
  user_count: number;
  avg_seconds: number;
}

export interface KPCoverage {
  measured_count: number;
  not_measured_count: number;
  total_users: number;
  coverage_pct: number;
  overall_median_seconds: number;
}

// ── Query keys ────────────────────────────────────────────────

const kpAdminKeys = {
  distribution: ['kpAdmin', 'distribution'] as const,
  coverage:     ['kpAdmin', 'coverage']     as const,
};

// ── Hook ──────────────────────────────────────────────────────

export function useKPAdminStats(): {
  distribution: KPBucket[];
  coverage: KPCoverage | null;
  isLoading: boolean;
  error: string | null;
} {
  const { data: distribution, isLoading: distLoading, error: distError } = useQuery({
    queryKey: kpAdminKeys.distribution,
    queryFn: async (): Promise<KPBucket[]> => {
      const { data, error } = await supabase.rpc('admin_get_kp_distribution');
      if (error) throw new Error(error.message);
      return (data as KPBucket[]) ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: coverage, isLoading: covLoading, error: covError } = useQuery({
    queryKey: kpAdminKeys.coverage,
    queryFn: async (): Promise<KPCoverage | null> => {
      const { data, error } = await supabase.rpc('admin_get_kp_coverage');
      if (error) throw new Error(error.message);
      const rows = data as KPCoverage[] | null;
      return rows?.[0] ?? null;
    },
    staleTime: 10 * 60 * 1000,
  });

  const error = distError || covError
    ? ((distError || covError) as Error).message
    : null;

  return {
    distribution: distribution ?? [],
    coverage:     coverage ?? null,
    isLoading:    distLoading || covLoading,
    error,
  };
}
