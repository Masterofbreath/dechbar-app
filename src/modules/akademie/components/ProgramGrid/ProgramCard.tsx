import { useState } from 'react'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import { useToggleFavorite } from '../../api/useAkademieCatalog'
import type { AkademieProgramVM } from '../../types'

interface ProgramCardProps {
  program: AkademieProgramVM
  userId: string | undefined
  onOpen: (programId: string) => void
}

function StarIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

export function ProgramCard({ program, userId, onOpen }: ProgramCardProps) {
  const [showLocked, setShowLocked] = useState(false)
  const toggleFavorite = useToggleFavorite()

  function handleTap() {
    if (program.isLocked) {
      setShowLocked(true)
    } else {
      onOpen(program.id)
    }
  }

  function handleFavorite(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    if (!userId) return
    toggleFavorite.mutate({
      userId,
      programId: program.id,
      isFavorite: program.isFavorite,
    })
  }

  return (
    <>
      <article
        className={[
          'akademie-program-card',
          program.isLocked ? 'akademie-program-card--locked' : '',
          program.isOwned ? 'akademie-program-card--owned' : '',
          program.isFavorite ? 'akademie-program-card--favorite' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleTap()}
        aria-label={`${program.name}${program.isLocked ? ` — zamknuto, cena ${program.price_czk} Kč` : ''}`}
      >
        {/* Cover image */}
        <div className="akademie-program-card__cover">
          {program.cover_image_url ? (
            <img
              src={program.cover_image_url}
              alt={program.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="akademie-program-card__cover-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
              </svg>
            </div>
          )}

          {/* Owned badge */}
          {program.isOwned && !program.isLocked && (
            <div className="akademie-program-card__owned-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Vlastním
            </div>
          )}

          {/* Lock badge */}
          {program.isLocked && (
            <div className="akademie-program-card__lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {program.price_czk} Kč
            </div>
          )}
        </div>

        {/* Content */}
        <div className="akademie-program-card__body">
          <p className="akademie-program-card__name">{program.name}</p>
          <div className="akademie-program-card__meta">
            <span>21 lekcí</span>
            <span>·</span>
            <span>7 min/den</span>
          </div>
        </div>

        {/* Favorites tlačítko — jen pro vlastněné programy */}
        {program.isOwned && userId && (
          <button
            className={[
              'akademie-program-card__favorite',
              program.isFavorite ? 'akademie-program-card__favorite--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={handleFavorite}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleFavorite(e)
              }
            }}
            type="button"
            aria-label={program.isFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}
            aria-pressed={program.isFavorite}
          >
            <StarIcon filled={program.isFavorite} />
          </button>
        )}
      </article>

      {/* Paywall modal */}
      <LockedFeatureModal
        isOpen={showLocked}
        onClose={() => setShowLocked(false)}
        featureName={program.name}
        tierRequired="AKADEMIE"
        websiteUrl="https://zdravedychej.cz"
      />
    </>
  )
}
