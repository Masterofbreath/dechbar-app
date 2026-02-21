import type { LessonWithProgress } from '../../types'
import type { UseAkademiePlaybackReturn } from './types'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface LessonRowProps {
  lesson: LessonWithProgress
  playback: UseAkademiePlaybackReturn
}

export function LessonRow({ lesson, playback }: LessonRowProps) {
  const isPlaying = playback.isCurrentLesson(lesson.id) && playback.isPlaying
  const isCurrent = playback.isCurrentLesson(lesson.id)

  // KRITICKÉ: synchronní volání playSticky v onClick handleru (iOS Safari)
  function handlePlay() {
    playback.playLesson(lesson)
  }

  return (
    <div
      className={`akademie-lesson-row${isCurrent ? ' akademie-lesson-row--playing' : ''}`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
      aria-label={`${lesson.title}${lesson.isCompleted ? ', dokončeno' : ''}${isCurrent ? ', právě hraje' : ''}`}
    >
      {/* Icon: day number / play indicator */}
      <div className="akademie-lesson-row__icon" aria-hidden="true">
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="akademie-lesson-row__content">
        <p className="akademie-lesson-row__title">{lesson.title}</p>
        <p className="akademie-lesson-row__duration">
          Den {lesson.day_number} · {formatDuration(lesson.duration_seconds)}
        </p>

        {/* Progress bar for currently playing lesson */}
        {isCurrent && playback.duration > 0 && (
          <div className="akademie-lesson-row__progress" aria-hidden="true">
            <div
              className="akademie-lesson-row__progress-fill"
              style={{ width: `${(playback.currentTime / playback.duration) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Status indicator: playing animation, checkmark, or empty */}
      {isPlaying ? (
        <div className="akademie-lesson-row__playing-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : lesson.isCompleted ? (
        <div className="akademie-lesson-row__check" aria-label="Dokončeno">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      ) : null}
    </div>
  )
}
