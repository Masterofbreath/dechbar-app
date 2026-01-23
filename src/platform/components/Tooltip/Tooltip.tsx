/**
 * Tooltip Component - Click-to-Show Tooltip (Mobile-First)
 * 
 * Premium dark glassmorphism tooltip with click trigger.
 * Follows Visual Brand Book 2.0:
 * - Dark glassmorphism background
 * - Smooth rounded corners (12px)
 * - No emoji (clean, premium)
 * - Haptic feedback on interaction
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { useState, useRef, useEffect } from 'react';
import { useHaptic } from '@/platform/services/haptic';

export interface TooltipProps {
  /**
   * Trigger element (badge, button, etc.)
   */
  children: React.ReactNode;
  
  /**
   * Tooltip content (text only, no emoji)
   */
  content: string;
  
  /**
   * Position relative to trigger
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Tooltip - Click-activated tooltip with premium styling
 * 
 * @example
 * <Tooltip content="Poznámky ti pomůžou sledovat pokrok.">
 *   <span className="badge badge--notes">Poznámka</span>
 * </Tooltip>
 */
export function Tooltip({ 
  children, 
  content, 
  position = 'top',
  className = '' 
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { trigger } = useHaptic();
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trigger('light');
    setIsOpen(!isOpen);
  };
  
  return (
    <div 
      ref={wrapperRef}
      className={`tooltip-wrapper ${className}`}
      onClick={handleClick}
    >
      {children}
      
      {isOpen && (
        <div className={`tooltip tooltip--${position}`}>
          {content}
        </div>
      )}
    </div>
  );
}
