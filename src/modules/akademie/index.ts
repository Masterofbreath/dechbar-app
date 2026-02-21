/**
 * Akademie Module — Public API
 *
 * Exportuje pouze to, co ostatní moduly smí importovat.
 * Interní implementační detaily zůstávají privátní.
 */

// Main component
export { AkademieRoot } from './components/AkademieRoot'

// Navigation store (pro případ že jiný modul potřebuje resetovat nav)
export { useAkademieNav } from './hooks/useAkademieNav'

// Types (pro re-use v budoucích modulech)
export type {
  AkademieCategory,
  AkademieCategoryVM,
  AkademieProgram,
  AkademieProgramVM,
  AkademieSeries,
  AkademieSeriesVM,
  AkademieLesson,
  LessonWithProgress,
  AkademieRoute,
  ToggleFavoriteParams,
} from './types'
