/**
 * usePlatformFeaturedProgram
 *
 * Načítá admin-nastavený doporučený program z platform_featured_program
 * a vrací kompletní data programu (JOIN modules + akademie_categories).
 *
 * Používá se v TodaysChallengeButton jako fallback (priorita 3),
 * když uživatel nemá pinnutý vlastní program a není aktivní daily override.
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';
import type { ActiveDailyProgramInfo } from './useActiveDailyProgram';

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface FeaturedProgramData {
  featuredRecord: {
    module_id: string;
    title_override: string | null;
  };
  program: ActiveDailyProgramInfo;
  /**
   * Alias pro title_override — TodaysChallengeButton ho čte přímo z data.
   * undefined = žádný override → použij program.name.
   */
  titleOverride: string | undefined;
}

export interface UsePlatformFeaturedProgramReturn {
  data: FeaturedProgramData | null;
  isLoading: boolean;
  error: string | null;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

interface RawFeaturedRecord {
  module_id: string;
  title_override: string | null;
  is_active: boolean;
}

interface RawProgramJoined {
  id: string;
  module_id: string;
  cover_image_url: string | null;
  description_long: string | null;
  sort_order: number;
  duration_days: number | null;
  daily_minutes: number | null;
  launch_date: string | null;
  modules: { name: string; price_czk: number | null } | null;
  akademie_categories: { id: string; slug: string } | null;
}

async function fetchFeaturedProgram(): Promise<FeaturedProgramData | null> {
  const now = new Date().toISOString();

  // 1. Načti aktivní featured záznam
  const { data: featured, error: featuredErr } = await supabase
    .from('platform_featured_program')
    .select('module_id, title_override, is_active')
    .eq('is_active', true)
    .or(`active_until.is.null,active_until.gt.${now}`)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featuredErr) throw featuredErr;
  if (!featured) return null;

  const featuredRec = featured as RawFeaturedRecord;

  // 2. Načti data programu (JOIN modules + akademie_categories)
  const { data: prog, error: progErr } = await supabase
    .from('akademie_programs')
    .select(`
      id,
      module_id,
      cover_image_url,
      description_long,
      sort_order,
      duration_days,
      daily_minutes,
      launch_date,
      modules ( name, price_czk ),
      akademie_categories ( id, slug )
    `)
    .eq('module_id', featuredRec.module_id)
    .maybeSingle();

  if (progErr) throw progErr;
  if (!prog) return null;

  const r = prog as unknown as RawProgramJoined;

  const programInfo: ActiveDailyProgramInfo = {
    id: r.id,
    module_id: r.module_id,
    program_uuid: r.id,
    name: featuredRec.title_override ?? (r.modules?.name ?? r.module_id),
    cover_image_url: r.cover_image_url,
    category_id: r.akademie_categories?.id ?? '',
    category_slug: r.akademie_categories?.slug ?? '',
    duration_days: r.duration_days,
    daily_minutes: r.daily_minutes,
    launch_date: r.launch_date,
    description_long: r.description_long,
    price_czk: r.modules?.price_czk ?? 990,
    sort_order: r.sort_order,
    isOwned: false,
    isLocked: true,
    isFavorite: false,
  };

  return {
    featuredRecord: {
      module_id: featuredRec.module_id,
      title_override: featuredRec.title_override,
    },
    program: programInfo,
    titleOverride: featuredRec.title_override ?? undefined,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function usePlatformFeaturedProgram(): UsePlatformFeaturedProgramReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: akademieKeys.featuredProgram(),
    queryFn: fetchFeaturedProgram,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst doporučený program' : null,
  };
}
