/**
 * Checkbox Component - Premium Wellness Design
 * 
 * Reusable checkbox with custom styling
 * Design: Soft-square (6px border-radius), gold theme
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
}

export function Checkbox({
  label,
  size = 'md',
  checked,
  disabled,
  className = '',
  id,
  error,
  ...props
}: CheckboxProps) {
  const containerId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'checkbox-container',
    size !== 'md' && `checkbox-container--${size}`,
    error && 'checkbox-container--error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div>
      <label htmlFor={containerId} className={containerClasses}>
        <input
          type="checkbox"
          id={containerId}
          className="checkbox-input"
          checked={checked}
          disabled={disabled}
          {...props}
        />
        
        <div className="checkbox-box">
          {/* Checkmark SVG icon */}
          <svg 
            className="checkbox-checkmark" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <span className="checkbox-label">
          {label}
        </span>
      </label>
      
      {error && (
        <div className="checkbox-error-message">
          {error}
        </div>
      )}
    </div>
  );
}
