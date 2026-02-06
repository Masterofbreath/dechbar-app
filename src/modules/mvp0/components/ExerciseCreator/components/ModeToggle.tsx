/**
 * ModeToggle - Simple/Complex Mode Switch
 * @module ExerciseCreator/Components
 * @description iOS-style toggle for switching between Simple (inhale/exhale only) and Complex (4-phase) mode
 * 
 * Tier Logic:
 * - Free users: Simple mode only (Complex locked)
 * - SMART users: Both modes available
 */

import { useCallback } from 'react';
import { useMembership } from '@/platform/membership';

interface ModeToggleProps {
  mode: 'simple' | 'complex';
  onToggle: () => void;
  disabled?: boolean;
}

export function ModeToggle({ mode, onToggle, disabled = false }: ModeToggleProps) {
  const { plan } = useMembership();
  const isFree = plan === 'ZDARMA';
  const isComplexLocked = isFree && mode === 'simple';

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    // If trying to switch to complex mode and user is free, show paywall
    if (mode === 'simple' && isComplexLocked) {
      // TODO: Open TierLockModal in Phase 4
      console.log('[ModeToggle] Complex mode locked for free users');
      return;
    }
    
    onToggle();
  }, [disabled, mode, isComplexLocked, onToggle]);

  return (
    <section className="exercise-creator__section">
      <h3 className="exercise-creator__section-title">Režim</h3>

      <div className="mode-toggle">
        <div className="mode-toggle__container">
          {/* Simple mode button */}
          <button
            type="button"
            className={`mode-toggle__option ${mode === 'simple' ? 'mode-toggle__option--active' : ''}`}
            onClick={() => mode === 'complex' && onToggle()}
            disabled={disabled}
            aria-pressed={mode === 'simple'}
          >
            <div className="mode-toggle__label">Jednoduchý</div>
            <div className="mode-toggle__description">Nádech + Výdech</div>
          </button>

          {/* Complex mode button */}
          <button
            type="button"
            className={`mode-toggle__option ${mode === 'complex' ? 'mode-toggle__option--active' : ''} ${isComplexLocked ? 'mode-toggle__option--locked' : ''}`}
            onClick={handleClick}
            disabled={disabled}
            aria-pressed={mode === 'complex'}
          >
            <div className="mode-toggle__label">
              Pokročilý
              {isComplexLocked && (
                <svg
                  className="mode-toggle__lock-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              )}
            </div>
            <div className="mode-toggle__description">
              {isComplexLocked ? 'Jen pro SMART' : '4 fáze (s pauzami)'}
            </div>
          </button>
        </div>

        {/* Tier hint for free users */}
        {isFree && (
          <div className="mode-toggle__hint">
            🔒 Pokročilý režim je dostupný v SMART tarifu
          </div>
        )}
      </div>
    </section>
  );
}
