/**
 * Platform API
 * 
 * Centralized exports for all platform API utilities
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

// Supabase client
export { supabase, isAuthenticated, getCurrentUser } from './supabase';

// Public stats for landing page
export { usePublicStats } from './usePublicStats';
export type { PublicStats } from './usePublicStats';

// KP Measurements API
export { useKPMeasurements } from './useKPMeasurements';
export type { KPMeasurement, KPStats, SaveKPData } from './useKPMeasurements';
