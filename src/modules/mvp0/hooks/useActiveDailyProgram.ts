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
   * Nejvyšší odemčený den (completion-based).
   * Infinity = program bez launch_date → vše odemčeno (admin/CEO).
   */
  daysElapsed: number;
  /** true pokud launch_date je v budoucnosti — program ještě nezačal */
  notStartedYet: boolean;
  startDate: Date | null;
  /**
   * Nejbližší nesplněná dostupná lekce.
   * null = všechny dostupné lekce jsou splněny (nebo program ještě nezačal).
   * TodaysChallengeButton: pokud null, zkontroluj todayLesson pro "Přehrát znovu".
   */
  nextLesson: import('@/modules/akademie/types').AkademieLesson | null;
  /**
   * Poslední odemčená lekce (i pokud je splněna).
   * Slouží pro stav "lekce hotova, další ještě není odemčena" → "Přehrát znovu".
   * null pokud program ještě nezačal.
   */
  todayLesson: import('@/modules/akademie/types').AkademieLesson | null;
  /**
   * true pokud uživatel splnil VŠECHNY lekce celého programu.
   * Odlišuje "dokončen celý program" od "čeká se na odemčení dalšího dne".
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
  _userCreatedAt?: string,
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

  // 3. Metadata pro notStartedYet (launch_date v budoucnosti)
  const challengeResetAtDate = challengeResetAt ? new Date(challengeResetAt) : null;
  const launchDate = r.launch_date ? new Date(r.launch_date) : null;
  const now = new Date();
  const notStartedYet = launchDate ? launchDate > now : false;

  // 4. Načti všechny lekce programu seřazené podle day_number
  const { data: lessonsRaw, error: lessonsErr } = await supabase
    .from('akademie_lessons')
    .select('id, series_id, module_id, title, audio_url, duration_seconds, day_number, sort_order')
    .eq('module_id', activeModuleId)
    .order('day_number', { ascending: true })
    .order('sort_order', { ascending: true });

  if (lessonsErr) throw lessonsErr;

  const lessons = (lessonsRaw ?? []) as RawLesson[];

  // 5. Načti dokončené lekce uživatele + completed_at pro každou
  //    Potřebujeme completed_at pro výpočet odemykání (D(N+1) = 4:00 po D(N).completed_at)
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

  // 6. Seskup lekce podle day_number pro efektivní lookup
  const lessonsByDay = new Map<number, RawLesson[]>();
  for (const l of lessons) {
    const arr = lessonsByDay.get(l.day_number) ?? [];
    arr.push(l);
    lessonsByDay.set(l.day_number, arr);
  }

  // 7. Completion-based odemykání:
  //
  // Pravidlo: Den N se odemkne ve 4:00 ráno po dni, kdy byl D(N-1) splněn.
  //   - D1 je vždy dostupný (bez podmínky)
  //   - D(N) se zpřístupní = 4:00 ráno po D(N-1).completed_at
  //   - Pokud je D(N) JIŽ splněno → unlock time se ignoruje, pokračujeme dál
  //     (uživatel mohl splnit lekce v jiném pořadí nebo ve starém featured flow)
  //   - Přeskakování není možné — nesplněná lekce vyžaduje splnění D(N-1) + čas
  //
  // Reset výzvy (challenge_reset_at): celý řetězec se přeruší, D1 je opět dostupný
  //   ale STARÉ completed_at záznamy zůstávají → den D(N) splněný PŘED resetem se ignoruje.
  //
  // Speciální případ: program bez launch_date (admin/CEO) → Infinity = vše odemčeno.

  const UNLOCK_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000;

  function isUnlockedAfterReset(lessonId: string): boolean {
    // Pokud nebyl reset → vše platné
    if (!challengeResetAtDate) return true;
    const doneAt = completedAt.get(lessonId);
    // Lekce splněná před resetem se pro účely gating řetězce ignoruje
    return doneAt !== undefined && doneAt >= challengeResetAtDate;
  }

  function computeMaxUnlockedDay(): number {
    // Program bez launch_date (admin/CEO) → vše odemčeno
    if (!launchDate) return Infinity;
    // Program ještě nezačal
    if (notStartedYet) return 0;

    const allDays = [...lessonsByDay.keys()].sort((a, b) => a - b);
    let maxDay = 0;

    for (const day of allDays) {
      if (day === 1) {
        // D1 je vždy dostupný (pokud program začal)
        maxDay = 1;
        continue;
      }

      // D(N) = všechny lekce D(N-1) musí být splněny A odemykací čas musí nastat
      const prevDayLessons = lessonsByDay.get(day - 1) ?? [];
      if (prevDayLessons.length === 0) break;

      // Všechny lekce předchozího dne splněny (po případném resetu)
      const prevDayAllDone = prevDayLessons.every(
        (l) => completedIds.has(l.id) && isUnlockedAfterReset(l.id),
      );
      if (!prevDayAllDone) break;

      // Nejpozdější completed_at z D(N-1) → z toho vypočítáme odemknutí D(N)
      const lastCompletedAt = prevDayLessons.reduce<Date | null>((latest, l) => {
        const done = completedAt.get(l.id);
        if (!done) return latest;
        return latest === null || done > latest ? done : latest;
      }, null);

      if (!lastCompletedAt) break;

      // D(N) se odemkne ve 4:00 ráno po dni dokončení D(N-1)
      const unlockTime = new Date(
        Math.floor((lastCompletedAt.getTime() - UNLOCK_HOUR_OFFSET_MS) / 86_400_000 + 1) *
          86_400_000 +
          UNLOCK_HOUR_OFFSET_MS,
      );

      // Pokud D(N) je již splněno → unlock time ignorujeme (lekce byla dokončena dříve)
      // Pokud D(N) ještě není splněno → čekáme na unlock time
      const currentDayLessons = lessonsByDay.get(day) ?? [];
      const currentDayAllDone = currentDayLessons.every(
        (l) => completedIds.has(l.id) && isUnlockedAfterReset(l.id),
      );

      if (!currentDayAllDone && now < unlockTime) break; // čas ještě nenastal a lekce nesplněna

      maxDay = day;
    }

    return maxDay;
  }

  const maxUnlockedDay = computeMaxUnlockedDay();

  const availableLessons = lessons.filter(
    (l) => maxUnlockedDay === Infinity || l.day_number <= maxUnlockedDay,
  );

  // 8. Nejbližší nesplněná dostupná lekce
  const nextLesson = availableLessons.find((l) => !completedIds.has(l.id)) ?? null;

  // 9. Dnešní lekce — poslední odemčená (i pokud splněna) — pro "Přehrát znovu"
  const todayLesson =
    maxUnlockedDay === Infinity
      ? (availableLessons[availableLessons.length - 1] ?? null)
      : (availableLessons.filter((l) => l.day_number === maxUnlockedDay)[0] ??
         availableLessons[availableLessons.length - 1] ??
         null);

  // 10. Je celý program dokončen?
  // Po resetu: ignoruj lekce splněné před resetem — porovnáváme jen ty splněné po resetu.
  const isProgramFinished = (() => {
    if (lessons.length === 0) return false;
    if (challengeResetAtDate) {
      // Po resetu: všechny lekce musí být znovu splněny (completed_at >= challenge_reset_at)
      return lessons.every(
        (l) => completedIds.has(l.id) && isUnlockedAfterReset(l.id),
      );
    }
    return lessons.every((l) => completedIds.has(l.id));
  })();

  return {
    program: programInfo,
    moduleId: activeModuleId,
    daysElapsed: maxUnlockedDay,
    notStartedYet,
    startDate: launchDate,
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
