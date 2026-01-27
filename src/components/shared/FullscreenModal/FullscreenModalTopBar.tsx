/**
 * FullscreenModalTopBar - Fixed Top Bar Component
 * 
 * Fixed height top bar (70px desktop, 60px mobile)
 * Contains title (left), badge (center), close button (right)
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal
 */

import type { FullscreenModalBarProps } from './types';

export function FullscreenModalTopBar({ children, className = '' }: FullscreenModalBarProps) {
  return (
    <div className={`fullscreen-modal__top-bar ${className}`}>
      {children}
    </div>
  );
}
