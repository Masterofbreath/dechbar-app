/**
 * useActiveDailyProgram
 *
 * Loads the user's pinned daily program and determines the next lesson to play.
 *
 * Query strategy (no N+1):
 *   1. user_active_program          → module_id
 *   2. akademie_programs JOIN modules → name, cover, duration_days, daily_minutes
 *   3. akademie_series               → series list (sort_order ASC)
 *   4. akademie_lessons              → ALL lessons for module (sort_order ASC)
 *   5. user_lesson_progress          → completed lesson IDs for user (batch)
 *   JS: find first lesson not in completed set = nextLesson
 *
 * Mutations:
 *   setActiveProgram(moduleId) — upsert (switch programs)
 *   clearActiveProgram()       — delete row
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';
import type { AkademieLesson, AkademieSeries } from '@/modules/akademie/types';

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface ActiveDailyProgramInfo {
  module_id: string;
  /** UUID z akademie_programs.id — potřebný pro source_program_id v Track (StickyPlayer navigace) */
  program_uuid: string;
  name: string;
  cover_image_url: string | null;
  duration_days: number | null;
  daily_minutes: number | null;
  /** Slug kategorie — potřebný pro source_category_slug v Track */
  category_slug: string | null;
}

export interface ActiveDailyProgramData {
  program: ActiveDailyProgramInfo;
  nextLesson: AkademieLesson | null; // null = all lessons completed
  nextLessonSeries: AkademieSeries | null;
  totalLessons: number;
  completedLessons: number;
}

export interface UseActiveDailyProgramReturn {
  data: ActiveDailyProgramData | null;
  isLoading: boolean;
  error: string | null;
  setActiveProgram: (moduleId: string) => void;
  clearActiveProgram: () => void;
}

// --------------------------------------------------
// Raw DB row shapes
// --------------------------------------------------

interface RawProgramRow {
  id: string;
  module_id: string;
  cover_image_url: string | null;
  duration_days: number | null;
  daily_minutes: number | null;
  modules: { id: string; name: string } | null;
  akademie_categories: { slug: string } | null;
}

interface RawProgressRow {
  lesson_id: string;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

async function fetchActiveDailyProgram(
  userId: string,
): Promise<ActiveDailyProgramData | null> {
  // 1. Load user's active program
  const { data: activeRow, error: activeError } = await supabase
    .from('user_active_program')
    .select('module_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (activeError) throw activeError;
  if (!activeRow) return null;

  const moduleId = activeRow.module_id;

  // 2. Load program detail (JOIN modules for name, akademie_categories for slug)
  const { data: programRow, error: programError } = await supabase
    .from('akademie_programs')
    .select('id, module_id, cover_image_url, duration_days, daily_minutes, modules(id, name), akademie_categories(slug)')
    .eq('module_id', moduleId)
    .maybeSingle();

  if (programError) throw programError;
  if (!programRow) return null;

  const raw = programRow as unknown as RawProgramRow;

  const program: ActiveDailyProgramInfo = {
    module_id: raw.module_id,
    program_uuid: raw.id,
    name: raw.modules?.name ?? moduleId,
    cover_image_url: raw.cover_image_url,
    duration_days: raw.duration_days,
    daily_minutes: raw.daily_minutes,
    category_slug: raw.akademie_categories?.slug ?? null,
  };

  // 3. Load all series for this module (sort_order ASC)
  const { data: seriesRows, error: seriesError } = await supabase
    .from('akademie_series')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true });

  if (seriesError) throw seriesError;
  const series = (seriesRows ?? []) as AkademieSeries[];

  if (series.length === 0) {
    return { program, nextLesson: null, nextLessonSeries: null, totalLessons: 0, completedLessons: 0 };
  }

  // 4. Load ALL lessons for this module at once (sort_order ASC)
  const { data: lessonRows, error: lessonError } = await supabase
    .from('akademie_lessons')
    .select('*')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (lessonError) throw lessonError;
  const allLessons = (lessonRows ?? []) as AkademieLesson[];

  if (allLessons.length === 0) {
    return { program, nextLesson: null, nextLessonSeries: null, totalLessons: 0, completedLessons: 0 };
  }

  // 5. Load all progress for this user + these lessons (batch)
  const lessonIds = allLessons.map((l) => l.id);
  const { data: progressRows, error: progressError } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) throw progressError;

  const completedIds = new Set<string>(
    ((progressRows ?? []) as RawProgressRow[]).map((r) => r.lesson_id),
  );

  // 6. Build series lookup for nextLessonSeries resolution
  const seriesById = new Map<string, AkademieSeries>(series.map((s) => [s.id, s]));

  // 7. Find first uncompleted lesson (lessons already sorted by sort_order from DB)
  //    Series ordering is guaranteed because lessons are ordered by sort_order globally,
  //    and series share that sort space via day_number / sort_order alignment.
  //    For multi-series programs: sort lessons by (series.sort_order, lesson.sort_order).
  const seriesSortOrder = new Map<string, number>(series.map((s) => [s.id, s.sort_order]));

  const sortedLessons = [...allLessons].sort((a, b) => {
    const sa = seriesSortOrder.get(a.series_id) ?? 0;
    const sb = seriesSortOrder.get(b.series_id) ?? 0;
    if (sa !== sb) return sa - sb;
    return a.sort_order - b.sort_order;
  });

  const nextLesson = sortedLessons.find((l) => !completedIds.has(l.id)) ?? null;
  const nextLessonSeries = nextLesson ? (seriesById.get(nextLesson.series_id) ?? null) : null;

  return {
    program,
    nextLesson,
    nextLessonSeries,
    totalLessons: allLessons.length,
    completedLessons: completedIds.size,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function useActiveDailyProgram(userId: string | undefined): UseActiveDailyProgramReturn {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: akademieKeys.activeProgram(userId ?? ''),
    queryFn: () => fetchActiveDailyProgram(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 min — short, nextLesson must stay fresh after completion
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const setActiveProgramMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      if (!userId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('user_active_program')
        .upsert({ user_id: userId, module_id: moduleId }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId ?? '') });
    },
  });

  const clearActiveProgramMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('user_active_program')
        .delete()
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId ?? '') });
    },
  });

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst denní program' : null,
    setActiveProgram: (moduleId: string) => setActiveProgramMutation.mutate(moduleId),
    clearActiveProgram: () => clearActiveProgramMutation.mutate(),
  };
}
