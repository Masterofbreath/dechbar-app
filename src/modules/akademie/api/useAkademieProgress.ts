import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'

// --------------------------------------------------
// Mutation: mark lesson as completed (upsert)
// Called after 80% playback threshold
// --------------------------------------------------

interface MarkCompleteParams {
  userId: string
  lessonId: string
  seriesId: string
  playDurationSeconds: number
}

async function markLessonComplete(params: MarkCompleteParams): Promise<void> {
  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert(
      {
        user_id: params.userId,
        lesson_id: params.lessonId,
        completed_at: new Date().toISOString(),
        play_duration_seconds: params.playDurationSeconds,
      },
      { onConflict: 'user_id,lesson_id' },
    )

  if (error) throw error
}

export function useMarkLessonComplete(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markLessonComplete,
    onSuccess: (_data, variables) => {
      // Invalidate lekce pro danou sérii, aby se checkmark zobrazil okamžitě
      queryClient.invalidateQueries({
        queryKey: akademieKeys.lessons(variables.seriesId),
      })
      queryClient.invalidateQueries({
        queryKey: akademieKeys.progress(userId),
      })
    },
  })
}
