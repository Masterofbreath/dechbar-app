/**
 * Card Component
 * 
 * Container with liquid glass effect
 * Design inspired by WordPress dechbar-game modal design
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'elevated';
  children: ReactNode;
}

export function Card({
  variant = 'solid',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseClasses = 'rounded-2xl p-8';
  
  const variantClasses = {
    glass: 'bg-white/95 backdrop-blur-[30px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
    solid: 'bg-white shadow-md',
    elevated: 'bg-white shadow-lg hover:shadow-xl transition-shadow duration-200'
  };
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
}
