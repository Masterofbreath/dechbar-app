import { ProgramCard } from './ProgramCard'
import type { AkademieProgramVM } from '../../types'

interface ProgramGridProps {
  programs: AkademieProgramVM[]
  isLoading: boolean
  userId: string | undefined
  onOpenProgram: (programId: string) => void
}

export function ProgramGrid({ programs, isLoading, userId, onOpenProgram }: ProgramGridProps) {
  if (isLoading) {
    return (
      <div className="akademie-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="akademie-program-card" style={{ minHeight: 200 }}>
            <div className="akademie-program-card__cover" style={{ background: 'var(--color-surface-elevated)' }} />
            <div className="akademie-program-card__body">
              <div style={{ height: 12, width: '70%', background: 'var(--color-surface-elevated)', borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <div
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: '0.875rem',
        }}
      >
        V této kategorii zatím nejsou žádné programy.
      </div>
    )
  }

  // Oblíbené (owned + isFavorite) — zobrazeny první
  const favorites = programs.filter((p) => p.isOwned && p.isFavorite)
  const owned = programs.filter((p) => p.isOwned && !p.isFavorite)
  const locked = programs.filter((p) => p.isLocked)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Oblíbené programy */}
      {favorites.length > 0 && (
        <section>
          <p className="akademie-section-label">Oblíbené</p>
          <div className="akademie-grid">
            {favorites.map((p) => (
              <ProgramCard key={p.id} program={p} userId={userId} onOpen={onOpenProgram} />
            ))}
          </div>
        </section>
      )}

      {/* Owned programs */}
      {owned.length > 0 && (
        <section>
          {favorites.length > 0 && (
            <p className="akademie-section-label">Moje programy</p>
          )}
          <div className="akademie-grid">
            {owned.map((p) => (
              <ProgramCard key={p.id} program={p} userId={userId} onOpen={onOpenProgram} />
            ))}
          </div>
        </section>
      )}

      {/* Locked programs */}
      {locked.length > 0 && (
        <section>
          {(owned.length > 0 || favorites.length > 0) && (
            <p className="akademie-section-label">Další programy</p>
          )}
          <div className="akademie-grid">
            {locked.map((p) => (
              <ProgramCard key={p.id} program={p} userId={userId} onOpen={onOpenProgram} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
