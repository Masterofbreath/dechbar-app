/**
 * MiniTip - Lightweight Tip/Hint Component
 * 
 * Displays subtle tips, hints, or helpful information.
 * Used across the app for contextual guidance.
 * 
 * @example
 * <MiniTip variant="absolute">
 *   <strong>Tip:</strong> Pro nejpřesnější výsledky měř KP ráno.
 * </MiniTip>
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/Shared
 * @since 0.2.1
 */

import React from 'react';

interface MiniTipProps {
  /**
   * Tip content (supports HTML elements like <strong>)
   */
  children: React.ReactNode;
  
  /**
   * Layout variant:
   * - 'absolute': Positioned absolutely (for measurement-area, instructions)
   * - 'static': Normal flow (for future use in cards, etc.)
   */
  variant?: 'absolute' | 'static';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function MiniTip({ 
  children, 
  variant = 'absolute',
  className = '' 
}: MiniTipProps) {
  return (
    <p className={`mini-tip mini-tip--${variant} ${className}`.trim()}>
      💡 {children}
    </p>
  );
}
