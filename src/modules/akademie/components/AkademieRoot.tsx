import { useAuth } from '@/platform/auth'
import { LockedFeatureModal } from '@/modules/mvp0/components'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAkademieNav } from '../hooks/useAkademieNav'
import { useAkademieCategories, useAkademieCatalog } from '../api/useAkademieCatalog'
import { useAkademiePrefetch } from '../hooks/useAkademiePrefetch'
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
 *
 * Deep link flow (magic link z emailu):
 *   pendingModuleId je nastaven z AppLayoutWrapper po detekci ?module= query param.
 *   Po načtení programs najdeme program podle module_id a rovnou otevřeme ProgramDetail.
 */
export function AkademieRoot() {
  const { user } = useAuth()
  const { activeCategorySlug, routeStack, selectCategory, openProgram, back, reset, pendingModuleId, setPendingModuleId } =
    useAkademieNav()
  const { prefetchCategoryDeep, prefetchProgramDeep } = useAkademiePrefetch()

  const [lockedModalOpen, setLockedModalOpen] = useState(false)

  // Swipe-back gesture: pravý tah nebo rychlý flick doleva = jít zpět
  const swipeStartX = useRef(0)
  const swipeStartY = useRef(0)
  const swipeStartTime = useRef(0)

  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX
    swipeStartY.current = e.touches[0].clientY
    swipeStartTime.current = Date.now()
  }, [])

  const handleSwipeTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current)
    const elapsed = Date.now() - swipeStartTime.current
    const velocity = dx / elapsed // px/ms (kladné = doprava)

    // Aktivovat: pravý tah min. 55px s max. drift 50px NEBO rychlý flick > 0.4px/ms
    const isBackGesture = (dx > 55 && dy < 50) || (dx > 20 && velocity > 0.4 && dy < 40)

    if (isBackGesture) {
      if (routeStack.length > 0) {
        back()
      } else if (activeCategorySlug) {
        reset()
      }
    }
  }, [routeStack.length, activeCategorySlug, back, reset])

  const { data: categories, isLoading: categoriesLoading } = useAkademieCategories(user?.id)
  const { data: programs, isLoading: programsLoading } = useAkademieCatalog(
    activeCategorySlug,
    user?.id,
  )

  // Deep link: po načtení programs auto-otevři program dle module_id
  useEffect(() => {
    if (!pendingModuleId || !programs || programs.length === 0) return
    const target = programs.find((p) => p.module_id === pendingModuleId)
    if (target) {
      openProgram(target.id)
      setPendingModuleId(null)
    }
  }, [programs, pendingModuleId, openProgram, setPendingModuleId])

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
    <div
      className="akademie-root"
      onTouchStart={handleSwipeTouchStart}
      onTouchEnd={handleSwipeTouchEnd}
    >
      {/* HOME: CategoryGrid */}
      {isHomeView && (
        <>
          {categoriesLoading && renderCategorySkeleton()}
          {!categoriesLoading && categories && (
            <CategoryGrid
              categories={categories}
              onSelect={(slug) => {
                const cat = categories.find((c) => c.slug === slug)
                if (!cat) return
                if (!cat.isAccessible) {
                  setLockedModalOpen(true)
                  return
                }
                // Hluboký prefetch na pozadí: programs + series + lessons
                prefetchCategoryDeep(slug, user?.id)
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
            aria-label="Zpět na Akademie"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Akademie
          </button>

          {/* Nadpis a popis kategorie */}
          {categories && (() => {
            const cat = categories.find((c) => c.slug === activeCategorySlug)
            return cat ? (
              <div className="akademie-category-heading">
                <h2 className="akademie-category-heading__title">{cat.name}</h2>
                {(cat.description_long ?? cat.description) && (
                  <p className="akademie-category-heading__desc">
                    {cat.description_long ?? cat.description}
                  </p>
                )}
              </div>
            ) : null
          })()}

          <ProgramGrid
            programs={programs ?? []}
            isLoading={programsLoading}
            userId={user?.id}
            onOpenProgram={(programId) => {
              // Spustit deep prefetch série + lekcí souběžně s navigací
              const program = programs?.find((p) => p.id === programId)
              if (program) {
                prefetchProgramDeep(program.module_id, user?.id)
              }
              openProgram(programId)
            }}
          />
        </>
      )}

      {/* PROGRAM DETAIL: inline accordion série */}
      {isProgramDetailView && currentProgram && (
        <ProgramDetail
          program={currentProgram}
          userId={user?.id}
          onBack={back}
          backLabel={categories?.find((c) => c.slug === activeCategorySlug)?.name ?? 'Zpět'}
          categorySlug={activeCategorySlug ?? ''}
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
