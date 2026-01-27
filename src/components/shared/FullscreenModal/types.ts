/**
 * FullscreenModal Types
 * 
 * Shared type definitions for the FullscreenModal system
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/FullscreenModal
 */

export interface FullscreenModalProps {
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export interface FullscreenModalBarProps {
  children: React.ReactNode;
  className?: string;
}

export interface FullscreenModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export interface FullscreenModalBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export interface FullscreenModalCloseButtonProps {
  onClick: () => void;
  className?: string;
  'aria-label'?: string;
}
