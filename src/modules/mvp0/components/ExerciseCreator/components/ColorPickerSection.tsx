/**
 * ColorPickerSection - 8 Preset Color Selection
 * @module ExerciseCreator/Components
 * @description Section for selecting card color from 8 presets (mapped to 4 temperaments)
 */

import { COLOR_PRESETS } from '../config';

interface ColorPickerSectionProps {
  selectedColor: string; // Hex code
  onColorChange: (hex: string) => void;
  disabled?: boolean;
}

export function ColorPickerSection({
  selectedColor,
  onColorChange,
  disabled = false,
}: ColorPickerSectionProps) {
  return (
    <section className="exercise-creator__section">
      <h3 className="exercise-creator__section-title">Barva cvičení</h3>

      <div className="color-picker">
        <div className="color-picker__grid">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = preset.hex === selectedColor;
            
            return (
              <button
                key={preset.id}
                type="button"
                className={`color-picker__option ${isSelected ? 'color-picker__option--selected' : ''}`}
                style={{
                  backgroundColor: preset.hex,
                }}
                onClick={() => onColorChange(preset.hex)}
                disabled={disabled}
                aria-label={`${preset.name} (${preset.temperament})`}
                aria-pressed={isSelected}
              >
                {/* Checkmark for selected */}
                {isSelected && (
                  <svg
                    className="color-picker__checkmark"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
