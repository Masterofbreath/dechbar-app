import { ProgramCard } from './ProgramCard'
import type { AkademieProgramVM } from '../../types'

interface ProgramGridProps {
  programs: AkademieProgramVM[]
  isLoading: boolean
  onOpenProgram: (programId: string) => void
}

export function ProgramGrid({ programs, isLoading, onOpenProgram }: ProgramGridProps) {
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

  const owned = programs.filter((p) => p.isOwned)
  const locked = programs.filter((p) => p.isLocked)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Owned programs — full-width if single, grid if multiple */}
      {owned.length > 0 && (
        <section>
          {owned.length === 1 ? (
            <div style={{ padding: '0 var(--akademie-page-px)' }}>
              <ProgramCard program={owned[0]} onOpen={onOpenProgram} />
            </div>
          ) : (
            <div className="akademie-grid">
              {owned.map((p) => (
                <ProgramCard key={p.id} program={p} onOpen={onOpenProgram} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Locked programs */}
      {locked.length > 0 && (
        <section>
          {owned.length > 0 && (
            <p className="akademie-section-label" style={{ marginBottom: 10 }}>
              Další programy
            </p>
          )}
          <div className={`akademie-grid${locked.length === 1 ? ' akademie-grid--single' : ''}`}>
            {locked.map((p) => (
              <ProgramCard key={p.id} program={p} onOpen={onOpenProgram} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
