/**
 * IconButton Component - Transparent Icon-Only Button
 * 
 * Use cases: Password toggle, Audio controls, Quick actions
 * Design: Always transparent, gold hover on icon only
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  ariaLabel: string;
}

export function IconButton({
  icon,
  size = 'md',
  active = false,
  ariaLabel,
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  const classes = [
    'icon-btn',
    size !== 'md' && `icon-btn--${size}`,
    active && 'icon-btn--active',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
}
