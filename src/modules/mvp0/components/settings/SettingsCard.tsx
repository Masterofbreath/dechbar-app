/**
 * SettingsCard - Grouped Card Component
 *
 * Card wrapper for settings sections.
 * Accepts optional SVG icon node in header (brand rule: no emoji).
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React from 'react';

export interface SettingsCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  icon,
  children,
  className = '',
}) => {
  return (
    <div className={`settings-card ${className}`}>
      <div className="settings-card__header">
        {icon && (
          <div className="settings-card__icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="settings-card__title">{title}</h3>
      </div>
      <div className="settings-card__content">
        {children}
      </div>
    </div>
  );
};
