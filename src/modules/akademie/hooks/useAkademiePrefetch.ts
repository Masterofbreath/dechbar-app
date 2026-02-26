/**
 * useAkademiePrefetch — prefetch celého Akademie katalogu do React Query cache.
 *
 * Strategie (4 úrovně):
 *
 *   prefetchAll (spustí se při kliknutí na Akademie tab)
 *     L1: Kategorie
 *     L2: Programy pro každou aktivní kategorii
 *     L3: Série pro VŠECHNY programy (vlastněné i zamčené — nyní je otevíráme)
 *
 *   prefetchCategoryDeep (spustí se při kliknutí na category card)
 *     L1: Programy kategorie (z cache nebo fetch)
 *     L2: Série pro VŠECHNY programy
 *     L3: Lekce pro VŠECHNY série
 *
 *   prefetchProgramDeep (spustí se při kliknutí na konkrétní program)
 *     L1: Série programu (z cache nebo fetch)
 *     L2: Lekce pro VŠECHNY série programu (parallel)
 *
 * Výsledek: uživatel nevidí žádné loading stavy při přecházení.
 * prefetchQuery je neblokující — běží na pozadí, UI není ovlivněno.
 */

import { useQueryClient } from '@tanstack/react-query'
import { akademieKeys } from '../api/keys'
import { fetchCategories, fetchProgramsForCategory } from '../api/useAkademieCatalog'
import { fetchSeries, fetchLessonsWithProgress } from '../api/useAkademieProgram'
import type { AkademieCategoryVM, AkademieProgramVM, AkademieSeries } from '../types'

const STALE_CATEGORIES = 1000 * 60 * 5  // 5 min
const STALE_PROGRAMS   = 1000 * 60 * 2  // 2 min
const STALE_SERIES     = 1000 * 60 * 10 // 10 min
const STALE_LESSONS    = 1000 * 60 * 2  // 2 min

/**
 * Spustí preload obrázků do browser cache — neblokující.
 */
function preloadImages(urls: (string | null | undefined)[]) {
  urls.forEach((url) => {
    if (!url) return
    const img = new Image()
    img.src = url
  })
}

export function useAkademiePrefetch() {
  const queryClient = useQueryClient()

  /**
   * prefetchAll — 3-úrovňový prefetch při vstupu do Akademie tabu.
   * Série se načítají pro VŠECHNY programy (vlastněné i zamčené).
   */
  const prefetchAll = async (userId: string | undefined) => {
    const userKey = userId ?? 'anon'

    // ── Level 1: Kategorie ──────────────────────────────────────────────────
    await queryClient.prefetchQuery({
      queryKey: [...akademieKeys.categories(), userKey],
      queryFn: () => fetchCategories(userId),
      staleTime: STALE_CATEGORIES,
    })

    const categories = queryClient.getQueryData<AkademieCategoryVM[]>(
      [...akademieKeys.categories(), userKey],
    )
    if (!categories?.length) return

    preloadImages(categories.map((c) => c.cover_image_url))

    const activeCategories = categories.filter((c) => c.is_active)

    // ── Level 2: Programy pro každou aktivní kategorii (parallel) ──────────
    await Promise.all(
      activeCategories.map((cat) =>
        queryClient.prefetchQuery({
          queryKey: [...akademieKeys.programsByCategory(cat.slug), userKey],
          queryFn: () => fetchProgramsForCategory(cat.slug, userId),
          staleTime: STALE_PROGRAMS,
        }),
      ),
    )

    const allPrograms = activeCategories.flatMap((cat) =>
      queryClient.getQueryData<AkademieProgramVM[]>(
        [...akademieKeys.programsByCategory(cat.slug), userKey],
      ) ?? [],
    )

    preloadImages(allPrograms.map((p) => p.cover_image_url))

    if (!allPrograms.length) return

    // ── Level 3: Série pro VŠECHNY programy (vlastněné i zamčené) ──────────
    await Promise.all(
      allPrograms.map((p) =>
        queryClient.prefetchQuery({
          queryKey: akademieKeys.series(p.module_id),
          queryFn: () => fetchSeries(p.module_id),
          staleTime: STALE_SERIES,
        }),
      ),
    )
  }

  /**
   * prefetchCategoryDeep — hluboký prefetch při kliknutí na category card.
   * Pokrývá VŠECHNY programy (i zamčené) a VŠECHNY jejich lekce.
   */
  const prefetchCategoryDeep = async (categorySlug: string, userId: string | undefined) => {
    const userKey = userId ?? 'anon'

    // ── Level 1: Programy pro kategorii ────────────────────────────────────
    await queryClient.prefetchQuery({
      queryKey: [...akademieKeys.programsByCategory(categorySlug), userKey],
      queryFn: () => fetchProgramsForCategory(categorySlug, userId),
      staleTime: STALE_PROGRAMS,
    })

    const programs = queryClient.getQueryData<AkademieProgramVM[]>(
      [...akademieKeys.programsByCategory(categorySlug), userKey],
    )
    if (!programs?.length) return

    preloadImages(programs.map((p) => p.cover_image_url))

    // ── Level 2: Série pro VŠECHNY programy (parallel) ─────────────────────
    await Promise.all(
      programs.map((p) =>
        queryClient.prefetchQuery({
          queryKey: akademieKeys.series(p.module_id),
          queryFn: () => fetchSeries(p.module_id),
          staleTime: STALE_SERIES,
        }),
      ),
    )

    // ── Level 3: Lekce pro VŠECHNY série (parallel) ─────────────────────────
    const allSeriesIds: string[] = []
    for (const p of programs) {
      const series = queryClient.getQueryData<AkademieSeries[]>(
        akademieKeys.series(p.module_id),
      )
      series?.forEach((s) => allSeriesIds.push(s.id))
    }

    if (!allSeriesIds.length) return

    await Promise.all(
      allSeriesIds.map((seriesId) =>
        queryClient.prefetchQuery({
          queryKey: akademieKeys.lessons(seriesId),
          queryFn: () => fetchLessonsWithProgress(seriesId, userId),
          staleTime: STALE_LESSONS,
        }),
      ),
    )
  }

  /**
   * prefetchProgramDeep — hluboký prefetch při kliknutí na konkrétní program.
   * Načte série + VŠECHNY lekce všech sérií daného programu.
   * Zavolat co nejdříve (v onClick handleru) aby data byla v cache
   * dříve, než se ProgramDetail vyrenderuje.
   */
  const prefetchProgramDeep = async (moduleId: string, userId: string | undefined) => {
    // ── Level 1: Série programu (z cache nebo fetch) ────────────────────────
    await queryClient.prefetchQuery({
      queryKey: akademieKeys.series(moduleId),
      queryFn: () => fetchSeries(moduleId),
      staleTime: STALE_SERIES,
    })

    const series = queryClient.getQueryData<AkademieSeries[]>(
      akademieKeys.series(moduleId),
    )
    if (!series?.length) return

    // ── Level 2: Lekce pro VŠECHNY série (parallel) ─────────────────────────
    await Promise.all(
      series.map((s) =>
        queryClient.prefetchQuery({
          queryKey: akademieKeys.lessons(s.id),
          queryFn: () => fetchLessonsWithProgress(s.id, userId),
          staleTime: STALE_LESSONS,
        }),
      ),
    )
  }

  return { prefetchAll, prefetchCategoryDeep, prefetchProgramDeep }
}
