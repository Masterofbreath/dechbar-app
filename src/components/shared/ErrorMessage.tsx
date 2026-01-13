/**
 * ErrorMessage Component
 * 
 * Global standardized error/warning/info/success message component.
 * Used across forms, auth flows, and validation feedback.
 * 
 * Design: Brand Book 2.0 compliant - dark-first with semantic colors
 * 
 * @package DechBar_App
 * @subpackage Components/Shared
 */

interface ErrorMessageProps {
  /** Message text to display */
  message: string;
  /** Visual variant - determines color scheme */
  variant?: 'error' | 'warning' | 'info' | 'success';
  /** Additional CSS classes */
  className?: string;
  /** Show icon (default: true) */
  showIcon?: boolean;
}

export function ErrorMessage({ 
  message, 
  variant = 'error',
  className = '',
  showIcon = true
}: ErrorMessageProps) {
  // Icon SVGs for each variant
  const icons = {
    error: (
      <svg className="error-message__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    warning: (
      <svg className="error-message__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    info: (
      <svg className="error-message__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    success: (
      <svg className="error-message__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  };

  return (
    <div 
      className={`error-message ${variant !== 'error' ? `error-message--${variant}` : ''} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {showIcon && icons[variant]}
      <p className="error-message__text">
        {message}
      </p>
    </div>
  );
}
