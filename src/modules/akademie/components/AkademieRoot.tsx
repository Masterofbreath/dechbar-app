import { useAuth } from '@/platform/auth'
import { useAkademieNav } from '../hooks/useAkademieNav'
import { useAkademieCategories, useAkademieCatalog } from '../api/useAkademieCatalog'
import { CategoryPills } from './CategoryPills'
import { ProgramGrid } from './ProgramGrid'
import { ProgramDetail } from './ProgramDetail'
import { SeriesDetail } from './SeriesDetail'

/**
 * AkademieRoot — orchestrátor celého Akademie tabu.
 *
 * Renderuje správný view podle routeStack z useAkademieNav:
 *   - routeStack.length === 0  → ProgramGrid (výchozí)
 *   - top.type === 'program'   → ProgramDetail
 *   - top.type === 'series'    → SeriesDetail
 */
export function AkademieRoot() {
  const { user } = useAuth()
  const { activeCategorySlug, routeStack, selectCategory, openProgram, openSeries, back } =
    useAkademieNav()

  const { data: categories, isLoading: categoriesLoading } = useAkademieCategories()
  const { data: programs, isLoading: programsLoading } = useAkademieCatalog(
    activeCategorySlug,
    user?.id,
  )

  const currentRoute = routeStack[routeStack.length - 1]

  // Najdi aktuální program z listu pro ProgramDetail
  const currentProgram =
    currentRoute?.type === 'program' || currentRoute?.type === 'series'
      ? programs?.find((p) => p.id === (currentRoute.type === 'program'
          ? currentRoute.programId
          : currentRoute.programId))
      : undefined

  // Najdi aktuální sérii pro SeriesDetail
  // Série si načte SeriesDetail sám přes API — stačí nám ID
  const currentSeriesData =
    currentRoute?.type === 'series'
      ? { id: currentRoute.seriesId, programId: currentRoute.programId }
      : undefined

  return (
    <div className="akademie-root">
      {/* Category navigation — vždy viditelná */}
      {!categoriesLoading && categories && categories.length > 0 && (
        <div style={{ paddingTop: 8, paddingBottom: 16 }}>
          <CategoryPills
            categories={categories}
            activeSlug={activeCategorySlug}
            onSelect={selectCategory}
          />
        </div>
      )}

      {/* Skeleton pro categories */}
      {categoriesLoading && (
        <div style={{ padding: '8px 16px 16px', display: 'flex', gap: 8 }}>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                height: 36,
                width: 100,
                borderRadius: 9999,
                background: 'var(--color-surface-elevated)',
              }}
            />
          ))}
        </div>
      )}

      {/* View: ProgramGrid (home) */}
      {!currentRoute && (
        <ProgramGrid
          programs={programs ?? []}
          isLoading={programsLoading}
          onOpenProgram={openProgram}
        />
      )}

      {/* View: ProgramDetail */}
      {currentRoute?.type === 'program' && currentProgram && (
        <ProgramDetail
          program={currentProgram}
          onBack={back}
          onOpenSeries={openSeries}
        />
      )}

      {/* View: SeriesDetail */}
      {currentRoute?.type === 'series' && currentSeriesData && (
        <SeriesDetailWrapper
          seriesId={currentSeriesData.id}
          programModuleId={currentProgram?.module_id ?? ''}
          userId={user?.id}
          onBack={back}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper: SeriesDetailWrapper — načte sérii z useAkademieSeries a předá dál
// ---------------------------------------------------------------------------
import { useAkademieSeries } from '../api/useAkademieProgram'

interface SeriesDetailWrapperProps {
  seriesId: string
  programModuleId: string
  userId: string | undefined
  onBack: () => void
}

function SeriesDetailWrapper({ seriesId, programModuleId, userId, onBack }: SeriesDetailWrapperProps) {
  const { data: allSeries, isLoading } = useAkademieSeries(programModuleId)
  const series = allSeries?.find((s) => s.id === seriesId)

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <button className="akademie-back" onClick={onBack} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Zpět
        </button>
      </div>
    )
  }

  if (!series) return null

  return <SeriesDetail series={series} userId={userId} onBack={onBack} />
}
