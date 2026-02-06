/**
 * BasicInfoSection - Name & Description Inputs
 * @module ExerciseCreator/Components
 * @description First section of Exercise Creator - basic exercise info
 */

import { useState } from 'react';

interface BasicInfoSectionProps {
  name: string;
  description: string;
  nameError?: string;
  descriptionError?: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  disabled?: boolean;
}

export function BasicInfoSection({
  name,
  description,
  nameError,
  descriptionError,
  onNameChange,
  onDescriptionChange,
  disabled = false,
}: BasicInfoSectionProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const NAME_MAX = 60;
  const DESC_MAX = 200;
  const showNameHint = name.length > NAME_MAX * 0.8;
  const showDescHint = description.length > DESC_MAX * 0.8;

  return (
    <section className="exercise-creator__section">
      {/* Name input */}
      <div className="form-field">
        <label htmlFor="exercise-name" className="form-field__label">
          Název cvičení *
        </label>
        <input
          id="exercise-name"
          type="text"
          className={`form-field__input ${nameError ? 'form-field__input--error' : ''}`}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={() => setNameTouched(true)}
          placeholder="Např. Ranní dech"
          disabled={disabled}
          maxLength={NAME_MAX}
          aria-invalid={!!nameError}
          aria-describedby={nameError ? 'exercise-name-error' : undefined}
          autoComplete="off"
        />
        {nameTouched && nameError && (
          <span id="exercise-name-error" className="form-field__error" role="alert">
            {nameError}
          </span>
        )}
        {showNameHint && (
          <span className="form-field__hint">
            {name.length}/{NAME_MAX} znaků
          </span>
        )}
      </div>

      {/* Description input (collapsible) */}
      <div className="form-field">
        <button
          type="button"
          className="form-field__toggle"
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          disabled={disabled}
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
          <textarea
            id="exercise-description"
            className={`form-field__input form-field__input--textarea form-field__input--collapsible ${descriptionError ? 'form-field__input--error' : ''}`}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Pro co je toto cvičení dobré?"
            disabled={disabled}
            maxLength={DESC_MAX}
            rows={3}
            aria-invalid={!!descriptionError}
            aria-describedby={descriptionError ? 'exercise-description-error' : undefined}
          />
        )}

        {descriptionError && (
          <span id="exercise-description-error" className="form-field__error" role="alert">
            {descriptionError}
          </span>
        )}

        {showDescHint && description.length > 0 && (
          <div className="form-field__counter">
            {description.length}/{DESC_MAX}
          </div>
        )}
      </div>
    </section>
  );
}
