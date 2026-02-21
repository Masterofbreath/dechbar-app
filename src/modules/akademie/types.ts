// =====================================================
// Akademie Module — TypeScript Types
// =====================================================

// --------------------------------------------------
// DB entity types (mirror Supabase schema)
// --------------------------------------------------

export interface AkademieCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  sort_order: number
  is_active: boolean
}

export interface AkademieProgram {
  id: string
  module_id: string
  category_id: string
  description_long: string | null
  cover_image_url: string | null
  sort_order: number
}

export interface AkademieSeries {
  id: string
  module_id: string
  series_module_id: string | null
  name: string
  description: string | null
  week_number: number
  sort_order: number
}

export interface AkademieLesson {
  id: string
  series_id: string
  module_id: string
  title: string
  audio_url: string
  duration_seconds: number
  day_number: number
  sort_order: number
}

export interface UserLessonProgress {
  user_id: string
  lesson_id: string
  completed_at: string
  play_duration_seconds: number
}

// --------------------------------------------------
// View-model types (enriched with app-level state)
// --------------------------------------------------

/** Program enriched with access state */
export interface AkademieProgramVM extends AkademieProgram {
  /** Display name from modules table */
  name: string
  /** Price in CZK from modules table */
  price_czk: number
  /** True if user has this module in user_modules */
  isOwned: boolean
  /** True if user does NOT own this (shows padlock) */
  isLocked: boolean
}

/** Lesson enriched with completion state */
export interface LessonWithProgress extends AkademieLesson {
  isCompleted: boolean
}

// --------------------------------------------------
// Navigation types
// --------------------------------------------------

export type AkademieRoute =
  | { type: 'home' }
  | { type: 'program'; programId: string }
  | { type: 'series'; seriesId: string; programId: string }

export interface AkademieNavState {
  activeCategorySlug: string
  routeStack: AkademieRoute[]
  selectCategory: (slug: string) => void
  openProgram: (programId: string) => void
  openSeries: (seriesId: string, programId: string) => void
  back: () => void
  reset: () => void
}

// --------------------------------------------------
// Query param / hook input types
// --------------------------------------------------

export interface UseAkademieCatalogParams {
  categorySlug: string
  userId: string | undefined
}

export interface UseAkademieProgramParams {
  moduleId: string
  userId: string | undefined
}
