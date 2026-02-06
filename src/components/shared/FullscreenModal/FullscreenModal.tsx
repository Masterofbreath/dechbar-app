/**
 * FullscreenModal - Main Container Component
 * 
 * Reusable fullscreen modal with compound component pattern
 * Desktop: Centered modal with overlay
 * Mobile: Fullscreen immersive experience
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal
 */

import { useScrollLock } from '@/platform/hooks';
import { FullscreenModalTopBar } from './FullscreenModalTopBar';
import { FullscreenModalContentZone } from './FullscreenModalContentZone';
import { FullscreenModalBottomBar } from './FullscreenModalBottomBar';
import { FullscreenModalTitle } from './subcomponents/FullscreenModalTitle';
import { FullscreenModalBadge } from './subcomponents/FullscreenModalBadge';
import { FullscreenModalCloseButton } from './subcomponents/FullscreenModalCloseButton';
import type { FullscreenModalProps } from './types';

export function FullscreenModal({ children, isOpen = true, onClose, className = '' }: FullscreenModalProps) {
  useScrollLock(isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div className={`fullscreen-modal ${className}`} role="dialog" aria-modal="true">
      <div className="fullscreen-modal__overlay" onClick={onClose} />
      <div className="fullscreen-modal__container">
        {children}
      </div>
    </div>
  );
}

// Compound components pattern
FullscreenModal.TopBar = FullscreenModalTopBar;
FullscreenModal.ContentZone = FullscreenModalContentZone;
FullscreenModal.BottomBar = FullscreenModalBottomBar;
FullscreenModal.Title = FullscreenModalTitle;
FullscreenModal.Badge = FullscreenModalBadge;
FullscreenModal.CloseButton = FullscreenModalCloseButton;
