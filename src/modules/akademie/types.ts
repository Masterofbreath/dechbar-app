// =====================================================
// Akademie Module — TypeScript Types
// =====================================================

// --------------------------------------------------
// Lesson technique types (for SMART CVIČENÍ algorithm)
// --------------------------------------------------

/**
 * Dechová technika lekce.
 * Primární signál pro SMART CVIČENÍ algoritmus — čte user_lesson_favorites
 * + user_lesson_progress s JOIN na akademie_lessons.primary_technique.
 *
 * České názvy pro AI agenty a admin UI:
 *   humming           → Bzučení
 *   box_breathing     → Box Breathing
 *   extended_exhale   → Prodloužený výdech
 *   belly_breathing   → Břišní dýchání
 *   retention         → Zadržení dechu
 *   visualization     → Vizualizace
 *   pursed_lip        → Přidušené rty
 *   energizing        → Energizující
 *   other             → Ostatní
 */
export type LessonTechnique =
  | 'humming'
  | 'box_breathing'
  | 'extended_exhale'
  | 'belly_breathing'
  | 'retention'
  | 'visualization'
  | 'pursed_lip'
  | 'energizing'
  | 'other';

/** Czech labels for LessonTechnique — used in admin UI and future AI context */
export const LESSON_TECHNIQUE_LABELS: Record<LessonTechnique, string> = {
  humming: 'Bzučení',
  box_breathing: 'Box Breathing',
  extended_exhale: 'Prodloužený výdech',
  belly_breathing: 'Aktivace bránice',
  retention: 'Zádrže dechu',
  visualization: 'Vizualizace',
  pursed_lip: 'Přidušení',
  energizing: 'Hyperventilace',
  other: 'Funkční',
};

// --------------------------------------------------
// DB entity types (mirror Supabase schema)
// --------------------------------------------------

export interface AkademieCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  /** Krátký popis — zobrazuje se na kartě v CategoryGrid */
  description: string | null
  /** Dlouhý popis — zobrazuje se jako nadpis v ProgramListView */
  description_long: string | null
  cover_image_url: string | null
  sort_order: number
  is_active: boolean
  /** Pokud nastaveno, kategorie vyžaduje ownership tohoto module_id */
  required_module_id: string | null
}

/** Category enriched s access stavem */
export interface AkademieCategoryVM extends AkademieCategory {
  /** Uživatel má přístup (required_module_id === null nebo vlastní modul) */
  isAccessible: boolean
  /** Počet programů v kategorii */
  programCount?: number
}

export interface AkademieProgram {
  id: string
  module_id: string
  category_id: string
  description_long: string | null
  cover_image_url: string | null
  sort_order: number
  /** Délka programu ve dnech (např. 21). NULL = nezadáno. */
  duration_days: number | null
  /** Doporučená délka denní lekce v minutách (např. 15). NULL = nezadáno. */
  daily_minutes: number | null
  /**
   * Datum spuštění programu (ISO string).
   * Pokud je nastaveno, lekce se odemykají postupně: day_number <= daysElapsed.
   * NULL = vše dostupné okamžitě.
   */
  launch_date: string | null
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
  /** Primární dechová technika — čte SMART CVIČENÍ algoritmus */
  primary_technique: LessonTechnique | null
  /** Sekundární dechová technika (volitelná, rozšiřitelná) */
  secondary_technique: LessonTechnique | string | null
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
  /** True if user marked as favorite */
  isFavorite: boolean
}

/** Series enriched with access state */
export interface AkademieSeriesVM extends AkademieSeries {
  /** True if user has access to this series (owns parent program or this specific series) */
  isOwned: boolean
  /** True if locked (neither parent program nor series owned) */
  isLocked: boolean
  /** Number of completed lessons */
  completedCount?: number
  /** Total lessons in this series */
  totalCount?: number
}

/** Lesson enriched with completion state and favorite */
export interface LessonWithProgress extends AkademieLesson {
  isCompleted: boolean
  isFavorite: boolean
}

export interface ToggleLessonFavoriteParams {
  userId: string
  lessonId: string
  seriesId: string
  isFavorite: boolean
}

// --------------------------------------------------
// Navigation types
// --------------------------------------------------

export type AkademieRoute =
  | { type: 'home' }
  | { type: 'program'; programId: string }
  | { type: 'series'; seriesId: string; programId: string }

export interface AkademieNavState {
  activeCategorySlug: string | null
  routeStack: AkademieRoute[]
  /** module_id čekající na auto-otevření po načtení programů (deep link z emailu) */
  pendingModuleId: string | null
  selectCategory: (slug: string) => void
  openProgram: (programId: string) => void
  openSeries: (seriesId: string, programId: string) => void
  back: () => void
  reset: () => void
  setPendingModuleId: (id: string | null) => void
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

export interface ToggleFavoriteParams {
  userId: string
  programId: string
  isFavorite: boolean
}
