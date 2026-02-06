/**
 * PlayPauseButton - Gold CTA button for audio playback
 * 
 * Apple Premium Style:
 * - Gold (#D6A23A) with glow shadow
 * - Size: 48px desktop, 44px mobile (WCAG AA)
 * - States: playing (pause), paused (play), loading (spinner)
 * - Animation: scale(0.95) on active
 * 
 * @version 2.43.0
 */

import React from 'react';

interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  isPlaying,
  isLoading = false,
  onClick,
  size = 'lg',
  variant = 'primary',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10', // 40px
    md: 'w-11 h-11', // 44px (WCAG AA minimum)
    lg: 'w-12 h-12', // 48px (desktop)
  };

  const variantClasses = {
    primary: 'bg-accent text-background shadow-gold hover:bg-accent-light active:scale-95',
    secondary: 'bg-surface text-text-primary border border-border hover:bg-surface-elevated',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        flex items-center justify-center
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
      `}
      aria-label={isPlaying ? 'Pozastavit' : 'Přehrát'}
    >
      {isLoading ? (
        // Loading spinner
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : isPlaying ? (
        // Pause icon (2 vertical bars)
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        // Play icon (triangle)
        <svg
          className="h-5 w-5 ml-0.5"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
};
