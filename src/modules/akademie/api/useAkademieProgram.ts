import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'
import type { AkademieSeries, LessonWithProgress, ToggleLessonFavoriteParams } from '../types'

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

  const completedIds = new Set<string>()
  const favoriteIds = new Set<string>()

  if (userId && rawLessons.length > 0) {
    const lessonIds = rawLessons.map((l) => l.id)

    // 2. Progress
    const { data: progress } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    ;(progress as ProgressRow[] ?? []).forEach((row) => {
      completedIds.add(row.lesson_id)
    })

    // 3. Oblíbené lekce
    const { data: favs } = await supabase
      .from('user_lesson_favorites')
      .select('lesson_id')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    ;(favs ?? []).forEach((row: { lesson_id: string }) => {
      favoriteIds.add(row.lesson_id)
    })
  }

  return rawLessons.map((lesson) => ({
    ...lesson,
    isCompleted: completedIds.has(lesson.id),
    isFavorite: favoriteIds.has(lesson.id),
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

// --------------------------------------------------
// Mutation: toggle lesson favorite (optimistic)
// --------------------------------------------------

export function useToggleLessonFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, lessonId, isFavorite }: ToggleLessonFavoriteParams) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_lesson_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('lesson_id', lessonId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_lesson_favorites')
          .upsert({ user_id: userId, lesson_id: lessonId })
        if (error) throw error
      }
    },
    onMutate: async ({ lessonId, seriesId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: akademieKeys.lessons(seriesId) })

      const previousData = qc.getQueryData<LessonWithProgress[]>(
        akademieKeys.lessons(seriesId),
      )

      qc.setQueryData<LessonWithProgress[]>(
        akademieKeys.lessons(seriesId),
        (old) =>
          old?.map((l) =>
            l.id === lessonId ? { ...l, isFavorite: !isFavorite } : l,
          ),
      )

      return { previousData }
    },
    onError: (_err, { seriesId }, context) => {
      if (context?.previousData) {
        qc.setQueryData(akademieKeys.lessons(seriesId), context.previousData)
      }
    },
    onSettled: (_data, _err, { seriesId }) => {
      qc.invalidateQueries({ queryKey: akademieKeys.lessons(seriesId) })
    },
  })
}
