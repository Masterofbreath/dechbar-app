/**
 * useProgramUnlockState
 *
 * Completion-based odemykání dnů pro detail programu v Akademii.
 * Sdílí identickou logiku s useActiveDailyProgram — odemykání závisí
 * na dokončení předchozí lekce, ne na čase od launch_date.
 *
 * Pravidlo:
 *   - D1 je vždy dostupný (pokud program začal)
 *   - D(N) se odemkne ve 4:00 ráno po dni, kdy byl D(N-1) splněn
 *   - Pokud D(N) je již splněno → unlock time se ignoruje (ochrana
 *     proti edge case: lekce splněné mimo pořadí zůstávají odemčeny)
 *   - Pokud program nemá launch_date → Infinity (admin/CEO, vše odemčeno)
 *   - challenge_reset_at: lekce splněné před resetem se ignorují
 *
 * Použití: ProgramDetail.tsx jako náhrada časového daysElapsed výpočtu.
 *
 * @package DechBar_App
 * @subpackage Akademie/API
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface ProgramUnlockState {
  /** Nejvyšší odemčený den (completion-based). Infinity = vše odemčeno. */
  maxUnlockedDay: number
  /** true pokud uživatel dokončil VŠECHNY lekce celého programu */
  isProgramFinished: boolean
  /** true pokud launch_date je v budoucnosti */
  notStartedYet: boolean
}

// --------------------------------------------------
// Core computation (pure function — testovatelná bez hooku)
// --------------------------------------------------

interface RawLesson {
  id: string
  day_number: number
}

interface ProgressRow {
  lesson_id: string
  completed_at: string | null
}

const UNLOCK_HOUR_OFFSET_MS = 4 * 60 * 60 * 1000

export function computeProgramUnlockState(
  lessons: RawLesson[],
  progress: ProgressRow[],
  launchDateStr: string | null,
  challengeResetAt: string | null,
  now: Date = new Date(),
): ProgramUnlockState {
  const launchDate = launchDateStr ? new Date(launchDateStr) : null
  const notStartedYet = launchDate ? launchDate > now : false

  const completedIds = new Set<string>()
  const completedAt = new Map<string, Date>()
  const resetDate = challengeResetAt ? new Date(challengeResetAt) : null

  for (const row of progress) {
    completedIds.add(row.lesson_id)
    if (row.completed_at) {
      completedAt.set(row.lesson_id, new Date(row.completed_at))
    }
  }

  function isValidAfterReset(lessonId: string): boolean {
    if (!resetDate) return true
    const doneAt = completedAt.get(lessonId)
    return doneAt !== undefined && doneAt >= resetDate
  }

  // Seskup lekce podle day_number
  const lessonsByDay = new Map<number, RawLesson[]>()
  for (const l of lessons) {
    const arr = lessonsByDay.get(l.day_number) ?? []
    arr.push(l)
    lessonsByDay.set(l.day_number, arr)
  }

  function computeMaxUnlockedDay(): number {
    if (!launchDate) return Infinity
    if (notStartedYet) return 0

    const allDays = [...lessonsByDay.keys()].sort((a, b) => a - b)
    let maxDay = 0

    for (const day of allDays) {
      if (day === 1) {
        maxDay = 1
        continue
      }

      const prevDayLessons = lessonsByDay.get(day - 1) ?? []
      if (prevDayLessons.length === 0) break

      const prevDayAllDone = prevDayLessons.every(
        (l) => completedIds.has(l.id) && isValidAfterReset(l.id),
      )
      if (!prevDayAllDone) break

      const lastCompletedAt = prevDayLessons.reduce<Date | null>((latest, l) => {
        const done = completedAt.get(l.id)
        if (!done) return latest
        return latest === null || done > latest ? done : latest
      }, null)
      if (!lastCompletedAt) break

      // D(N) unlock time = 4:00 ráno den po D(N-1).completed_at
      const unlockTime = new Date(
        Math.floor((lastCompletedAt.getTime() - UNLOCK_HOUR_OFFSET_MS) / 86_400_000 + 1) *
          86_400_000 +
          UNLOCK_HOUR_OFFSET_MS,
      )

      // Pokud D(N) je již splněno → ignoruj unlock time (lekce splněna dříve)
      const currentDayLessons = lessonsByDay.get(day) ?? []
      const currentDayAllDone = currentDayLessons.every(
        (l) => completedIds.has(l.id) && isValidAfterReset(l.id),
      )
      if (!currentDayAllDone && now < unlockTime) break

      maxDay = day
    }

    return maxDay
  }

  const maxUnlockedDay = computeMaxUnlockedDay()

  // Program dokončen = všechny lekce splněny (po případném resetu)
  const isProgramFinished =
    lessons.length > 0 &&
    lessons.every((l) => completedIds.has(l.id) && isValidAfterReset(l.id))

  return { maxUnlockedDay, isProgramFinished, notStartedYet }
}

// --------------------------------------------------
// Fetch function
// --------------------------------------------------

async function fetchProgramUnlockState(
  userId: string,
  moduleId: string,
): Promise<ProgramUnlockState> {
  // 1. launch_date + challenge_reset_at pro tento modul
  const [programRes, activeRes] = await Promise.all([
    supabase
      .from('akademie_programs')
      .select('launch_date')
      .eq('module_id', moduleId)
      .maybeSingle(),
    supabase
      .from('user_active_program')
      .select('challenge_reset_at')
      .eq('user_id', userId)
      .eq('module_id', moduleId)
      .maybeSingle(),
  ])

  if (programRes.error) throw programRes.error

  const launchDateStr = programRes.data?.launch_date ?? null
  const challengeResetAt = activeRes.data?.challenge_reset_at ?? null

  // 2. Lekce programu
  const { data: lessonsRaw, error: lessonsErr } = await supabase
    .from('akademie_lessons')
    .select('id, day_number')
    .eq('module_id', moduleId)
    .order('day_number', { ascending: true })

  if (lessonsErr) throw lessonsErr
  const lessons = (lessonsRaw ?? []) as RawLesson[]

  // 3. Progress uživatele
  let progress: ProgressRow[] = []
  if (lessons.length > 0) {
    const { data: progressRaw } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', userId)
      .in('lesson_id', lessons.map((l) => l.id))
    progress = (progressRaw ?? []) as ProgressRow[]
  }

  return computeProgramUnlockState(lessons, progress, launchDateStr, challengeResetAt)
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

export function useProgramUnlockState(
  userId: string | undefined,
  moduleId: string,
): { data: ProgramUnlockState | null; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: akademieKeys.programUnlockState(userId ?? 'anon', moduleId),
    queryFn: () => fetchProgramUnlockState(userId!, moduleId),
    enabled: !!userId && !!moduleId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })

  return { data: data ?? null, isLoading }
}
