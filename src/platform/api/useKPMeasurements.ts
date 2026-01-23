/**
 * useKPMeasurements - React Query Hook for KP Data
 * 
 * Public API pro práci s KP měřeními.
 * Používají: TOP NAV, Pokrok Module, School Module, AI Coach.
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 * @since 0.3.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from '@/platform/auth';
import { calculateTrend, getBestKP, calculatePeriodAverage } from '@/utils/kp';

/**
 * KP Measurement interface (matches DB schema)
 */
export interface KPMeasurement {
  id: string;
  user_id: string;
  value_seconds: number;
  measured_at: string;
  attempt_1_seconds: number;
  attempt_2_seconds: number | null;
  attempt_3_seconds: number | null;
  attempts_count: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  is_morning_measurement: boolean;
  is_valid: boolean;
  is_first_measurement: boolean;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  measurement_type?: 'manual' | 'hrv' | 'smart';
  notes?: string;
  created_at: string;
}

/**
 * KP Statistics interface
 */
export interface KPStats {
  currentKP: number | null;      // Poslední validní KP
  firstKP: number | null;         // První KP ever
  averageKP: number;              // Průměr validních měření
  bestKP: number;                 // Nejvyšší KP
  totalMeasurements: number;      // Celkový počet měření
  validMeasurements: number;      // Jen validní (ranní)
  weeklyStreak: number;           // Kolik týdnů v řadě měřil
  trend: number;                  // +/- od minulého měření
}

/**
 * Save KP data interface
 */
export interface SaveKPData {
  value_seconds: number;
  attempt_1_seconds: number;
  attempt_2_seconds?: number;
  attempt_3_seconds?: number;
  attempts_count: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  is_morning_measurement: boolean;
  is_valid: boolean;
  hour_of_measurement: number;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  measurement_duration_ms?: number;
  notes?: string;
  measured_in_context?: 'homepage_demo' | 'top_nav' | 'pokrok_module';
}

/**
 * Query key factory
 */
const kpKeys = {
  all: ['kp'] as const,
  measurements: (userId: string) => [...kpKeys.all, 'measurements', userId] as const,
  stats: (userId: string) => [...kpKeys.all, 'stats', userId] as const,
};

/**
 * Fetch all KP measurements for user
 */
async function fetchKPMeasurements(userId: string): Promise<KPMeasurement[]> {
  const { data, error } = await supabase
    .from('kp_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data || [];
}

/**
 * Calculate stats from measurements
 */
function calculateStats(measurements: KPMeasurement[]): KPStats {
  const validMeasurements = measurements.filter(m => m.is_valid);
  const validValues = validMeasurements.map(m => m.value_seconds);
  
  // Current KP (poslední validní)
  const currentKP = validMeasurements.length > 0 
    ? validMeasurements[0].value_seconds 
    : null;
  
  // First KP
  const firstMeasurement = measurements.find(m => m.is_first_measurement);
  const firstKP = firstMeasurement?.value_seconds || null;
  
  // Previous KP (druhé nejnovější validní měření)
  const previousKP = validMeasurements.length > 1
    ? validMeasurements[1].value_seconds
    : null;
  
  // Trend
  const trend = currentKP !== null ? calculateTrend(currentKP, previousKP) : 0;
  
  // Weekly streak calculation (simplified - full calculation in useKPStreak)
  const weeklyStreak = 0; // TODO: Implement full streak calculation
  
  return {
    currentKP,
    firstKP,
    averageKP: calculatePeriodAverage(validValues),
    bestKP: getBestKP(validValues),
    totalMeasurements: measurements.length,
    validMeasurements: validMeasurements.length,
    weeklyStreak,
    trend,
  };
}

/**
 * React Query: Fetch KP measurements
 */
function useKPMeasurementsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: kpKeys.measurements(userId || ''),
    queryFn: () => fetchKPMeasurements(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * React Query: Calculate KP stats
 */
function useKPStatsQuery(userId: string | undefined, measurements: KPMeasurement[]) {
  return useQuery({
    queryKey: kpKeys.stats(userId || ''),
    queryFn: () => calculateStats(measurements),
    enabled: !!userId && measurements.length > 0,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * React Query: Save KP measurement mutation
 */
function useSaveKPMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SaveKPData) => {
      if (!userId) throw new Error('User not authenticated');
      
      // Check if this is first measurement
      const existingCount = await supabase
        .from('kp_measurements')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const isFirstMeasurement = (existingCount.count || 0) === 0;
      
      // Insert measurement
      const { data: inserted, error } = await supabase
        .from('kp_measurements')
        .insert({
          user_id: userId,
          ...data,
          is_first_measurement: isFirstMeasurement,
        })
        .select()
        .single();
      
      if (error) throw error;
      return inserted;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: kpKeys.measurements(userId!) });
      queryClient.invalidateQueries({ queryKey: kpKeys.stats(userId!) });
    },
  });
}

/**
 * Main useKPMeasurements Hook
 * 
 * Public API pro práci s KP měřeními.
 * 
 * @returns KP data, stats, and actions
 * 
 * @example
 * const { currentKP, saveKP, measurements, stats } = useKPMeasurements();
 * 
 * // Zobrazit aktuální KP
 * <div>{currentKP}s</div>
 * 
 * // Uložit nové měření
 * await saveKP({
 *   value_seconds: 35,
 *   attempt_1_seconds: 33,
 *   attempt_2_seconds: 36,
 *   attempt_3_seconds: 36,
 *   attempts_count: 3,
 *   // ... rest of data
 * });
 */
export function useKPMeasurements() {
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch measurements
  const measurementsQuery = useKPMeasurementsQuery(userId);
  const measurements = measurementsQuery.data || [];
  
  // Calculate stats
  const statsQuery = useKPStatsQuery(userId, measurements);
  const stats = statsQuery.data;
  
  // Save mutation
  const saveMutation = useSaveKPMutation(userId);
  
  return {
    // Current state
    currentKP: stats?.currentKP ?? null,
    firstKP: stats?.firstKP ?? null,
    
    // All measurements (sorted, newest first)
    measurements,
    
    // Statistics
    stats: stats ?? {
      currentKP: null,
      firstKP: null,
      averageKP: 0,
      bestKP: 0,
      totalMeasurements: 0,
      validMeasurements: 0,
      weeklyStreak: 0,
      trend: 0,
    },
    
    // Actions
    saveKP: async (data: SaveKPData) => {
      return saveMutation.mutateAsync(data);
    },
    
    // Loading states
    isLoading: measurementsQuery.isLoading || statsQuery.isLoading,
    isSaving: saveMutation.isPending,
    
    // Errors
    error: measurementsQuery.error || statsQuery.error || saveMutation.error,
  };
}
