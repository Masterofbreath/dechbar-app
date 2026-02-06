/**
 * Exercise Creator - TypeScript Types
 * @module ExerciseCreator/types
 * @description Type definitions for Exercise Creator component
 */

import type { Exercise } from '../../types/exercise';

/**
 * Draft exercise state (before save)
 * Mirrors Exercise but all fields are mutable
 */
export interface DraftExercise {
  name: string;
  description: string;
  breathingPattern: {
    inhale_seconds: number;
    hold_after_inhale_seconds: number;
    exhale_seconds: number;
    hold_after_exhale_seconds: number;
  };
  repetitions: number;
  card_color: string; // Hex color (#RRGGBB)
  mode: 'simple' | 'complex'; // UI mode, not saved to DB
}

/**
 * Validation error state
 */
export interface ValidationErrors {
  name?: string;
  description?: string;
  breathingPattern?: string;
  totalDuration?: string;
}

/**
 * Preset color option for ColorPicker
 */
export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  temperament: 'sangvinik' | 'cholerik' | 'melancholik' | 'flegmatik';
}

/**
 * Exercise Creator XState context
 */
export interface ExerciseCreatorContext {
  draft: DraftExercise;
  errors: ValidationErrors;
  isNameDuplicate: boolean;
  hasUnsavedChanges: boolean;
  saveError?: string;
}

/**
 * Exercise Creator XState events
 */
export type ExerciseCreatorEvent =
  | { type: 'UPDATE_NAME'; value: string }
  | { type: 'UPDATE_DESCRIPTION'; value: string }
  | { type: 'UPDATE_INHALE'; value: number }
  | { type: 'UPDATE_HOLD_INHALE'; value: number }
  | { type: 'UPDATE_EXHALE'; value: number }
  | { type: 'UPDATE_HOLD_EXHALE'; value: number }
  | { type: 'UPDATE_REPETITIONS'; value: number }
  | { type: 'UPDATE_COLOR'; value: string }
  | { type: 'TOGGLE_MODE' }
  | { type: 'VALIDATE' }
  | { type: 'SAVE' }
  | { type: 'CANCEL' }
  | { type: 'RETRY_SAVE' }
  | { type: 'CONFIRM_DISCARD' }
  | { type: 'CANCEL_DISCARD' };

/**
 * Props for ExerciseCreatorModal
 */
export interface ExerciseCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (exercise: Exercise) => void;
  mode?: 'create' | 'edit' | 'duplicate';
  exerciseId?: string; // For edit/duplicate mode
  sourceExercise?: Exercise; // For duplicate mode (pre-fill data)
}
