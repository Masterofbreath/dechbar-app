import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'
import type {
  AkademieCategory,
  AkademieCategoryVM,
  AkademieProgramVM,
  ToggleFavoriteParams,
} from '../types'

// --------------------------------------------------
// Fetch: categories enriched with access state
// --------------------------------------------------

export async function fetchCategories(userId: string | undefined): Promise<AkademieCategoryVM[]> {
  const { data, error } = await supabase
    .from('akademie_categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  const cats = (data ?? []) as (AkademieCategory & { cover_image_url?: string | null })[]

  const ownedModuleIds = new Set<string>()
  if (userId) {
    const { data: userModules } = await supabase
      .from('user_modules')
      .select('module_id')
      .eq('user_id', userId)
    ;(userModules ?? []).forEach((row: { module_id: string }) => ownedModuleIds.add(row.module_id))
  }

  return cats.map((cat) => ({
    ...cat,
    cover_image_url: cat.cover_image_url ?? null,
    required_module_id: cat.required_module_id ?? null,
    // is_active=false → coming soon, vždy locked
    // is_active=true + required_module_id=null → přístupné pro všechny
    // is_active=true + required_module_id → přístupné jen s modulem
    isAccessible:
      cat.is_active === true &&
      (cat.required_module_id == null || ownedModuleIds.has(cat.required_module_id)),
  }))
}

export function useAkademieCategories(userId: string | undefined) {
  return useQuery({
    queryKey: [...akademieKeys.categories(), userId ?? 'anon'],
    queryFn: () => fetchCategories(userId),
    staleTime: 1000 * 60 * 5,
  })
}

// --------------------------------------------------
// Fetch: user favorites
// --------------------------------------------------

async function fetchUserFavorites(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('user_program_favorites')
    .select('program_id')
    .eq('user_id', userId)
  const set = new Set<string>()
  ;(data ?? []).forEach((row: { program_id: string }) => set.add(row.program_id))
  return set
}

export function useAkademieFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: [...akademieKeys.all, 'favorites', userId ?? 'anon'],
    queryFn: () => (userId ? fetchUserFavorites(userId) : Promise.resolve(new Set<string>())),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  })
}

// --------------------------------------------------
// Mutation: toggle favorite
// --------------------------------------------------

function sortPrograms(programs: AkademieProgramVM[]): AkademieProgramVM[] {
  return [...programs].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    if (a.isOwned && !b.isOwned) return -1
    if (!a.isOwned && b.isOwned) return 1
    return a.sort_order - b.sort_order
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, programId, isFavorite }: ToggleFavoriteParams) => {
      if (isFavorite) {
        const { error } = await supabase
          .from('user_program_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('program_id', programId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_program_favorites')
          .upsert({ user_id: userId, program_id: programId })
        if (error) throw error
      }
    },
    onMutate: async ({ programId, isFavorite }) => {
      // Zruš případné refetche, aby nepřepsaly optimistický update
      await qc.cancelQueries({ queryKey: akademieKeys.programs() })

      // Ulož snapshot pro rollback při chybě
      const previousEntries = qc.getQueriesData<AkademieProgramVM[]>({
        queryKey: akademieKeys.programs(),
      })

      // Okamžitě uprav isFavorite + re-sort ve všech program cache
      qc.setQueriesData<AkademieProgramVM[]>(
        { queryKey: akademieKeys.programs() },
        (old) => {
          if (!old) return old
          const updated = old.map((p) =>
            p.id === programId ? { ...p, isFavorite: !isFavorite } : p,
          )
          return sortPrograms(updated)
        },
      )

      return { previousEntries }
    },
    onError: (_err, _vars, context) => {
      // Rollback při chybě
      context?.previousEntries.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data)
      })
    },
    onSettled: () => {
      // Finální sync se serverem
      qc.invalidateQueries({ queryKey: akademieKeys.programs() })
    },
  })
}

// --------------------------------------------------
// Fetch: programs for a category + access + favorites
// --------------------------------------------------

interface RawProgramRow {
  id: string
  module_id: string
  category_id: string
  description_long: string | null
  cover_image_url: string | null
  sort_order: number
  duration_days: number | null
  daily_minutes: number | null
  modules: {
    id: string
    name: string
    price_czk: number | null
  } | null
}

interface UserModuleRow {
  module_id: string
}

export async function fetchProgramsForCategory(
  categorySlug: string,
  userId: string | undefined,
): Promise<AkademieProgramVM[]> {
  // 1. Resolve category id ze slugu
  const { data: cat, error: catError } = await supabase
    .from('akademie_categories')
    .select('id')
    .eq('slug', categorySlug)
    .single()

  if (catError || !cat) return []

  // 2. Načti programy s daty z modules tabulky
  const { data: programs, error: programsError } = await supabase
    .from('akademie_programs')
    .select(`
      id,
      module_id,
      category_id,
      description_long,
      cover_image_url,
      sort_order,
      duration_days,
      daily_minutes,
      modules ( id, name, price_czk )
    `)
    .eq('category_id', cat.id)
    .order('sort_order', { ascending: true })

  if (programsError) throw programsError
  const programRows = (programs ?? []) as unknown as RawProgramRow[]

  // 3. Načti co user vlastní
  const ownedModuleIds = new Set<string>()
  if (userId) {
    const { data: userModules } = await supabase
      .from('user_modules')
      .select('module_id')
      .eq('user_id', userId)
    ;(userModules as UserModuleRow[] ?? []).forEach((row) => ownedModuleIds.add(row.module_id))
  }

  // 4. Načti favorites
  const favoriteIds = new Set<string>()
  if (userId) {
    const { data: favs } = await supabase
      .from('user_program_favorites')
      .select('program_id')
      .eq('user_id', userId)
    ;(favs ?? []).forEach((row: { program_id: string }) => favoriteIds.add(row.program_id))
  }

  // 5. Enrichment
  const enriched: AkademieProgramVM[] = programRows.map((row) => {
    const isOwned = ownedModuleIds.has(row.module_id)
    return {
      id: row.id,
      module_id: row.module_id,
      category_id: row.category_id,
      description_long: row.description_long,
      cover_image_url: row.cover_image_url,
      sort_order: row.sort_order,
      duration_days: row.duration_days,
      daily_minutes: row.daily_minutes,
      name: row.modules?.name ?? row.module_id,
      price_czk: row.modules?.price_czk ?? 990,
      isOwned,
      isLocked: !isOwned,
      isFavorite: favoriteIds.has(row.id),
    }
  })

  // 6. Řazení: oblíbené (vlastněné) → vlastněné → zamčené
  return enriched.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    if (a.isOwned && !b.isOwned) return -1
    if (!a.isOwned && b.isOwned) return 1
    return a.sort_order - b.sort_order
  })
}

export function useAkademieCatalog(
  categorySlug: string | null,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: [...akademieKeys.programsByCategory(categorySlug), userId ?? 'anon'],
    queryFn: () => fetchProgramsForCategory(categorySlug, userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!categorySlug,
  })
}
