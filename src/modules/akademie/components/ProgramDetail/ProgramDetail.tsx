import { useAkademieSeries } from '../../api/useAkademieProgram'
import { SeriesCard } from './SeriesCard'
import type { AkademieProgramVM } from '../../types'

interface ProgramDetailProps {
  program: AkademieProgramVM
  onBack: () => void
  onOpenSeries: (seriesId: string, programId: string) => void
}

export function ProgramDetail({ program, onBack, onOpenSeries }: ProgramDetailProps) {
  const { data: series, isLoading } = useAkademieSeries(program.module_id)

  return (
    <div>
      {/* Back button */}
      <button className="akademie-back" onClick={onBack} type="button" aria-label="Zpět na programy">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Zpět
      </button>

      {/* Hero image */}
      <div className="akademie-program-detail__hero">
        {program.cover_image_url ? (
          <img src={program.cover_image_url} alt={program.name} />
        ) : (
          <div className="akademie-program-detail__hero-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Program info */}
      <div className="akademie-program-detail__info">
        <h1 className="akademie-program-detail__title">{program.name}</h1>
        {program.description_long && (
          <p className="akademie-program-detail__desc">{program.description_long}</p>
        )}
      </div>

      {/* Series list */}
      <div className="akademie-series-list">
        <p className="akademie-series-list__heading">Týdenní série</p>

        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="akademie-series-card"
                style={{ opacity: 0.4, pointerEvents: 'none', minHeight: 68 }}
              />
            ))}
          </>
        )}

        {!isLoading && series?.length === 0 && (
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', padding: '8px 0' }}>
            Série budou brzy k dispozici.
          </p>
        )}

        {!isLoading &&
          series?.map((s) => (
            <SeriesCard
              key={s.id}
              series={s}
              onOpen={(seriesId) => onOpenSeries(seriesId, program.id)}
            />
          ))}
      </div>
    </div>
  )
}
