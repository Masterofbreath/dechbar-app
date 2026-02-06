/**
 * BreathingPatternSection - 4-Phase Breathing Pattern Editor
 * @module ExerciseCreator/Components
 * @description Section for configuring 4-phase breathing pattern (inhale, hold, exhale, hold)
 */

import { BreathingControl } from './BreathingControl';

interface BreathingPatternSectionProps {
  inhale: number;
  holdInhale: number;
  exhale: number;
  holdExhale: number;
  onInhaleChange: (value: number) => void;
  onHoldInhaleChange: (value: number) => void;
  onExhaleChange: (value: number) => void;
  onHoldExhaleChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
  isSimpleMode?: boolean; // Hide holds in simple mode
}

export function BreathingPatternSection({
  inhale,
  holdInhale,
  exhale,
  holdExhale,
  onInhaleChange,
  onHoldInhaleChange,
  onExhaleChange,
  onHoldExhaleChange,
  error,
  disabled = false,
  isSimpleMode = false,
}: BreathingPatternSectionProps) {
  return (
    <section className="exercise-creator__section">
      <h3 className="exercise-creator__section-title">Dechový vzorec</h3>
      
      <div className="breathing-pattern-grid">
        {/* Inhale */}
        <BreathingControl
          label="Nádech"
          value={inhale}
          onChange={onInhaleChange}
          disabled={disabled}
        />

        {/* Hold after inhale */}
        <BreathingControl
          label="Zádrž"
          value={holdInhale}
          onChange={onHoldInhaleChange}
          disabled={disabled}
        />

        {/* Exhale */}
        <BreathingControl
          label="Výdech"
          value={exhale}
          onChange={onExhaleChange}
          disabled={disabled}
        />

        {/* Hold after exhale */}
        <BreathingControl
          label="Zádrž"
          value={holdExhale}
          onChange={onHoldExhaleChange}
          disabled={disabled}
        />
      </div>

      {error && (
        <div className="form-field__error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
