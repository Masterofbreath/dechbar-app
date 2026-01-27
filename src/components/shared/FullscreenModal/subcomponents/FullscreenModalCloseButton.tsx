/**
 * FullscreenModalCloseButton - Close Button Subcomponent
 * 
 * Close button aligned to the right in TopBar
 * Reuses shared CloseButton component
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal/Subcomponents
 */

import { CloseButton } from '@/components/shared';
import type { FullscreenModalCloseButtonProps } from '../types';

export function FullscreenModalCloseButton({ 
  onClick, 
  className = '',
  'aria-label': ariaLabel = 'Zavřít'
}: FullscreenModalCloseButtonProps) {
  return (
    <CloseButton 
      onClick={onClick} 
      className={`fullscreen-modal__close ${className}`}
      aria-label={ariaLabel}
    />
  );
}
