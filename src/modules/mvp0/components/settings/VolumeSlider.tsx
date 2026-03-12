/**
 * VolumeSlider - Audio Volume Slider
 * 
 * Range slider for controlling audio volume (0-100%).
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React from 'react';

export interface VolumeSliderProps {
  label: string;
  value: number; // 0-1
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Max value (0-1), defaults to 1. Used e.g. for Trůn to cap at 0.5. */
  max?: number;
}

/**
 * VolumeSlider - Audio volume control
 */
export const VolumeSlider: React.FC<VolumeSliderProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  max = 1,
}) => {
  const maxPercent = Math.round(max * 100);
  const percentage = Math.round(value * 100);
  
  return (
    <div className="volume-slider">
      <label className="volume-slider__label">
        {label}
        <span className="volume-slider__value">{percentage}%</span>
      </label>
      <input
        type="range"
        min="0"
        max={maxPercent}
        value={percentage}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        disabled={disabled}
        className="volume-slider__input"
      />
    </div>
  );
};
