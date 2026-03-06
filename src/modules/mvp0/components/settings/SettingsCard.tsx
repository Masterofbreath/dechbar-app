/**
 * SettingsCard - Grouped Card Component
 *
 * Card wrapper for settings sections.
 * Accepts optional SVG icon node in header (brand rule: no emoji).
 * Supports locked state for tier-gated features.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React, { useState } from 'react';

export interface SettingsCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** If true, card shows lock icon and blocks interaction */
  locked?: boolean;
  /** Tooltip text shown when locked card is clicked */
  lockedTooltip?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  icon,
  children,
  className = '',
  locked = false,
  lockedTooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  function handleLockedClick() {
    if (!locked || !lockedTooltip) return;
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  }

  return (
    <div
      className={`settings-card ${locked ? 'settings-card--locked' : ''} ${className}`}
      onClick={locked ? handleLockedClick : undefined}
      role={locked ? 'button' : undefined}
      tabIndex={locked ? 0 : undefined}
      onKeyDown={locked ? (e) => { if (e.key === 'Enter') handleLockedClick(); } : undefined}
      aria-label={locked ? `${title} — zamčeno` : undefined}
    >
      <div className="settings-card__header">
        {icon && (
          <div className="settings-card__icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="settings-card__title">{title}</h3>
        {locked && (
          <div className="settings-card__lock" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}
      </div>

      {locked ? (
        <div className="settings-card__locked-content">
          {showTooltip && lockedTooltip && (
            <p className="settings-card__locked-tooltip">{lockedTooltip}</p>
          )}
          {!showTooltip && (
            <p className="settings-card__locked-hint">Klikni pro více informací</p>
          )}
        </div>
      ) : (
        <div className="settings-card__content">
          {children}
        </div>
      )}
    </div>
  );
};
