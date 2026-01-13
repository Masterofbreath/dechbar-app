/**
 * Button Component - Premium Wellness Design
 * 
 * Modern button with variants for different use cases
 * Design inspired by: WordPress zdravedychej-public + Calm/Headspace apps
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    loading && 'button--loading',
    fullWidth && 'button--full-width',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className="button-spinner" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              opacity="0.25"
            />
            <path 
              fill="currentColor" 
              opacity="0.75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Načítám...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
