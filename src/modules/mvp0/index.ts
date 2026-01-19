/**
 * MVP0 Module - Public API
 * 
 * Core breathing protocols module.
 * Exports pages and components for use in app routing.
 * 
 * @package DechBar_App
 * @subpackage Modules/MVP0
 */

// Pages
export { DnesPage } from './pages/DnesPage';
export { CvicitPage } from './pages/CvicitPage';
export { AkademiePage } from './pages/AkademiePage';
export { PokrokPage } from './pages/PokrokPage';
export { ProfilPage } from './pages/ProfilPage';
export { SettingsPage } from './pages/SettingsPage';

// Components (if needed by other modules)
export { LockedFeatureModal } from './components/LockedFeatureModal';
export type { LockedFeatureModalProps } from './components/LockedFeatureModal';

// API Hooks
export {
  useExercises,
  useExercise,
  useCustomExerciseCount,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
  useExerciseSessions,
  useCompleteSession,
  useSafetyFlags,
  useUpdateSafetyFlags,
  exerciseKeys,
} from './api/exercises';

// Types
export type {
  Exercise,
  ExercisePhase,
  BreathingPattern,
  ExerciseSession,
  SafetyFlags,
  CreateExercisePayload,
  CompleteSessionPayload,
  SafetyQuestionnaireAnswers,
  ExerciseCategory,
  ExerciseSubcategory,
  ExerciseDifficulty,
  MembershipTier,
  PhaseType,
  Contraindication,
  MoodType,
  SessionState,
  SessionEngineState,
} from './types/exercises';
