/**
 * Exercise Creator - Public API
 * 
 * Exports all public components and utilities.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/ExerciseCreator
 */

// Main modal component
export { ExerciseCreatorModal } from './ExerciseCreatorModal';

// Sub-components (if needed externally)
export { ModeToggle } from './components/ModeToggle';

// Hooks
export { useExerciseCreator } from './hooks/useExerciseCreator';
export { useDurationCalculator } from './hooks/useDurationCalculator';
export { useBreathingValidation } from './hooks/useBreathingValidation';

// Types
export type {
  DraftExercise,
  ValidationErrors,
  ExerciseCreatorModalProps,
  PresetColor,
} from './types';

// Constants
export {
  EXERCISE_CREATOR_LIMITS,
  DEFAULT_EXERCISE,
  PRESET_COLORS,
  QUICK_PRESETS,
} from './constants';
