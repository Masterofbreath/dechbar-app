/**
 * ExerciseCreatorModal - Main Exercise Creator Container
 * @module ExerciseCreator
 * @description Fullscreen modal for creating custom breathing exercises
 * 
 * Features:
 * - XState-powered state management
 * - 6 modular sections (BasicInfo, Pattern, Duration, Color, Mode)
 * - Tier-based access control
 * - Real-time validation
 * - Unsaved changes protection
 */

import { useEffect, useState, useRef } from 'react';
import { useScrollLock } from '@/platform/hooks';
import { CloseButton } from '@/components/shared';
import { useExerciseCreator } from './hooks/useExerciseCreator';
import { useDurationCalculator } from './hooks/useDurationCalculator';
import type { ExerciseCreatorModalProps } from './types';
import './ExerciseCreator.css';
import './ExerciseCreator-mobile.css';

// Import all sub-components
import { BasicInfoSection } from './components/BasicInfoSection';
import { BreathingPatternSection } from './components/BreathingPatternSection';
import { DurationSection } from './components/DurationSection';
import { ColorPickerSection } from './components/ColorPickerSection';
import { ModeToggleButton } from './components/ModeToggleButton';

export function ExerciseCreatorModal({ 
  isOpen, 
  onClose, 
  onSaveSuccess,
  mode = 'create',
  exerciseId,
}: ExerciseCreatorModalProps) {
  useScrollLock(isOpen);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const wasConfirmingDiscardRef = useRef(false);

  // Main state machine
  const {
    draft,
    errors,
    isValid,
    isSaving,
    isLoading,
    hasUnsavedChanges,
    isConfirmingDiscard,
    totalDuration,
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
  } = useExerciseCreator(onSaveSuccess, mode, exerciseId, isOpen);

  // Reset machine state when modal opens in CREATE mode only
  useEffect(() => {
    if (isOpen && mode === 'create') {
      // Clean state for create mode
      confirmDiscard();
    }
  }, [isOpen, mode, confirmDiscard]);

  // Listen for successful discard confirmation and close modal
  useEffect(() => {
    // Track when we enter confirmingDiscard state
    if (isConfirmingDiscard) {
      wasConfirmingDiscardRef.current = true;
    } 
    // When we leave confirmingDiscard state and changes were discarded, close modal
    else if (wasConfirmingDiscardRef.current && !isConfirmingDiscard && !hasUnsavedChanges) {
      wasConfirmingDiscardRef.current = false;
      onClose();
    }
  }, [isConfirmingDiscard, hasUnsavedChanges, onClose]);

  // Duration calculator
  const { calculateCycleDuration, formatDuration } = useDurationCalculator();
  const cycleDuration = calculateCycleDuration(draft.breathingPattern);

  // Close handler with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      cancel(); // Trigger confirmation dialog
    } else {
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, hasUnsavedChanges]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="exercise-creator" onClick={(e) => e.stopPropagation()}>
        {/* TopBar with title, mode toggle, and close button */}
        <div className="exercise-creator__header">
          <h2 className="exercise-creator__title">
            {mode === 'edit' ? 'Upravit cvičení' : 'Vytvořit cvičení'}
          </h2>
          
          <ModeToggleButton 
            mode={draft.mode} 
            onToggle={toggleMode} 
            disabled={isSaving} 
          />
          
          <CloseButton onClick={handleClose} />
        </div>
        
        <div className="exercise-creator__content">
        {/* 1. CORE: Name only */}
        <section className="exercise-creator__section">
          <div className="form-field">
            <label htmlFor="exercise-name" className="form-field__label">
              Název cvičení *
            </label>
            <input
              id="exercise-name"
              type="text"
              className={`form-field__input ${errors.name ? 'form-field__input--error' : ''}`}
              value={draft.name}
              onChange={(e) => updateName(e.target.value)}
              onBlur={() => {/* Mark as touched */}}
              placeholder="Např. Ranní dech"
              disabled={isSaving}
              maxLength={60}
              aria-invalid={!!errors.name}
              autoComplete="off"
            />
            {errors.name && (
              <span className="form-field__error" role="alert">
                {errors.name}
              </span>
            )}
            {draft.name.length > 48 && (
              <span className="form-field__hint">
                {draft.name.length}/60 znaků
              </span>
            )}
          </div>
        </section>

        {/* 2. CORE: Breathing Pattern */}
        <BreathingPatternSection
          inhale={draft.breathingPattern.inhale_seconds}
          holdInhale={draft.breathingPattern.hold_after_inhale_seconds}
          exhale={draft.breathingPattern.exhale_seconds}
          holdExhale={draft.breathingPattern.hold_after_exhale_seconds}
          onInhaleChange={updateInhale}
          onHoldInhaleChange={updateHoldInhale}
          onExhaleChange={updateExhale}
          onHoldExhaleChange={updateHoldExhale}
          error={errors.breathingPattern}
          disabled={isSaving}
          isSimpleMode={draft.mode === 'simple'}
        />

        {/* 3. CORE: Duration */}
        <DurationSection
          repetitions={draft.repetitions}
          totalDuration={totalDuration}
          cycleDuration={cycleDuration}
          onRepetitionsChange={updateRepetitions}
          formatDuration={formatDuration}
          error={errors.totalDuration}
          disabled={isSaving}
        />

        {/* Visual separator between core and optional */}
        <div className="exercise-creator__separator" />

        {/* 4. OPTIONAL: Description (collapsible) */}
        <section className="exercise-creator__section exercise-creator__section--optional">
          <button
            type="button"
            className="optional-section__toggle"
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            disabled={isSaving}
          >
            <span>Popis (volitelné)</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isDescriptionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDescriptionExpanded && (
            <div className="optional-section__content">
              <textarea
                id="exercise-description"
                className="form-field__input form-field__input--textarea"
                value={draft.description}
                onChange={(e) => updateDescription(e.target.value)}
                placeholder="Pro co je toto cvičení dobré?"
                disabled={isSaving}
                maxLength={200}
                rows={3}
              />
              {draft.description.length > 160 && (
                <div className="form-field__counter">
                  {draft.description.length}/200
                </div>
              )}
            </div>
          )}
        </section>

        {/* 5. OPTIONAL: Color Picker */}
          <ColorPickerSection
            selectedColor={draft.card_color}
            onColorChange={updateColor}
            disabled={isSaving}
          />
        </div>

        {/* Footer with save button */}
        <div className="exercise-creator__actions">
          <button
            type="button"
            className="button button--primary button--lg button--full-width"
            onClick={save}
            disabled={!isValid || isSaving || isLoading}
          >
            {isSaving ? 'Ukládám...' : isLoading ? 'Načítám...' : 'Uložit'}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {isConfirmingDiscard && (
        <div className="exercise-creator__overlay" onClick={cancelDiscard}>
          <div 
            className="exercise-creator__dialog" 
            role="alertdialog" 
            aria-labelledby="discard-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="discard-title">Zahodit změny?</h3>
            <p>Máš neuložené změny. Opravdu chceš odejít?</p>
            <div className="exercise-creator__dialog-actions">
              <button type="button" onClick={cancelDiscard} className="button button--secondary">
                Zrušit
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="button button--destructive"
              >
                Zahodit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
