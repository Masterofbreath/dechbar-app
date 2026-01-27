/**
 * FullscreenModalTitle - Title Subcomponent
 * 
 * Title text aligned to the left in TopBar
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal/Subcomponents
 */

import type { FullscreenModalTitleProps } from '../types';

export function FullscreenModalTitle({ children, className = '' }: FullscreenModalTitleProps) {
  return (
    <h3 className={`fullscreen-modal__title ${className}`}>
      {children}
    </h3>
  );
}
