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
  AkademieProgram,
  AkademieProgramVM,
  AkademieSeries,
  AkademieLesson,
  LessonWithProgress,
  AkademieRoute,
} from './types'
