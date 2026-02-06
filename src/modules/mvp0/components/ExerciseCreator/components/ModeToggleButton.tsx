/**
 * ModeToggleButton - Compact Mode Switcher for TopBar
 * @module ExerciseCreator/Components
 * @description Small toggle button for switching between Simple and Complex (Protocol) modes
 * 
 * Placement: TopBar (next to CloseButton)
 * 
 * Tier Logic:
 * - Free users: Simple mode only (Complex locked)
 * - SMART users: Both modes available
 * 
 * Future (MVP3):
 * - Complex mode will create Protocols (multi-phase exercises)
 */

import { useCallback } from 'react';
import { useMembership } from '@/platform/membership';

interface ModeToggleButtonProps {
  mode: 'simple' | 'complex';
  onToggle: () => void;
  disabled?: boolean;
}

export function ModeToggleButton({ mode, onToggle, disabled = false }: ModeToggleButtonProps) {
  const { plan } = useMembership();
  const isFree = plan === 'ZDARMA';
  const isComplexLocked = isFree && mode === 'simple';

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    // If trying to switch to complex mode and user is free, show paywall
    if (mode === 'simple' && isComplexLocked) {
      // TODO: Open TierLockModal in Phase 4
      console.log('[ModeToggleButton] Complex mode locked for free users');
      return;
    }
    
    onToggle();
  }, [disabled, mode, isComplexLocked, onToggle]);

  return (
    <button
      type="button"
      className={`mode-toggle-button ${mode === 'complex' ? 'mode-toggle-button--active' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      aria-label={mode === 'simple' ? 'Přepnout na pokročilý režim' : 'Přepnout na základní režim'}
      title={mode === 'simple' ? 'Základní režim (cvičení)' : 'Pokročilý režim (protokoly)'}
    >
      {/* Text-based mode indicator */}
      <span className="mode-toggle-button__text">
        {mode === 'simple' ? 'Základní' : 'Pokročilý'}
      </span>
      
      {/* Lock icon for free users */}
      {isComplexLocked && (
        <svg
          className="mode-toggle-button__lock"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
    </button>
  );
}
