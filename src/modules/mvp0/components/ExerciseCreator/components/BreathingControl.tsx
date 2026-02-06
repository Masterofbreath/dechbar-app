/**
 * BreathingControl - Hybrid Stepper for Breathing Phase Duration
 * @module ExerciseCreator/Components
 * @description Reusable control for adjusting breathing phase seconds (0-60s)
 * 
 * UX Design:
 * - Buttons (-/+) for precise control → Cholerik, Melancholik
 * - Touch drag up/down for fast control → Sangvinik, Flegmatik
 * - Haptic feedback on change
 * - Shows value in center (large, readable)
 */

import { useState, useRef, useCallback } from 'react';
import { EXERCISE_CREATOR_LIMITS } from '../config';

interface BreathingControlProps {
  value: number; // 0-60
  onChange: (value: number) => void;
  label: string; // "Nádech", "Zadržení", "Výdech"
  disabled?: boolean;
}

export function BreathingControl({ value, onChange, label, disabled = false }: BreathingControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  const increment = useCallback(() => {
    if (disabled) return;
    const newValue = Math.min(value + EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_STEP, EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MAX);
    if (newValue !== value) {
      onChange(newValue);
      // TODO: Trigger haptic feedback (Phase 4)
    }
  }, [value, onChange, disabled]);

  const decrement = useCallback(() => {
    if (disabled) return;
    const newValue = Math.max(value - EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_STEP, EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MIN);
    if (newValue !== value) {
      onChange(newValue);
      // TODO: Trigger haptic feedback (Phase 4)
    }
  }, [value, onChange, disabled]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  }, [disabled, value]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    // Prevent content scrolling during value adjustment
    e.preventDefault();
    
    const deltaY = startY.current - e.touches[0].clientY; // Inverted: drag up = increase
    const steps = Math.round(deltaY / 20); // 20px = 1 step
    const newValue = Math.max(
      EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MIN,
      Math.min(startValue.current + steps, EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MAX)
    );
    
    if (newValue !== value) {
      onChange(newValue);
      // TODO: Trigger haptic feedback (Phase 4)
    }
  }, [isDragging, disabled, value, onChange]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="breathing-control">
      <label className="breathing-control__label">{label}</label>
      
      <div className="breathing-control__stepper breathing-control__stepper--vertical">
        {/* Increment button - TOP */}
        <button
          type="button"
          className="breathing-control__button breathing-control__button--increment"
          onClick={increment}
          disabled={disabled || value >= EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MAX}
          aria-label={`Zvýšit ${label}`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <polyline points="18 15 12 9 6 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Value display - MIDDLE */}
        <div
          className={`breathing-control__value ${isDragging ? 'breathing-control__value--dragging' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MIN}
          aria-valuemax={EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MAX}
          aria-label={`${label}: ${value} sekund`}
        >
          <span className="breathing-control__number">{value.toFixed(1)}</span>
          <span className="breathing-control__unit">s</span>
        </div>

        {/* Decrement button - BOTTOM */}
        <button
          type="button"
          className="breathing-control__button breathing-control__button--decrement"
          onClick={decrement}
          disabled={disabled || value <= EXERCISE_CREATOR_LIMITS.BREATHING_VALUE_MIN}
          aria-label={`Snížit ${label}`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
