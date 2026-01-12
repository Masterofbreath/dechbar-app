/**
 * Input Component - Premium Wellness Design
 * 
 * Modern floating label input with gold focus glow
 * Design inspired by: Calm, Headspace, Balance apps + WordPress zdravedychej-public
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { InputHTMLAttributes, useState, ChangeEvent } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onFocus'> {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  onFocus,
  error,
  helperText,
  fullWidth = true,
  className = '',
  disabled,
  required,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  // Floating label should be active when focused OR has value
  const isLabelActive = isFocused || value.length > 0;
  
  // Handle focus: internal state + custom handler
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };
  
  return (
    <div className={`input-container ${fullWidth ? 'w-full' : ''}`}>
      {/* Floating Label */}
      <label 
        className={`
          input-label 
          ${isLabelActive ? 'input-label--active' : ''} 
          ${error ? 'input-label--error' : ''}
        `}
      >
        {label}
        {required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      
      {/* Input Wrapper */}
      <div 
        className={`
          input-wrapper 
          ${isFocused ? 'input-wrapper--focused' : ''} 
          ${error ? 'input-wrapper--error' : ''}
        `}
      >
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          className={`input-field ${isPassword ? 'input-field--has-icon' : ''} ${className}`}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        
        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="input-icon-btn"
            tabIndex={-1}
            aria-label={showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
          >
            {showPassword ? (
              // Eye closed icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              // Eye open icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Helper Text or Error Message */}
      {error ? (
        <p 
          className="input-message input-message--error" 
          id={`${props.id}-error`}
          role="alert"
        >
          {error}
        </p>
      ) : helperText ? (
        <p 
          className="input-message"
          id={`${props.id}-helper`}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
