/**
 * usePlatformFeaturedProgram
 *
 * Loads the admin-configured featured program shown on Dnes view
 * to users who have not pinned their own daily program.
 *
 * Read-only — no mutations. Admin manages via Supabase dashboard.
 * Returns the highest-priority active featured program (sort_order ASC).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';
import type { ActiveDailyProgramInfo } from './useActiveDailyProgram';

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface FeaturedProgramData {
  program: ActiveDailyProgramInfo;
  titleOverride: string | null; // Admin custom headline (e.g. "SPECIÁLNÍ DECHPRESSO")
}

export interface UsePlatformFeaturedProgramReturn {
  data: FeaturedProgramData | null;
  isLoading: boolean;
  error: string | null;
}

// --------------------------------------------------
// Raw DB row shapes
// --------------------------------------------------

interface RawFeaturedRow {
  module_id: string;
  title_override: string | null;
}

interface RawProgramRow {
  id: string;
  module_id: string;
  cover_image_url: string | null;
  duration_days: number | null;
  daily_minutes: number | null;
  modules: { id: string; name: string } | null;
  akademie_categories: { slug: string } | null;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

async function fetchFeaturedProgram(): Promise<FeaturedProgramData | null> {
  // 1. Load active featured row (highest priority = lowest sort_order)
  const { data: featuredRow, error: featuredError } = await supabase
    .from('platform_featured_program')
    .select('module_id, title_override')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featuredError) throw featuredError;
  if (!featuredRow) return null;

  const raw = featuredRow as unknown as RawFeaturedRow;

  // 2. Load program details
  const { data: programRow, error: programError } = await supabase
    .from('akademie_programs')
    .select('id, module_id, cover_image_url, duration_days, daily_minutes, modules(id, name), akademie_categories(slug)')
    .eq('module_id', raw.module_id)
    .maybeSingle();

  if (programError) throw programError;
  if (!programRow) return null;

  const prog = programRow as unknown as RawProgramRow;

  return {
    program: {
      module_id: prog.module_id,
      program_uuid: prog.id,
      name: prog.modules?.name ?? prog.module_id,
      cover_image_url: prog.cover_image_url,
      duration_days: prog.duration_days,
      daily_minutes: prog.daily_minutes,
      category_slug: prog.akademie_categories?.slug ?? null,
    },
    titleOverride: raw.title_override,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function usePlatformFeaturedProgram(): UsePlatformFeaturedProgramReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: akademieKeys.featuredProgram(),
    queryFn: fetchFeaturedProgram,
    staleTime: 1000 * 60 * 10, // 10 min — changes infrequently
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst doporučený program' : null,
  };
}
