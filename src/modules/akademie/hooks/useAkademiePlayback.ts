import { useCallback, useRef } from 'react'
import { useAudioPlayerStore } from '@/platform/components/AudioPlayer/store'
import { useMarkLessonComplete } from '../api/useAkademieProgress'
import type { LessonWithProgress, AkademieLesson } from '../types'
import type { Track } from '@/platform/components/AudioPlayer/types'

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const COMPLETION_THRESHOLD = 0.8 // 80%

function lessonToTrack(lesson: AkademieLesson | LessonWithProgress): Track {
  return {
    id: lesson.id,
    album_id: lesson.series_id,
    title: lesson.title,
    artist: 'DechBar',
    album: null,
    duration: lesson.duration_seconds,
    audio_url: lesson.audio_url,
    cover_url: null,
    duration_category: null,
    mood_category: null,
    difficulty_level: null,
    kp_suitability: null,
    media_type: 'audio',
    exercise_format: 'meditace',
    intensity_level: 'jemna',
    narration_type: 'pribeh',
    tags: [],
    description: null,
    track_order: lesson.day_number,
    is_published: true,
    play_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// --------------------------------------------------
// Hook
// --------------------------------------------------

interface UseAkademiePlaybackParams {
  userId?: string
  seriesId?: string
}

/**
 * useAkademiePlayback
 *
 * Propojuje Akademie lekce s globálním AudioPlayerStore.
 * - playLesson: KRITICKÉ — musí být voláno synchronně v onClick (iOS Safari)
 * - isCurrentlyPlaying: true pokud je daná lekce právě hrána
 * - handleTimeUpdate: zaznamenat 80% dokončení lekce
 */
export function useAkademiePlayback({ userId, seriesId }: UseAkademiePlaybackParams = {}) {
  const playSticky = useAudioPlayerStore((s) => s.playSticky)
  const currentTrack = useAudioPlayerStore((s) => s.currentTrack)
  const isPlaying = useAudioPlayerStore((s) => s.isPlaying)
  const currentTime = useAudioPlayerStore((s) => s.currentTime)
  const duration = useAudioPlayerStore((s) => s.duration)

  const { mutate: markComplete } = useMarkLessonComplete(userId ?? '')

  // Ref pro deduplikaci — zabrání dvojitému callbacku
  const completedLessonsRef = useRef<Set<string>>(new Set())

  /**
   * KRITICKÉ: musí být voláno synchronně v onClick handleru (iOS Safari vyžaduje
   * audio.play() bez async přerušení v user gesture callbacku).
   */
  const playLesson = useCallback(
    (lesson: LessonWithProgress | AkademieLesson) => {
      const track = lessonToTrack(lesson)
      playSticky(track)
    },
    [playSticky],
  )

  /**
   * Volat z audio time update event.
   * Zaznamená dokončení lekce při >= 80% přehrání.
   */
  const handleTimeUpdate = useCallback(
    (lessonId: string, currentTimeSec: number, durationSec: number) => {
      if (!userId) return
      if (durationSec <= 0) return
      if (completedLessonsRef.current.has(lessonId)) return

      const ratio = currentTimeSec / durationSec
      if (ratio >= COMPLETION_THRESHOLD) {
        completedLessonsRef.current.add(lessonId)
        markComplete({
          userId,
          lessonId,
          seriesId: seriesId ?? '',
          playDurationSeconds: Math.floor(currentTimeSec),
        })
      }
    },
    [userId, seriesId, markComplete],
  )

  /**
   * Vrátí true, pokud je daná lekce (lesson.id) právě aktivní a hraje.
   */
  const isCurrentlyPlaying = useCallback(
    (lessonId: string) => currentTrack?.id === lessonId && isPlaying,
    [currentTrack, isPlaying],
  )

  /** Vrátí true, pokud je daná lekce načtená (i pozastavená). */
  const isCurrentLesson = useCallback(
    (lessonId: string) => currentTrack?.id === lessonId,
    [currentTrack],
  )

  return {
    playLesson,
    handleTimeUpdate,
    isCurrentLesson,
    isCurrentlyPlaying,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
  }
}
