/**
 * SettingsCard - Grouped Card Component
 * 
 * Card wrapper for settings sections with glassmorphism design.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/Settings
 */

import React from 'react';

export interface SettingsCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * SettingsCard - Glassmorphism card for settings groups
 */
export const SettingsCard: React.FC<SettingsCardProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`settings-card ${className}`}>
      <h3 className="settings-card__title">{title}</h3>
      <div className="settings-card__content">
        {children}
      </div>
    </div>
  );
};
