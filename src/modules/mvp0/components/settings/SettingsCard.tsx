/**
 * SettingsCard - Grouped Card Component
 *
 * Collapsible accordion card for settings sections.
 * Accepts optional SVG icon node in header (brand rule: no emoji).
 * Supports locked state for tier-gated features (cannot expand).
 * Default open/closed state configurable via `defaultOpen` prop.
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
  /** If true, card shows lock icon and blocks expansion */
  locked?: boolean;
  /** Tooltip text shown when locked card is clicked */
  lockedTooltip?: string;
  /** Whether card starts expanded (default: false) */
  defaultOpen?: boolean;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  icon,
  children,
  className = '',
  locked = false,
  lockedTooltip,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showTooltip, setShowTooltip] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  function handleHeaderClick() {
    if (locked) {
      if (!lockedTooltip) return;
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    setIsOpen((prev) => !prev);
  }

  return (
    <div
      className={`settings-card ${locked ? 'settings-card--locked' : ''} ${isOpen ? 'settings-card--open' : ''} ${className}`}
    >
      <button
        type="button"
        className="settings-card__header"
        onClick={handleHeaderClick}
        aria-expanded={locked ? undefined : isOpen}
        aria-label={locked ? `${title} — zamčeno` : title}
      >
        {icon && (
          <div className="settings-card__icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="settings-card__title">{title}</h3>
        {locked ? (
          <div className="settings-card__lock" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        ) : (
          <div className={`settings-card__chevron${isOpen ? ' settings-card__chevron--open' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </button>

      {locked && showTooltip && (
        <div className="settings-card__locked-content">
          <p className="settings-card__locked-tooltip">{lockedTooltip}</p>
        </div>
      )}

      {!locked && isOpen && (
        <div className="settings-card__content" ref={contentRef}>
          {children}
        </div>
      )}
    </div>
  );
};
