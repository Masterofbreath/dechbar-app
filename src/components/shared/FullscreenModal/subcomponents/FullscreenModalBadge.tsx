/**
 * FullscreenModalBadge - Badge Subcomponent
 * 
 * Centered badge in TopBar (e.g., "FÁZE 1/7")
 * Optional element - only shown when provided
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal/Subcomponents
 */

import type { FullscreenModalBadgeProps } from '../types';

export function FullscreenModalBadge({ children, className = '' }: FullscreenModalBadgeProps) {
  return (
    <span className={`fullscreen-modal__badge ${className}`}>
      {children}
    </span>
  );
}
