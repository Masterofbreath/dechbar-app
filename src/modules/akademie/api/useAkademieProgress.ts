import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'

// --------------------------------------------------
// Mutation: mark lesson as completed
// Called after 80% playback threshold.
//
// Uses RPC record_lesson_completion instead of raw upsert to preserve
// the original completed_at on repeated plays. This is critical:
// the day-unlock algorithm reads completed_at to determine when the
// next day becomes available — overwriting it would block future days.
// --------------------------------------------------

interface MarkCompleteParams {
  userId: string
  lessonId: string
  seriesId: string
  playDurationSeconds: number
}

async function markLessonComplete(params: MarkCompleteParams): Promise<void> {
  const { error } = await supabase.rpc('record_lesson_completion', {
    p_user_id: params.userId,
    p_lesson_id: params.lessonId,
    p_series_id: params.seriesId,
    p_duration: params.playDurationSeconds,
  })

  if (error) throw error
}

export function useMarkLessonComplete(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markLessonComplete,
    onSuccess: (_data, variables) => {
      // Checkmark v seznamu lekcí — okamžitá zpětná vazba
      queryClient.invalidateQueries({
        queryKey: akademieKeys.lessons(variables.seriesId),
      })
      queryClient.invalidateQueries({
        queryKey: akademieKeys.progress(userId),
      })
      // TodaysChallengeButton + unlock stav — přepočítá nextLesson a maxUnlockedDay
      // BEZ tohoto uživatel vidí dokončenou lekci jako "Přehrát" až do příštího refreshe (2 min stale)
      queryClient.invalidateQueries({
        queryKey: akademieKeys.activeProgram(userId),
      })
      queryClient.invalidateQueries({
        queryKey: akademieKeys.featuredProgram(),
      })
      // Akademie detail view — zamčené/odemčené dny
      queryClient.invalidateQueries({
        queryKey: [...akademieKeys.all, 'programUnlockState', userId],
      })
    },
  })
}
