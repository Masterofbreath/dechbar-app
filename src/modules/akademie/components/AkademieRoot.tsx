import { useAuth } from '@/platform/auth'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import { useState } from 'react'
import { useAkademieNav } from '../hooks/useAkademieNav'
import { useAkademieCategories, useAkademieCatalog } from '../api/useAkademieCatalog'
import { CategoryGrid } from './CategoryGrid'
import { ProgramGrid } from './ProgramGrid'
import { ProgramDetail } from './ProgramDetail'

/**
 * AkademieRoot — orchestrátor celého Akademie tabu.
 *
 * Navigační flow:
 *   routeStack.length === 0 && !activeCategorySlug → CategoryGrid
 *   routeStack.length === 0 && activeCategorySlug   → ProgramGrid
 *   top.type === 'program'                          → ProgramDetail (s accordion sériemi)
 *
 * Series se otevírají inline jako accordion v ProgramDetail — žádná samostatná SeriesDetail stránka.
 */
export function AkademieRoot() {
  const { user } = useAuth()
  const { activeCategorySlug, routeStack, selectCategory, openProgram, back, reset } =
    useAkademieNav()

  const [lockedModalOpen, setLockedModalOpen] = useState(false)

  const { data: categories, isLoading: categoriesLoading } = useAkademieCategories(user?.id)
  const { data: programs, isLoading: programsLoading } = useAkademieCatalog(
    activeCategorySlug,
    user?.id,
  )

  const currentRoute = routeStack[routeStack.length - 1]

  // Aktuální program (pro ProgramDetail)
  const currentProgram =
    currentRoute?.type === 'program'
      ? programs?.find((p) => p.id === currentRoute.programId)
      : undefined

  // HOME view: žádná kategorie vybraná
  const isHomeView = !activeCategorySlug && routeStack.length === 0

  // PROGRAM LIST view: kategorie vybraná, ale žádný program
  const isProgramListView = !!activeCategorySlug && routeStack.length === 0

  // PROGRAM DETAIL view: program je vybraný
  const isProgramDetailView = currentRoute?.type === 'program'

  // Kategorie skeleton
  const renderCategorySkeleton = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '8px 16px 24px' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: 110,
            borderRadius: 16,
            background: 'var(--color-surface-elevated)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  )

  return (
    <div className="akademie-root">
      {/* HOME: CategoryGrid */}
      {isHomeView && (
        <>
          {categoriesLoading && renderCategorySkeleton()}
          {!categoriesLoading && categories && (
            <CategoryGrid
              categories={categories}
              onSelect={(slug) => {
                // Najdi kategorii
                const cat = categories.find((c) => c.slug === slug)
                if (!cat) return
                if (!cat.isAccessible) {
                  // Zamčená kategorie → LockedFeatureModal
                  setLockedModalOpen(true)
                  return
                }
                selectCategory(slug)
              }}
            />
          )}
        </>
      )}

      {/* PROGRAM LIST: ProgramGrid */}
      {isProgramListView && (
        <>
          {/* Tlačítko zpět na CategoryGrid */}
          <button
            className="akademie-back"
            onClick={reset}
            type="button"
            style={{ margin: '12px 16px 0' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Akademie
          </button>

          {/* Nadpis kategorie */}
          {categories && (
            <div style={{ padding: '8px 16px 4px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {categories.find((c) => c.slug === activeCategorySlug)?.name}
              </h2>
            </div>
          )}

          <ProgramGrid
            programs={programs ?? []}
            isLoading={programsLoading}
            userId={user?.id}
            onOpenProgram={openProgram}
          />
        </>
      )}

      {/* PROGRAM DETAIL: inline accordion série */}
      {isProgramDetailView && currentProgram && (
        <ProgramDetail
          program={currentProgram}
          userId={user?.id}
          onBack={back}
        />
      )}

      {/* Fallback: program nenalezen (race condition) */}
      {isProgramDetailView && !currentProgram && !programsLoading && (
        <div style={{ padding: 16 }}>
          <button className="akademie-back" onClick={back} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Zpět
          </button>
        </div>
      )}

      {/* LockedFeatureModal pro zamčené kategorie */}
      <LockedFeatureModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        featureName="VIP sekce"
        tierRequired="AKADEMIE"
        websiteUrl="https://zdravedychej.cz"
      />
    </div>
  )
}
