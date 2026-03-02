/**
 * useActiveDailyProgram
 *
 * Čte uživatelův pinnutý denní program z user_active_program,
 * načítá kompletní data programu (JOIN modules + akademie_categories)
 * a počítá stav postupného odemykání dnů na základě launch_date.
 *
 * Vrací:
 *   data.program          — kompletní data programu (ActiveDailyProgramInfo)
 *   data.daysElapsed      — kolik dní uplynulo od launch_date (Infinity = vše odemčeno)
 *   data.notStartedYet    — true, pokud launch_date je v budoucnosti
 *   data.startDate        — Date objekt launch_date nebo null
 *   setActiveProgram()    — uloží/přepíše pinnutý program uživatele
 *   clearActiveProgram()  — odstraní pin
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface ActiveDailyProgramInfo {
  /** UUID záznamu v akademie_programs */
  id: string;
  /** Slug modulu, e.g. 'digitalni-ticho' */
  module_id: string;
  /** Aliased pro TodaysChallengeButton + StickyPlayer */
  program_uuid: string;
  name: string;
  cover_image_url: string | null;
  category_id: string;
  /** Slug kategorie — nutný pro navigaci ze StickyPlayeru */
  category_slug: string;
  duration_days: number | null;
  daily_minutes: number | null;
  launch_date: string | null;
  description_long: string | null;
  price_czk: number;
  sort_order: number;
  isOwned: boolean;
  isLocked: boolean;
  isFavorite: boolean;
}

export interface ActiveDailyProgramData {
  program: ActiveDailyProgramInfo;
  moduleId: string;
  /**
   * Počet dní od launch_date (včetně dnešního).
   * Infinity = program nemá launch_date → vše odemčeno.
   */
  daysElapsed: number;
  /** true pokud launch_date je v budoucnosti — program ještě nezačal */
  notStartedYet: boolean;
  startDate: Date | null;
  /**
   * Nejbližší nesplněná dostupná lekce.
   * null = program dokončen (nebo ještě nezačal / žádné lekce).
   * TodaysChallengeButton ho používá pro přehrání audio z Dnes stránky.
   */
  nextLesson: import('@/modules/akademie/types').AkademieLesson | null;
}

export interface UseActiveDailyProgramReturn {
  data: ActiveDailyProgramData | null;
  isLoading: boolean;
  error: string | null;
  setActiveProgram: (moduleId: string) => Promise<void>;
  clearActiveProgram: () => Promise<void>;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

interface RawActiveRecord {
  module_id: string;
}

interface RawLesson {
  id: string;
  series_id: string;
  module_id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  day_number: number;
  sort_order: number;
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

async function fetchActiveProgram(
  userId: string,
  userCreatedAt?: string,
): Promise<ActiveDailyProgramData | null> {
  // 1. Zjisti module_id z user_active_program
  // activated_at ukládáme pro analytics, ale NEPOČÍTÁME z něj start výzvy —
  // pinnutí = UI preference, ne "začínám odznovu".
  const { data: activeRec, error: activeErr } = await supabase
    .from('user_active_program')
    .select('module_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (activeErr) throw activeErr;
  if (!activeRec) return null;

  const activeModuleId = (activeRec as Pick<RawActiveRecord, 'module_id'>).module_id;

  // 2. Načti kompletní data programu (JOIN modules + akademie_categories)
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
    .eq('module_id', activeModuleId)
    .maybeSingle();

  if (progErr) throw progErr;
  if (!prog) return null;

  const r = prog as unknown as RawProgramJoined;

  const programInfo: ActiveDailyProgramInfo = {
    id: r.id,
    module_id: r.module_id,
    program_uuid: r.id,
    name: r.modules?.name ?? r.module_id,
    cover_image_url: r.cover_image_url,
    category_id: r.akademie_categories?.id ?? '',
    category_slug: r.akademie_categories?.slug ?? '',
    duration_days: r.duration_days,
    daily_minutes: r.daily_minutes,
    launch_date: r.launch_date,
    description_long: r.description_long,
    price_czk: r.modules?.price_czk ?? 990,
    sort_order: r.sort_order,
    isOwned: true,
    isLocked: false,
    isFavorite: false,
  };

  // 3. Výpočet postupného odemykání
  // Nový den začíná ve 4:00 ráno CET — posuneme osu o 4 hodiny dozadu.
  //
  // Per-user start date: MAX(user.created_at, program.launch_date)
  // → Registroval se před globálním startem → sleduje globální start.
  // → Registroval se po globálním startu → sleduje svůj datum registrace.
  //
  // DŮLEŽITÉ: pinnutí (activated_at) start NERESETUJE — jde jen o UI preferenci.
  const UNLOCK_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000;
  const launchDate = r.launch_date ? new Date(r.launch_date) : null;
  const userCreatedAtDate = userCreatedAt ? new Date(userCreatedAt) : null;

  // effectiveStartDate = MAX(user.created_at, launch_date)
  const effectiveStartDate =
    userCreatedAtDate && launchDate && userCreatedAtDate > launchDate
      ? userCreatedAtDate
      : launchDate;

  const now = new Date();

  const daysElapsed = effectiveStartDate
    ? Math.max(
        0,
        Math.floor(
          ((now.getTime() - UNLOCK_HOUR_OFFSET_MS) - (effectiveStartDate.getTime() - UNLOCK_HOUR_OFFSET_MS)) / 86_400_000,
        ) + 1,
      )
    : Infinity;

  const notStartedYet = effectiveStartDate ? effectiveStartDate > now : false;

  // 4. Načti všechny lekce programu seřazené podle day_number
  const { data: lessonsRaw, error: lessonsErr } = await supabase
    .from('akademie_lessons')
    .select('id, series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order')
    .eq('module_id', activeModuleId)
    .order('day_number', { ascending: true })
    .order('sort_order', { ascending: true });

  if (lessonsErr) throw lessonsErr;

  const lessons = (lessonsRaw ?? []) as RawLesson[];

  // 5. Načti dokončené lekce uživatele
  const completedIds = new Set<string>();
  if (lessons.length > 0) {
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .in('lesson_id', lessons.map((l) => l.id));
    (progress ?? []).forEach((row: { lesson_id: string }) => completedIds.add(row.lesson_id));
  }

  // 6. Najdi první dostupnou (day_number <= daysElapsed) nesplněnou lekci
  const nextLesson =
    lessons.find(
      (l) => !completedIds.has(l.id) && (daysElapsed === Infinity || l.day_number <= daysElapsed),
    ) ?? null;

  return {
    program: programInfo,
    moduleId: activeModuleId,
    daysElapsed,
    notStartedYet,
    startDate: effectiveStartDate,
    nextLesson,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function useActiveDailyProgram(
  userId: string | undefined,
  userCreatedAt?: string,
): UseActiveDailyProgramReturn {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [...akademieKeys.activeProgram(userId ?? ''), userCreatedAt ?? 'unknown'],
    queryFn: () => fetchActiveProgram(userId!, userCreatedAt),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const setActiveProgram = async (moduleId: string) => {
    if (!userId) return;
    const { error: upsertErr } = await supabase
      .from('user_active_program')
      .upsert(
        { user_id: userId, module_id: moduleId, activated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (upsertErr) throw upsertErr;
    await qc.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId) });
  };

  const clearActiveProgram = async () => {
    if (!userId) return;
    const { error: deleteErr } = await supabase
      .from('user_active_program')
      .delete()
      .eq('user_id', userId);
    if (deleteErr) throw deleteErr;
    await qc.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId) });
  };

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst denní program' : null,
    setActiveProgram,
    clearActiveProgram,
  };
}
