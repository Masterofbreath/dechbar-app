import type { AkademieSeries } from '../../types'

interface SeriesCardProps {
  series: AkademieSeries
  onOpen: (seriesId: string) => void
}

export function SeriesCard({ series, onOpen }: SeriesCardProps) {
  return (
    <div
      className="akademie-series-card"
      onClick={() => onOpen(series.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(series.id)}
      aria-label={`Série ${series.week_number}: ${series.name}`}
    >
      {/* Week number */}
      <div className="akademie-series-card__week" aria-hidden="true">
        T{series.week_number}
      </div>

      {/* Content */}
      <div className="akademie-series-card__content">
        <p className="akademie-series-card__name">{series.name}</p>
        {series.description && (
          <p className="akademie-series-card__meta">{series.description}</p>
        )}
      </div>

      {/* Chevron */}
      <svg
        className="akademie-series-card__chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  )
}
