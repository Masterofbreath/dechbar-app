/**
 * Toggle - iOS-style Toggle Switch
 * 
 * Simple ON/OFF toggle switch with gold accent color.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React from 'react';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Toggle - iOS-style switch
 */
export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className="settings-toggle">
      <span className="settings-toggle__label">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="settings-toggle__input"
      />
    </label>
  );
};
