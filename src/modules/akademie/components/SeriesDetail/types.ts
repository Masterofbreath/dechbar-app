import type { LessonWithProgress, AkademieLesson } from '../../types'
import type { Track } from '@/platform/components/AudioPlayer/types'

export interface UseAkademiePlaybackReturn {
  playLesson: (lesson: LessonWithProgress | AkademieLesson) => void
  handleTimeUpdate: (lessonId: string, currentTimeSec: number, durationSec: number) => void
  isCurrentLesson: (lessonId: string) => boolean
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
}
