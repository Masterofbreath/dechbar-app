/**
 * FullscreenModalContentZone - Flexible Content Area
 * 
 * Flex: 1 content area with auto-centering
 * KRITICKÉ: Zajišťuje stejné rozměry v různých states (countdown/active)
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal
 */

import type { FullscreenModalBarProps } from './types';

export function FullscreenModalContentZone({ children, className = '' }: FullscreenModalBarProps) {
  return (
    <div className={`fullscreen-modal__content-zone ${className}`}>
      {children}
    </div>
  );
}
