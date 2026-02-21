import { useAkademieLessons } from '../../api/useAkademieProgram'
import { useAkademiePlayback } from '../../hooks/useAkademiePlayback'
import { LessonRow } from './LessonRow'
import type { AkademieSeries } from '../../types'

interface SeriesDetailProps {
  series: AkademieSeries
  userId: string | undefined
  onBack: () => void
}

export function SeriesDetail({ series, userId, onBack }: SeriesDetailProps) {
  const { data: lessons, isLoading } = useAkademieLessons(series.id, userId)

  const playback = useAkademiePlayback({
    userId,
    seriesId: series.id,
  })

  const completedCount = lessons?.filter((l) => l.isCompleted).length ?? 0
  const totalCount = lessons?.length ?? 0

  return (
    <div>
      {/* Back button */}
      <button className="akademie-back" onClick={onBack} type="button" aria-label="Zpět na program">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Zpět
      </button>

      {/* Series header */}
      <div className="akademie-series-detail__header">
        <h2 className="akademie-series-detail__title">{series.name}</h2>
        {totalCount > 0 && (
          <p className="akademie-series-detail__subtitle">
            {completedCount} / {totalCount} lekcí dokončeno
          </p>
        )}
      </div>

      {/* Lesson list */}
      <div className="akademie-lesson-list">
        {isLoading &&
          [1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="akademie-lesson-row"
              style={{ opacity: 0.3, pointerEvents: 'none', minHeight: 60 }}
            />
          ))}

        {!isLoading && lessons?.length === 0 && (
          <p
            style={{
              color: 'var(--color-text-tertiary)',
              fontSize: '0.875rem',
              padding: '24px 0',
              textAlign: 'center',
            }}
          >
            Lekce budou brzy k dispozici.
          </p>
        )}

        {!isLoading &&
          lessons?.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} playback={playback} />
          ))}
      </div>
    </div>
  )
}
