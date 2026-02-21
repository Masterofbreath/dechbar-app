import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'
import type { AkademieSeries, LessonWithProgress } from '../types'

// --------------------------------------------------
// Fetch: series for a module (program)
// --------------------------------------------------

async function fetchSeries(moduleId: string): Promise<AkademieSeries[]> {
  const { data, error } = await supabase
    .from('akademie_series')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useAkademieSeries(moduleId: string) {
  return useQuery({
    queryKey: akademieKeys.series(moduleId),
    queryFn: () => fetchSeries(moduleId),
    staleTime: 1000 * 60 * 10,
    enabled: !!moduleId,
  })
}

// --------------------------------------------------
// Fetch: lessons for a series + progress merge
// --------------------------------------------------

interface RawLesson {
  id: string
  series_id: string
  module_id: string
  title: string
  audio_url: string
  duration_seconds: number
  day_number: number
  sort_order: number
}

interface ProgressRow {
  lesson_id: string
  completed_at: string
}

async function fetchLessonsWithProgress(
  seriesId: string,
  userId: string | undefined,
): Promise<LessonWithProgress[]> {
  // 1. Načti lekce
  const { data: lessons, error } = await supabase
    .from('akademie_lessons')
    .select('*')
    .eq('series_id', seriesId)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })

  if (error) throw error

  const rawLessons = (lessons ?? []) as RawLesson[]

  // 2. Načti progress pro přihlášeného uživatele
  const completedIds = new Set<string>()
  if (userId && rawLessons.length > 0) {
    const lessonIds = rawLessons.map((l) => l.id)
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    ;(progress as ProgressRow[] ?? []).forEach((row) => {
      completedIds.add(row.lesson_id)
    })
  }

  return rawLessons.map((lesson) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
  }))
}

export function useAkademieLessons(
  seriesId: string,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: akademieKeys.lessons(seriesId),
    queryFn: () => fetchLessonsWithProgress(seriesId, userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!seriesId,
  })
}
