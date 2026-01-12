/**
 * TextLink Component
 * 
 * Text-based link (not a button!) for secondary actions
 * Examples: "Zapomenuté heslo?", "Registruj se zdarma", "Přihlásit se"
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface TextLinkProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  muted?: boolean;
  bold?: boolean;
  children: ReactNode;
}

export function TextLink({
  muted = false,
  bold = false,
  className = '',
  children,
  type = 'button',
  ...props
}: TextLinkProps) {
  const classes = [
    'text-link',
    muted && 'text-link--muted',
    bold && 'text-link--bold',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
