/**
 * FullscreenModalBottomBar - Fixed Bottom Bar Component
 * 
 * Fixed height bottom bar (70px desktop, 60px mobile)
 * Contains progress bar and optional next phase preview
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal
 */

import type { FullscreenModalBarProps } from './types';

export function FullscreenModalBottomBar({ children, className = '' }: FullscreenModalBarProps) {
  return (
    <div className={`fullscreen-modal__bottom-bar ${className}`}>
      {children}
    </div>
  );
}
