import { useState } from 'react'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import type { AkademieProgramVM } from '../../types'

interface ProgramCardProps {
  program: AkademieProgramVM
  onOpen: (programId: string) => void
}

export function ProgramCard({ program, onOpen }: ProgramCardProps) {
  const [showLocked, setShowLocked] = useState(false)

  function handleTap() {
    if (program.isLocked) {
      setShowLocked(true)
    } else {
      onOpen(program.id)
    }
  }

  return (
    <>
      <article
        className={[
          'akademie-program-card',
          program.isLocked ? 'akademie-program-card--locked' : '',
          program.isOwned ? 'akademie-program-card--owned' : '',
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" />
              </svg>
            </div>
          )}

          {/* Owned badge */}
          {program.isOwned && (
            <div className="akademie-program-card__owned-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Vlastním
            </div>
          )}

          {/* Lock badge */}
          {program.isLocked && (
            <div className="akademie-program-card__lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
