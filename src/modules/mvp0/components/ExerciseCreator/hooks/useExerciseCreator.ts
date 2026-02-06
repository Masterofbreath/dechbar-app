/**
 * Exercise Creator - XState Machine Hook
 * @module ExerciseCreator/hooks/useExerciseCreator
 * @description Main state management for Exercise Creator using XState v5
 */

import { useMachine } from '@xstate/react';
import { setup, assign } from 'xstate';
import { useCallback, useEffect, useState } from 'react';
import type {
  ExerciseCreatorContext,
  ExerciseCreatorEvent,
  DraftExercise,
} from '../types';
import { DEFAULT_DRAFT_EXERCISE, ANALYTICS_EVENTS } from '../config';
import { useBreathingValidation } from './useBreathingValidation';
import { useDurationCalculator } from './useDurationCalculator';
import { useExerciseNameExists } from './useExerciseNameExists';
import { useCreateExercise, useUpdateExercise, useExercise } from '../../../api/exercises';
import { trackEvent } from '../../../../../platform/utils/analytics';

/**
 * Exercise Creator State Machine
 * States: idle → editing → validating → saving → success/error
 */
const exerciseCreatorMachine = setup({
  types: {
    context: {} as ExerciseCreatorContext,
    events: {} as ExerciseCreatorEvent,
  },
  actions: {
    updateName: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_NAME') return context.draft;
        return { ...context.draft, name: event.value };
      },
      hasUnsavedChanges: true,
    }),
    updateDescription: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_DESCRIPTION') return context.draft;
        return { ...context.draft, description: event.value };
      },
      hasUnsavedChanges: true,
    }),
    updateInhale: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_INHALE') return context.draft;
        return {
          ...context.draft,
          breathingPattern: {
            ...context.draft.breathingPattern,
            inhale_seconds: event.value,
          },
        };
      },
      hasUnsavedChanges: true,
    }),
    updateHoldInhale: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_HOLD_INHALE') return context.draft;
        return {
          ...context.draft,
          breathingPattern: {
            ...context.draft.breathingPattern,
            hold_after_inhale_seconds: event.value,
          },
        };
      },
      hasUnsavedChanges: true,
    }),
    updateExhale: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_EXHALE') return context.draft;
        return {
          ...context.draft,
          breathingPattern: {
            ...context.draft.breathingPattern,
            exhale_seconds: event.value,
          },
        };
      },
      hasUnsavedChanges: true,
    }),
    updateHoldExhale: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_HOLD_EXHALE') return context.draft;
        return {
          ...context.draft,
          breathingPattern: {
            ...context.draft.breathingPattern,
            hold_after_exhale_seconds: event.value,
          },
        };
      },
      hasUnsavedChanges: true,
    }),
    updateRepetitions: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_REPETITIONS') return context.draft;
        return { ...context.draft, repetitions: event.value };
      },
      hasUnsavedChanges: true,
    }),
    updateColor: assign({
      draft: ({ context, event }) => {
        if (event.type !== 'UPDATE_COLOR') return context.draft;
        trackEvent(ANALYTICS_EVENTS.COLOR_SELECTED, { color: event.value });
        return { ...context.draft, card_color: event.value };
      },
      hasUnsavedChanges: true,
    }),
    toggleMode: assign({
      draft: ({ context }) => {
        const newMode = context.draft.mode === 'simple' ? 'complex' : 'simple';
        trackEvent(ANALYTICS_EVENTS.MODE_TOGGLED, { mode: newMode });
        return { ...context.draft, mode: newMode };
      },
    }),
    setErrors: assign({
      errors: (_, params: { errors: ExerciseCreatorContext['errors'] }) => params.errors,
    }),
    setNameDuplicate: assign({
      isNameDuplicate: (_, params: { isDuplicate: boolean }) => params.isDuplicate,
    }),
    setSaveError: assign({
      saveError: (_, params: { error: string }) => params.error,
    }),
    clearSaveError: assign({ saveError: undefined }),
    resetDraft: assign({
      draft: DEFAULT_DRAFT_EXERCISE as DraftExercise,
      errors: {},
      isNameDuplicate: false,
      hasUnsavedChanges: false,
      saveError: undefined,
    }),
  },
}).createMachine({
  id: 'exerciseCreator',
  initial: 'idle',
  context: {
    draft: DEFAULT_DRAFT_EXERCISE as DraftExercise,
    errors: {},
    isNameDuplicate: false,
    hasUnsavedChanges: false,
  },
  states: {
    idle: {
      on: {
        UPDATE_NAME: { actions: 'updateName', target: 'editing' },
        UPDATE_DESCRIPTION: { actions: 'updateDescription', target: 'editing' },
        UPDATE_INHALE: { actions: 'updateInhale', target: 'editing' },
        UPDATE_HOLD_INHALE: { actions: 'updateHoldInhale', target: 'editing' },
        UPDATE_EXHALE: { actions: 'updateExhale', target: 'editing' },
        UPDATE_HOLD_EXHALE: { actions: 'updateHoldExhale', target: 'editing' },
        UPDATE_REPETITIONS: { actions: 'updateRepetitions', target: 'editing' },
        UPDATE_COLOR: { actions: 'updateColor', target: 'editing' },
        TOGGLE_MODE: { actions: 'toggleMode' },
      },
    },
    editing: {
      on: {
        UPDATE_NAME: { actions: 'updateName' },
        UPDATE_DESCRIPTION: { actions: 'updateDescription' },
        UPDATE_INHALE: { actions: 'updateInhale' },
        UPDATE_HOLD_INHALE: { actions: 'updateHoldInhale' },
        UPDATE_EXHALE: { actions: 'updateExhale' },
        UPDATE_HOLD_EXHALE: { actions: 'updateHoldExhale' },
        UPDATE_REPETITIONS: { actions: 'updateRepetitions' },
        UPDATE_COLOR: { actions: 'updateColor' },
        TOGGLE_MODE: { actions: 'toggleMode' },
        VALIDATE: { target: 'validating' },
        SAVE: { target: 'validating' },
        CANCEL: { target: 'confirmingDiscard' },
      },
    },
    validating: {
      // Validation happens externally via useBreathingValidation
      on: {
        SAVE: { target: 'saving' },
        CANCEL: { target: 'confirmingDiscard' },
      },
    },
    saving: {
      on: {
        RETRY_SAVE: { target: 'saving' },
        CANCEL: { target: 'editing' },
      },
    },
    confirmingDiscard: {
      on: {
        CONFIRM_DISCARD: { actions: 'resetDraft', target: 'idle' },
        CANCEL_DISCARD: { target: 'editing' },
      },
    },
  },
});

/**
 * Main hook for Exercise Creator
 * Manages state, validation, and persistence
 * 
 * @param onSaveSuccess - Callback when exercise is saved
 * @param mode - 'create' or 'edit'
 * @param exerciseId - Exercise ID for edit mode
 * @param isOpen - Modal open state (for cleanup)
 */
export function useExerciseCreator(
  onSaveSuccess: (exercise: any) => void,
  mode: 'create' | 'edit' = 'create',
  exerciseId?: string,
  isOpen: boolean = true
) {
  const [state, send] = useMachine(exerciseCreatorMachine);
  const { validateExercise } = useBreathingValidation();
  const { calculateTotalDuration } = useDurationCalculator();
  const { mutateAsync: createExercise, isPending: isCreating } = useCreateExercise();
  const { mutateAsync: updateExercise, isPending: isUpdating } = useUpdateExercise();

  // Load existing exercise for edit mode
  const { data: existingExercise, isLoading } = useExercise(mode === 'edit' ? exerciseId || null : null);
  
  const isSaving = isCreating || isUpdating;
  
  // Track if pre-fill has been completed (to avoid re-running)
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Pre-fill draft when loading existing exercise (edit mode)
  useEffect(() => {
    if (mode === 'edit' && existingExercise && !hasPrefilled && !isLoading) {
      const pattern = existingExercise.breathing_pattern.phases[0]?.pattern;
      
      if (!pattern) return;
      
      // Pre-fill all fields from existing exercise
      send({ type: 'UPDATE_NAME', value: existingExercise.name });
      if (existingExercise.description) {
        send({ type: 'UPDATE_DESCRIPTION', value: existingExercise.description });
      }
      send({ type: 'UPDATE_INHALE', value: pattern.inhale_seconds });
      send({ type: 'UPDATE_HOLD_INHALE', value: pattern.hold_after_inhale_seconds });
      send({ type: 'UPDATE_EXHALE', value: pattern.exhale_seconds });
      send({ type: 'UPDATE_HOLD_EXHALE', value: pattern.hold_after_exhale_seconds });
      send({ type: 'UPDATE_REPETITIONS', value: existingExercise.breathing_pattern.phases[0].cycles_count });
      if (existingExercise.card_color) {
        send({ type: 'UPDATE_COLOR', value: existingExercise.card_color });
      }
      
      setHasPrefilled(true);
      
      // Reset hasUnsavedChanges after pre-fill (with timeout to ensure all updates processed)
      setTimeout(() => {
        send({ type: 'CONFIRM_DISCARD' });
      }, 0);
    }
  }, [mode, existingExercise, hasPrefilled, isLoading, send]);
  
  // Reset prefill flag when exerciseId changes
  useEffect(() => {
    setHasPrefilled(false);
  }, [exerciseId]);
  
  // Reset prefill flag when modal closes (ensures clean state on next open)
  useEffect(() => {
    if (!isOpen) {
      setHasPrefilled(false);
    }
  }, [isOpen]);
  
  // Cleanup on unmount (defense in depth)
  useEffect(() => {
    return () => {
      send({ type: 'CONFIRM_DISCARD' });
      setHasPrefilled(false);
    };
  }, [send]);

  // Check for duplicate name (debounced via staleTime in useExerciseNameExists)
  // In edit mode, exclude current exercise from duplicate check
  const { data: isDuplicate = false } = useExerciseNameExists(
    state.context.draft.name,
    mode === 'edit' ? exerciseId : undefined
  );

  // Validation errors (computed)
  const errors = validateExercise(state.context.draft, isDuplicate);
  const isValid = Object.keys(errors).length === 0;

  // Duration preview
  const totalDuration = calculateTotalDuration(
    state.context.draft.breathingPattern,
    state.context.draft.repetitions
  );

  // Update handlers
  const updateName = useCallback((value: string) => send({ type: 'UPDATE_NAME', value }), [send]);
  const updateDescription = useCallback(
    (value: string) => send({ type: 'UPDATE_DESCRIPTION', value }),
    [send]
  );
  const updateInhale = useCallback(
    (value: number) => send({ type: 'UPDATE_INHALE', value }),
    [send]
  );
  const updateHoldInhale = useCallback(
    (value: number) => send({ type: 'UPDATE_HOLD_INHALE', value }),
    [send]
  );
  const updateExhale = useCallback(
    (value: number) => send({ type: 'UPDATE_EXHALE', value }),
    [send]
  );
  const updateHoldExhale = useCallback(
    (value: number) => send({ type: 'UPDATE_HOLD_EXHALE', value }),
    [send]
  );
  const updateRepetitions = useCallback(
    (value: number) => send({ type: 'UPDATE_REPETITIONS', value }),
    [send]
  );
  const updateColor = useCallback(
    (value: string) => send({ type: 'UPDATE_COLOR', value }),
    [send]
  );
  const toggleMode = useCallback(() => send({ type: 'TOGGLE_MODE' }), [send]);

  // Save exercise
  const save = useCallback(async () => {
    if (!isValid) {
      send({ type: 'VALIDATE' });
      return;
    }

    send({ type: 'SAVE' });

    try {
      // Build BreathingPattern object for API
      const pattern = state.context.draft.breathingPattern;
      const cycleSeconds =
        pattern.inhale_seconds +
        pattern.hold_after_inhale_seconds +
        pattern.exhale_seconds +
        pattern.hold_after_exhale_seconds;
      const totalSeconds = cycleSeconds * state.context.draft.repetitions;

      const breathingPattern: any = {
        version: '1.0',
        type: 'simple',
        phases: [
          {
            order: 1,
            type: 'breathing',
            name: 'Dýchání',
            description: state.context.draft.name,
            pattern: {
              inhale_seconds: pattern.inhale_seconds,
              hold_after_inhale_seconds: pattern.hold_after_inhale_seconds,
              exhale_seconds: pattern.exhale_seconds,
              hold_after_exhale_seconds: pattern.hold_after_exhale_seconds,
            },
            duration_seconds: totalSeconds,
            cycles_count: state.context.draft.repetitions,
          },
        ],
        metadata: {
          total_duration_seconds: totalSeconds,
          phase_count: 1,
          difficulty: 'beginner' as const,
          tags: [],
        },
      };

      const payload = {
        name: state.context.draft.name,
        description: state.context.draft.description,
        breathing_pattern: breathingPattern,
        tags: [],
        card_color: state.context.draft.card_color,
      };

      // Create or update based on mode
      const exercise = mode === 'edit' && exerciseId
        ? await updateExercise({ exerciseId, updates: payload })
        : await createExercise(payload);

      trackEvent(
        mode === 'edit' ? ANALYTICS_EVENTS.EXERCISE_SAVED : ANALYTICS_EVENTS.EXERCISE_SAVED,
        {
          name: exercise.name,
          color: state.context.draft.card_color,
          totalDuration,
          mode,
        }
      );

      onSaveSuccess(exercise);
      // Note: Modal will unmount and cleanup will reset machine state
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nepodařilo se uložit cvičení';
      trackEvent(ANALYTICS_EVENTS.SAVE_ERROR, { error: errorMessage, mode });
      // TODO: Show error in UI (Phase 4)
    }
  }, [isValid, state.context.draft, mode, exerciseId, createExercise, updateExercise, onSaveSuccess, send, totalDuration]);

  // Cancel/Discard
  const cancel = useCallback(() => {
    if (state.context.hasUnsavedChanges) {
      send({ type: 'CANCEL' }); // Go to confirmingDiscard state
    } else {
      send({ type: 'CONFIRM_DISCARD' }); // Immediately reset
    }
  }, [state.context.hasUnsavedChanges, send]);

  const confirmDiscard = useCallback(() => send({ type: 'CONFIRM_DISCARD' }), [send]);
  const cancelDiscard = useCallback(() => send({ type: 'CANCEL_DISCARD' }), [send]);

  return {
    // State
    draft: state.context.draft,
    errors,
    isValid,
    isSaving,
    isLoading,
    hasUnsavedChanges: state.context.hasUnsavedChanges,
    isConfirmingDiscard: state.matches('confirmingDiscard'),
    totalDuration,

    // Actions
    updateName,
    updateDescription,
    updateInhale,
    updateHoldInhale,
    updateExhale,
    updateHoldExhale,
    updateRepetitions,
    updateColor,
    toggleMode,
    save,
    cancel,
    confirmDiscard,
    cancelDiscard,
  };
}
