import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/platform/api/supabase'
import { akademieKeys } from './keys'
import type {
  AkademieCategory,
  AkademieProgramVM,
} from '../types'

// --------------------------------------------------
// Fetch: all active categories
// --------------------------------------------------

async function fetchCategories(): Promise<AkademieCategory[]> {
  const { data, error } = await supabase
    .from('akademie_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useAkademieCategories() {
  return useQuery({
    queryKey: akademieKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5, // 5 minut — kategorie se nemění často
  })
}

// --------------------------------------------------
// Fetch: programs for a category + access merge
// --------------------------------------------------

interface RawProgramRow {
  id: string
  module_id: string
  category_id: string
  description_long: string | null
  cover_image_url: string | null
  sort_order: number
  modules: {
    id: string
    name: string
    price_czk: number | null
  } | null
}

interface UserModuleRow {
  module_id: string
}

async function fetchProgramsForCategory(
  categorySlug: string,
  userId: string | undefined,
): Promise<AkademieProgramVM[]> {
  // 1. Načti programy s daty z modules tabulky
  const { data: programs, error: programsError } = await supabase
    .from('akademie_programs')
    .select(`
      id,
      module_id,
      category_id,
      description_long,
      cover_image_url,
      sort_order,
      modules ( id, name, price_czk )
    `)
    .eq('akademie_categories.slug', categorySlug)
    .order('sort_order', { ascending: true })

  // Fallback: pokud filtr přes join nefunguje, načti přes category join
  let programRows: RawProgramRow[] = []
  if (programsError || !programs || programs.length === 0) {
    const { data: cat } = await supabase
      .from('akademie_categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()

    if (!cat) return []

    const { data: fallback, error: fallbackError } = await supabase
      .from('akademie_programs')
      .select(`
        id,
        module_id,
        category_id,
        description_long,
        cover_image_url,
        sort_order,
        modules ( id, name, price_czk )
      `)
      .eq('category_id', cat.id)
      .order('sort_order', { ascending: true })

    if (fallbackError) throw fallbackError
    programRows = (fallback ?? []) as unknown as RawProgramRow[]
  } else {
    programRows = (programs ?? []) as unknown as RawProgramRow[]
  }

  // 2. Načti co user vlastní (pouze pro přihlášené)
  const ownedModuleIds = new Set<string>()
  if (userId) {
    const { data: userModules } = await supabase
      .from('user_modules')
      .select('module_id')
      .eq('user_id', userId)

    ;(userModules as UserModuleRow[] ?? []).forEach((row) => {
      ownedModuleIds.add(row.module_id)
    })
  }

  // 3. Enrichment — přidej isOwned/isLocked, seřaď: owned first
  const enriched: AkademieProgramVM[] = programRows.map((row) => {
    const isOwned = ownedModuleIds.has(row.module_id)
    return {
      id: row.id,
      module_id: row.module_id,
      category_id: row.category_id,
      description_long: row.description_long,
      cover_image_url: row.cover_image_url,
      sort_order: row.sort_order,
      name: row.modules?.name ?? row.module_id,
      price_czk: row.modules?.price_czk ?? 990,
      isOwned,
      isLocked: !isOwned,
    }
  })

  return enriched.sort((a, b) => {
    if (a.isOwned && !b.isOwned) return -1
    if (!a.isOwned && b.isOwned) return 1
    return a.sort_order - b.sort_order
  })
}

export function useAkademieCatalog(
  categorySlug: string,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: akademieKeys.programsByCategory(categorySlug),
    queryFn: () => fetchProgramsForCategory(categorySlug, userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!categorySlug,
  })
}
