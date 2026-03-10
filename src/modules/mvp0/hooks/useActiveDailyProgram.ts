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
 *   data.nextLesson       — první dostupná NESPLNĚNÁ lekce (null = vše hotovo nebo nezačato)
 *   data.todayLesson      — dnešní lekce (i pokud je splněna) — pro "Přehrát znovu"
 *   data.isProgramFinished — true pokud uživatel dokončil VŠECHNY lekce celého programu
 *   setActiveProgram()    — uloží/přepíše pinnutý program uživatele
 *   clearActiveProgram()  — odstraní pin
 *   resetChallenge()      — resetuje výzvu na den 1 (stats zůstávají, jen challenge_reset_at se nastaví)
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
   * Nejbližší nesplněná dostupná lekce (catch-up logika).
   * null = všechny dostupné lekce jsou splněny (nebo program ještě nezačal).
   * TodaysChallengeButton: pokud null, zkontroluj todayLesson pro "Přehrát znovu".
   */
  nextLesson: import('@/modules/akademie/types').AkademieLesson | null;
  /**
   * Lekce pro DNEŠNÍ den (day_number === daysElapsed), i pokud je již splněna.
   * Slouží pro stav "dnešní lekce hotova, zítřek ještě není odemčen" → "Přehrát znovu".
   * null pokud program ještě nezačal nebo dnešní den nemá lekci.
   */
  todayLesson: import('@/modules/akademie/types').AkademieLesson | null;
  /**
   * true pokud uživatel splnil VŠECHNY lekce celého programu (ne jen dostupné).
   * Odlišuje "dokončen celý program" od "dnešek hotov, čeká se na zítřek".
   */
  isProgramFinished: boolean;
}

export interface UseActiveDailyProgramReturn {
  data: ActiveDailyProgramData | null;
  isLoading: boolean;
  error: string | null;
  setActiveProgram: (moduleId: string) => Promise<void>;
  clearActiveProgram: () => Promise<void>;
  resetChallenge: () => Promise<void>;
}

// --------------------------------------------------
// Query function
// --------------------------------------------------

interface RawActiveRecord {
  module_id: string;
  challenge_reset_at: string | null;
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
  // 1. Zjisti module_id + challenge_reset_at z user_active_program
  const { data: activeRec, error: activeErr } = await supabase
    .from('user_active_program')
    .select('module_id, challenge_reset_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (activeErr) throw activeErr;
  if (!activeRec) return null;

  const { module_id: activeModuleId, challenge_reset_at: challengeResetAt } =
    activeRec as Pick<RawActiveRecord, 'module_id' | 'challenge_reset_at'>;

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
  // effectiveStartDate = MAX(user.created_at, program.launch_date, challenge_reset_at)
  //   → challenge_reset_at: uživatel restartoval výzvu → počítáme od resetu
  //   → Registroval se před globálním startem → sleduje globální start.
  //   → Registroval se po globálním startu → sleduje svůj datum registrace.
  //
  // DŮLEŽITÉ: pinnutí (activated_at) start NERESETUJE — jde jen o UI preferenci.
  const UNLOCK_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000;
  const launchDate = r.launch_date ? new Date(r.launch_date) : null;
  const userCreatedAtDate = userCreatedAt ? new Date(userCreatedAt) : null;
  const challengeResetAtDate = challengeResetAt ? new Date(challengeResetAt) : null;

  // effectiveStartDate = MAX(user.created_at, launch_date)
  const baseStartDate =
    userCreatedAtDate && launchDate && userCreatedAtDate > launchDate
      ? userCreatedAtDate
      : launchDate;

  // Pokud byl reset proveden PO base start → použij reset date
  const effectiveStartDate =
    challengeResetAtDate && baseStartDate && challengeResetAtDate > baseStartDate
      ? challengeResetAtDate
      : baseStartDate;

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

  // 6. Dostupné lekce (odemčené dle daysElapsed)
  const availableLessons = lessons.filter(
    (l) => daysElapsed === Infinity || l.day_number <= daysElapsed,
  );

  // 7. Najdi první dostupnou nesplněnou lekci (catch-up logika)
  const nextLesson = availableLessons.find((l) => !completedIds.has(l.id)) ?? null;

  // 8. Dnešní lekce — lekce pro aktuální den (i pokud je splněna)
  // "Dnes" = lekce s nejvyšším day_number <= daysElapsed (poslední odemčená).
  // Slouží pro "Přehrát znovu" když je nextLesson === null ale program ještě neskončil.
  const todayLesson =
    daysElapsed === Infinity
      ? (availableLessons[availableLessons.length - 1] ?? null)
      : (availableLessons.filter((l) => l.day_number === daysElapsed)[0] ??
         availableLessons[availableLessons.length - 1] ??
         null);

  // 9. Je celý program dokončen (VŠECHNY lekce, ne jen dostupné)?
  // DŮLEŽITÉ: Po resetu (challenge_reset_at nastaven) zůstávají staré záznamy
  // v completedIds. Abychom nezobrazili "Program dokončen" hned po resetu,
  // považujeme program za dokončený pouze pokud:
  //   a) Nebyl proveden reset → všechny lekce mají progress záznam
  //   b) Byl proveden reset → všechny dostupné lekce (od dne 1 po reset) jsou splněny
  //      A zároveň daysElapsed >= celkový počet dní programu (uživatel dočekal konce)
  const wasPreviouslyReset = challengeResetAt !== null;
  const totalDaysInProgram = r.duration_days ?? lessons.length;
  const isProgramFinished = wasPreviouslyReset
    ? daysElapsed >= totalDaysInProgram &&
      availableLessons.length > 0 &&
      availableLessons.every((l) => completedIds.has(l.id))
    : lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));

  return {
    program: programInfo,
    moduleId: activeModuleId,
    daysElapsed,
    notStartedYet,
    startDate: effectiveStartDate,
    nextLesson,
    todayLesson,
    isProgramFinished,
  };
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

/**
 * Vypočítá počet ms do příštích 4:00 ráno lokálního času.
 * Použito pro naplánování automatického refetch při odemykání nového dne.
 */
function msUntilNextUnlock(): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(4, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

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

  // Naplánovat refetch přesně ve 4:00 → odemkne nový den bez nutnosti refreshe stránky.
  // Efekt se restartuje vždy po dokončeném refetchi (deps: userId).
  useEffect(() => {
    if (!userId) return;

    const delay = msUntilNextUnlock();
    const timer = setTimeout(() => {
      qc.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId) });
    }, delay);

    return () => clearTimeout(timer);
  }, [userId, qc]);

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

  /**
   * Restartuje výzvu od dnešního dne.
   * Nastaví challenge_reset_at = now() → daysElapsed se přepočítá od dneška.
   * user_lesson_progress se NEMAŽE — statistiky (minuty, sessions) zůstávají.
   */
  const resetChallenge = async () => {
    if (!userId) return;
    const { error: resetErr } = await supabase
      .from('user_active_program')
      .update({ challenge_reset_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (resetErr) throw resetErr;
    await qc.invalidateQueries({ queryKey: akademieKeys.activeProgram(userId) });
  };

  return {
    data: data ?? null,
    isLoading,
    error: error ? 'Nepodařilo se načíst denní program' : null,
    setActiveProgram,
    clearActiveProgram,
    resetChallenge,
  };
}
