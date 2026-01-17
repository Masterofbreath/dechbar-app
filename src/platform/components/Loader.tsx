/**
 * Loader Component
 * 
 * Global loading indicator with DechBar icon breathing pattern.
 * Unique brand storytelling: "Icon breathes like you during exercises"
 * 
 * Uses PNG Favicon (512x512) for perfect brand consistency:
 * - Exact match to app icon (circular, 2 water drops)
 * - Professional design asset
 * - Perfect circular shape for breathing animation
 * 
 * Features:
 * - Breathing animation (2s inhale/exhale cycle)
 * - Random breathing facts (educational, inspiring)
 * - Custom messages support
 * - Scalable sizes
 * 
 * Variants:
 * - logo-pulse (DEFAULT): Icon breathes (2s inhale/exhale cycle)
 * - spinner: Generic spinner (fallback)
 * 
 * ⏱️ USAGE GUIDELINES - Breathing Facts:
 * 
 * ✅ USE showBreathingFact FOR:
 * - Exercise loading (3-5s) - user has time to read (15-20 words)
 * - Long data fetches (user analytics, progress reports)
 * - Initial module loading (first visit to new feature)
 * 
 * ❌ DON'T USE showBreathingFact FOR:
 * - Login/Register (too fast, 300-400ms - facts unreadable!)
 * - Quick actions (save, delete, update - instant feedback better)
 * - Route protection checks (auth guard - show simple message)
 * 
 * 💡 RULE: If loading < 2s → use simple message, not fact!
 * Facts need 3-5s reading time for educational value.
 * 
 * @example
 * // Login/Register (FAST - no fact)
 * <Loader message="Dýchej s námi..." />
 * 
 * // Exercise loading (SLOW - with fact)
 * <Loader showBreathingFact message="Připravujeme cvičení..." />
 * 
 * // Route protection (FAST - simple message)
 * <Loader message="Dýchej s námi..." />
 * 
 * // App initialization (MEDIUM - simple message)
 * <Loader message="Dýchej s námi..." />
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.2.0
 */

import { useMemo } from 'react';
import { MESSAGES } from '@/config/messages';

export interface LoaderProps {
  /**
   * Loading indicator variant
   * - logo-pulse: DechBar logo with breathing animation (brand identity)
   * - spinner: Generic spinner (fallback for non-brand contexts)
   */
  variant?: 'logo-pulse' | 'spinner';
  
  /**
   * Size of loader
   * - sm: 32px (inline loading)
   * - md: 64px (default)
   * - lg: 96px (full screen emphasis)
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Optional custom message below loader
   * If provided, overrides showBreathingFact
   */
  message?: string;
  
  /**
   * Show random breathing fact (educational tip)
   * Ignored if message is provided
   * @default false
   */
  showBreathingFact?: boolean;
  
  /**
   * Whether to render as fullscreen overlay
   * Default: true
   */
  fullScreen?: boolean;
}

export function Loader({ 
  variant = 'logo-pulse', 
  size = 'md',
  message,
  showBreathingFact = false,
  fullScreen = true
}: LoaderProps) {
  
  // Random breathing fact (memoized per component mount)
  const breathingFact = useMemo(() => {
    if (!showBreathingFact || message) return null;
    const facts = MESSAGES.breathingFacts;
    return facts[Math.floor(Math.random() * facts.length)];
  }, [showBreathingFact, message]);
  
  const displayMessage = message || breathingFact;
  
  const sizeClasses = {
    sm: 'loader--sm',
    md: 'loader--md',
    lg: 'loader--lg',
  };
  
  const containerClasses = [
    'loader-container',
    fullScreen && 'loader-container--fullscreen',
    sizeClasses[size]
  ].filter(Boolean).join(' ');
  
  // Logo Pulse variant (brand identity)
  if (variant === 'logo-pulse') {
    const iconSize = size === 'sm' ? 48 : size === 'lg' ? 96 : 64;
    
    return (
      <div className={containerClasses}>
        <div className="logo-pulse-wrapper">
          <img 
            src="/android-chrome-512x512.png"
            alt="DechBar"
            width={iconSize}
            height={iconSize}
            className="loader-icon-image"
          />
        </div>
        {displayMessage && (
          <p className="loader-message">{displayMessage}</p>
        )}
      </div>
    );
  }
  
  // Generic spinner fallback
  return (
    <div className={containerClasses}>
      <div className="loader-spinner">
        <svg viewBox="0 0 24 24" fill="none">
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
      </div>
      {displayMessage && (
        <p className="loader-message">{displayMessage}</p>
      )}
    </div>
  );
}
