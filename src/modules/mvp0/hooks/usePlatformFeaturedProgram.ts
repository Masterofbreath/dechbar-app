/**
 * usePlatformFeaturedProgram
 *
 * Načítá admin-nastavený doporučený program z platform_featured_program
 * a vrací kompletní data programu (JOIN modules + akademie_categories).
 *
 * Podporuje:
 * - Per-user start date: effectiveStartDate = MAX(userCreatedAt, launch_date)
 *   → uživatel zaregistrovaný před globálním startem sleduje globální datum
 *   → uživatel zaregistrovaný po globálním startu sleduje svůj osobní start
 *
 * - Early access systém:
 *   → early_access_until = NULL → bez limitu, přístup pro všechny
 *   → early_access_until = DATE → uživatelé zaregistrovaní PO tomto datu vidí výzvu
 *     jako uzamčenou (vyžaduje SMART); dříve registrovaní mají přístup do dokončení
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
import type { AkademieLesson } from '@/modules/akademie/types';

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
  /**
   * Nejbližší nesplněná dostupná lekce.
   * null = všechny dostupné lekce dokončeny / nezačal / uživatel není přihlášen.
   */
  nextLesson: AkademieLesson | null;
  /**
   * true = všechny aktuálně dostupné lekce jsou splněny.
   * TodaysChallengeButton podle toho rozhoduje o stavu locked-completed.
   */
  isAllCompleted: boolean;
  /**
   * Datum konce early access (UTC ISO string). null = bez limitu.
   */
  earlyAccessUntil: string | null;
  /**
   * true = uživatel se zaregistroval před early_access_until → má bezplatný přístup.
   * false = uživatel se zaregistroval po deadline → vyžaduje SMART.
   * Vždy true pokud early_access_until = null (žádný limit).
   */
  userHasEarlyAccess: boolean;
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
  early_access_until: string | null;
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

async function fetchFeaturedProgram(
  userId?: string,
  userCreatedAt?: string,
): Promise<FeaturedProgramData | null> {
  void userCreatedAt; // per-user start date — reserved for future use
  const now = new Date().toISOString();

  // 1. Načti aktivní featured záznam (včetně early_access_until)
  const { data: featured, error: featuredErr } = await supabase
    .from('platform_featured_program')
    .select('module_id, title_override, is_active, early_access_until')
    .eq('is_active', true)
    .or(`active_until.is.null,active_until.gt.${now}`)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featuredErr) throw featuredErr;
  if (!featured) return null;

  const featuredRec = featured as RawFeaturedRecord;

  // 2. Vypočítej early access stav pro tohoto uživatele
  const earlyAccessUntil = featuredRec.early_access_until ?? null;
  const earlyAccessUntilDate = earlyAccessUntil ? new Date(earlyAccessUntil) : null;
  const userCreatedAtDate = userCreatedAt ? new Date(userCreatedAt) : null;

  // Pokud není deadline nastaven → všichni mají přístup.
  // Pokud je deadline nastaven → přístup pouze pro uživatele zaregistrované před ním.
  const userHasEarlyAccess =
    earlyAccessUntilDate === null ||
    (userCreatedAtDate !== null && userCreatedAtDate <= earlyAccessUntilDate);

  // 3. Načti data programu (JOIN modules + akademie_categories)
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

  // 4. Metadata
  const launchDate = r.launch_date ? new Date(r.launch_date) : null;
  const nowDate = new Date();
  const notStartedYet = launchDate ? launchDate > nowDate : false;

  // 5. Načti lekce + progress + completion-based odemykání (stejná logika jako pinnutý flow)
  //
  // Pravidlo: Den N se odemkne ve 4:00 ráno po dni, kdy byl D(N-1) splněn.
  //   - D1 je vždy dostupný (bez podmínky)
  //   - Program bez launch_date → vše odemčeno (admin/CEO)
  //   - challenge_reset_at: lekce splněné před resetem se ignorují
  let nextLesson: AkademieLesson | null = null;
  let isAllCompleted = false;

  if (userId) {
    // Načti lekce + challenge_reset_at paralelně
    const [lessonsRes, activeRes] = await Promise.all([
      supabase
        .from('akademie_lessons')
        .select('id, series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order')
        .eq('module_id', featuredRec.module_id)
        .order('day_number', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase
        .from('user_active_program')
        .select('challenge_reset_at')
        .eq('user_id', userId)
        .eq('module_id', featuredRec.module_id)
        .maybeSingle(),
    ]);

    const lessons = (lessonsRes.data ?? []) as RawLesson[];
    const challengeResetAtDate = activeRes.data?.challenge_reset_at
      ? new Date(activeRes.data.challenge_reset_at)
      : null;

    const completedIds = new Set<string>();
    const completedAt = new Map<string, Date>(); // lesson_id → datum dokončení
    if (lessons.length > 0) {
      const { data: progress } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, completed_at')
        .eq('user_id', userId)
        .in('lesson_id', lessons.map((l) => l.id));
      (progress ?? []).forEach((row: { lesson_id: string; completed_at: string | null }) => {
        completedIds.add(row.lesson_id);
        if (row.completed_at) {
          completedAt.set(row.lesson_id, new Date(row.completed_at));
        }
      });
    }

    // Lekce splněné před resetem se ignorují pro účely gating řetězce
    function isValidAfterReset(lessonId: string): boolean {
      if (!challengeResetAtDate) return true;
      const doneAt = completedAt.get(lessonId);
      return doneAt !== undefined && doneAt >= challengeResetAtDate;
    }

    // Seskup lekce podle day_number
    const lessonsByDay = new Map<number, RawLesson[]>();
    for (const l of lessons) {
      const arr = lessonsByDay.get(l.day_number) ?? [];
      arr.push(l);
      lessonsByDay.set(l.day_number, arr);
    }

    // Completion-based odemykání: stejná logika jako useActiveDailyProgram
    const UNLOCK_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000;

    function computeMaxUnlockedDay(): number {
      if (!launchDate) return Infinity; // admin/CEO — vše odemčeno
      if (notStartedYet) return 0;
      const allDays = [...lessonsByDay.keys()].sort((a, b) => a - b);
      let maxDay = 0;
      for (const day of allDays) {
        if (day === 1) { maxDay = 1; continue; }
        const prevDayLessons = lessonsByDay.get(day - 1) ?? [];
        if (prevDayLessons.length === 0) break;
        const prevDayAllDone = prevDayLessons.every(
          (l) => completedIds.has(l.id) && isValidAfterReset(l.id),
        );
        if (!prevDayAllDone) break;
        const lastCompletedAt = prevDayLessons.reduce<Date | null>((latest, l) => {
          const done = completedAt.get(l.id);
          if (!done) return latest;
          return latest === null || done > latest ? done : latest;
        }, null);
        if (!lastCompletedAt) break;
        const unlockTime = new Date(
          Math.floor((lastCompletedAt.getTime() - UNLOCK_HOUR_OFFSET_MS) / 86_400_000 + 1) *
            86_400_000 +
            UNLOCK_HOUR_OFFSET_MS,
        );
        // Pokud D(N) je již splněno → unlock time ignorujeme
        const currentDayLessons = lessonsByDay.get(day) ?? [];
        const currentDayAllDone = currentDayLessons.every(
          (l) => completedIds.has(l.id) && isValidAfterReset(l.id),
        );
        if (!currentDayAllDone && nowDate < unlockTime) break;
        maxDay = day;
      }
      return maxDay;
    }

    const maxUnlockedDay = computeMaxUnlockedDay();
    const availableLessons = lessons.filter(
      (l) => maxUnlockedDay === Infinity || l.day_number <= maxUnlockedDay,
    );

    nextLesson = availableLessons.find((l) => !completedIds.has(l.id)) ?? null;
    isAllCompleted =
      availableLessons.length > 0 &&
      availableLessons.every((l) => completedIds.has(l.id) && isValidAfterReset(l.id));
  }

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
    isOwned: !!userId,
    isLocked: false,
    isFavorite: false,
  };

  return {
    featuredRecord: {
      module_id: featuredRec.module_id,
      title_override: featuredRec.title_override,
    },
    program: programInfo,
    titleOverride: featuredRec.title_override ?? undefined,
    nextLesson,
    isAllCompleted,
    earlyAccessUntil,
    userHasEarlyAccess,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function usePlatformFeaturedProgram(
  userId?: string,
  userCreatedAt?: string,
): UsePlatformFeaturedProgramReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: [...akademieKeys.featuredProgram(), userId ?? 'anon', userCreatedAt ?? 'unknown'],
    queryFn: () => fetchFeaturedProgram(userId, userCreatedAt),
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
