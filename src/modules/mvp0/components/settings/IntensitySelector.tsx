/**
 * IntensitySelector - Haptic Intensity Radio Group
 * 
 * Radio button group for selecting haptic feedback intensity.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React from 'react';
import type { HapticIntensity } from '../../types/audio';

export interface IntensitySelectorProps {
  value: HapticIntensity;
  onChange: (intensity: HapticIntensity) => void;
  disabled?: boolean;
}

const INTENSITY_OPTIONS: { value: HapticIntensity; label: string }[] = [
  { value: 'off', label: 'Vypnuto' },
  { value: 'light', label: 'Lehká' },
  { value: 'medium', label: 'Střední' },
  { value: 'heavy', label: 'Silná' },
];

/**
 * IntensitySelector - Haptic intensity radio group
 */
export const IntensitySelector: React.FC<IntensitySelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="intensity-selector">
      <label className="intensity-selector__label">Intenzita</label>
      <div className="intensity-selector__options">
        {INTENSITY_OPTIONS.map((option) => (
          <label key={option.value} className="intensity-selector__option">
            <input
              type="radio"
              name="haptic-intensity"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};
