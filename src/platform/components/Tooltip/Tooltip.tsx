/**
 * Tooltip Component - Click (mobile) / Hover (desktop) Tooltip
 *
 * Premium dark glassmorphism tooltip.
 * - Desktop (>768px): hover trigger
 * - Mobile (<=768px): click/tap trigger + full modal overlay
 * - content: ReactNode — supports plain text and future rich content
 *
 * Follows Visual Brand Book 2.0:
 * - Dark glassmorphism background
 * - Smooth rounded corners (12px)
 * - No emoji (clean, premium)
 * - Haptic feedback on mobile tap
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
   * Tooltip content — supports plain text and JSX (for future rich text)
   */
  content: React.ReactNode;

  /**
   * Position relative to trigger (desktop only; mobile uses centered modal)
   * @default 'top'
   */
  position?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Additional CSS classes for the wrapper
   */
  className?: string;
}

/**
 * Tooltip - Hover (desktop) / click (mobile) tooltip with premium styling
 *
 * @example
 * <Tooltip content="Poznámky ti pomůžou sledovat pokrok.">
 *   <span className="badge badge--notes">Poznámka</span>
 * </Tooltip>
 *
 * @example JSX content
 * <Tooltip content={<><strong>Tučný text</strong> a normální.</>}>
 *   <button>Nápověda</button>
 * </Tooltip>
 */
export function Tooltip({
  children,
  content,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { trigger } = useHaptic();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Detect mobile — static at render time, sufficient for PWA
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const isVisible = isMobile ? isOpen : (isHovered || isOpen);

  // Close on click outside (mobile modal)
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
    if (!isMobile) return; // desktop uses hover only
    e.stopPropagation();
    trigger('light');
    setIsOpen((prev) => !prev);
  };

  const wrapperClass = [
    'tooltip-wrapper',
    isOpen ? 'tooltip-wrapper--open' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapperRef}
      className={wrapperClass}
      onClick={handleClick}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setIsHovered(false);
          setIsOpen(false);
        }
      }}
    >
      {children}

      {isVisible && (
        <div className={`tooltip tooltip--${position}`}>
          {content}
        </div>
      )}
    </div>
  );
}
