/**
 * DurationSection - Repetitions Control with Duration Preview
 * @module ExerciseCreator/Components
 * @description Circular drag controller for repetitions (1-30) + total duration preview
 * 
 * UX Design:
 * - Circular progress ring visualization
 * - Drag around circle to adjust (like iOS Timer app)
 * - Shows repetitions + total duration
 * - Visual feedback for 4 temperaments
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { EXERCISE_CREATOR_LIMITS } from '../config';

interface DurationSectionProps {
  repetitions: number; // 1-30
  totalDuration: number; // in seconds
  cycleDuration: number; // in seconds
  onRepetitionsChange: (value: number) => void;
  formatDuration: (seconds: number) => string; // "MM:SS" formatter
  error?: string;
  disabled?: boolean;
}

export function DurationSection({
  repetitions,
  totalDuration,
  cycleDuration,
  onRepetitionsChange,
  formatDuration,
  error,
  disabled = false,
}: DurationSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);

  const calculateAngle = useCallback((clientX: number, clientY: number): number => {
    if (!circleRef.current) return 0;
    const rect = circleRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    return (angle * 180) / Math.PI + 90; // Convert to degrees (0° = top)
  }, []);

  const angleToValue = useCallback((angle: number): number => {
    const normalized = (angle + 360) % 360; // Normalize to 0-360
    const value = Math.round(
      EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN +
        (normalized / 360) * (EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX - EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN)
    );
    return Math.max(
      EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN,
      Math.min(value, EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX)
    );
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    const touch = e.touches[0];
    const angle = calculateAngle(touch.clientX, touch.clientY);
    const newValue = angleToValue(angle);
    if (newValue !== repetitions) {
      onRepetitionsChange(newValue);
    }
  }, [isDragging, disabled, calculateAngle, angleToValue, repetitions, onRepetitionsChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const increment = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(repetitions + 1, EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX);
    if (newValue !== repetitions) onRepetitionsChange(newValue);
  }, [repetitions, onRepetitionsChange, disabled]);

  const decrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(repetitions - 1, EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN);
    if (newValue !== repetitions) onRepetitionsChange(newValue);
  }, [repetitions, onRepetitionsChange, disabled]);

  // Calculate progress percentage
  const progressPercent =
    ((repetitions - EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN) /
      (EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX - EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN)) *
    100;

  return (
    <section className="exercise-creator__section">
      <h3 className="exercise-creator__section-title">Délka cvičení</h3>

      <div className="duration-control">
        {/* Circular drag controller */}
        <div
          ref={circleRef}
          className={`duration-control__circle ${isDragging ? 'duration-control__circle--dragging' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="slider"
          aria-valuenow={repetitions}
          aria-valuemin={EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN}
          aria-valuemax={EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX}
          aria-label="Počet opakování"
        >
          {/* Progress ring (SVG) */}
          <svg className="duration-control__ring" viewBox="0 0 120 120">
            <circle
              className="duration-control__ring-bg"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              opacity="0.2"
            />
            <circle
              className="duration-control__ring-progress"
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          </svg>

          {/* Center content */}
          <div className="duration-control__content">
            <div className="duration-control__value">{repetitions}×</div>
            <div className="duration-control__label">opakování</div>
            <div className="duration-control__total">{formatDuration(totalDuration)}</div>
          </div>
        </div>

        {/* Stepper buttons (fallback for accessibility) */}
        <div className="duration-control__buttons">
          <button
            type="button"
            className="duration-control__button"
            onClick={decrement}
            disabled={disabled || repetitions <= EXERCISE_CREATOR_LIMITS.REPETITIONS_MIN}
            aria-label="Snížit počet opakování"
          >
            −
          </button>
          <button
            type="button"
            className="duration-control__button"
            onClick={increment}
            disabled={disabled || repetitions >= EXERCISE_CREATOR_LIMITS.REPETITIONS_MAX}
            aria-label="Zvýšit počet opakování"
          >
            +
          </button>
        </div>
      </div>

      {error && (
        <div className="form-field__error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
