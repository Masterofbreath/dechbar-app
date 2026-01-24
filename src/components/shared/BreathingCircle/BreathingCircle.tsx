/**
 * BreathingCircle - Unified Breathing Visualization Component
 * 
 * Shared component supporting both animated (Session Engine) and static (KP) variants.
 * 
 * @example Animated variant (breathing exercises)
 * ```tsx
 * <BreathingCircle
 *   variant="animated"
 *   size={280}
 *   state="inhale"
 *   circleRef={circleRef}
 * >
 *   <div className="breathing-instruction">NÁDECH</div>
 * </BreathingCircle>
 * ```
 * 
 * @example Static variant (KP measurement)
 * ```tsx
 * <BreathingCircle variant="static" size={280}>
 *   <div className="kp-timer">00:35</div>
 * </BreathingCircle>
 * ```
 * 
 * @package DechBar_App
 * @subpackage Components/Shared/BreathingCircle
 * @since 0.3.0
 */

import React from 'react';

export interface BreathingCircleProps {
  /**
   * Circle variant:
   * - 'animated': RAF-based breathing animation (Session Engine)
   * - 'static': No animation (KP measurement)
   */
  variant: 'animated' | 'static';
  
  /**
   * Circle diameter in pixels
   * @default 280
   */
  size?: 280 | 220 | 180;
  
  /**
   * Color state (animated variant only)
   * - 'inhale': Light teal
   * - 'exhale': Dark teal
   * - 'hold': Dark teal
   */
  state?: 'inhale' | 'exhale' | 'hold';
  
  /**
   * Ref for external animation control (animated variant only)
   * Used by useBreathingAnimation hook for RAF-based scaling
   */
  circleRef?: React.RefObject<HTMLDivElement>;
  
  /**
   * Content displayed inside circle (timer, instruction, etc.)
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BreathingCircle Component
 */
export function BreathingCircle({
  variant,
  size = 280,
  state,
  circleRef,
  children,
  className = '',
}: BreathingCircleProps) {
  // CSS class composition
  const containerClasses = [
    'breathing-circle-container',
    className,
  ].filter(Boolean).join(' ');
  
  const circleClasses = [
    'breathing-circle',
    variant === 'static' && 'breathing-circle--static',
    variant === 'animated' && 'breathing-circle--animated',
    state && `breathing-circle--${state}`,
  ].filter(Boolean).join(' ');
  
  // CSS variable for dynamic sizing
  const containerStyle = {
    '--circle-size': `${size}px`,
  } as React.CSSProperties;
  
  return (
    <div className={containerClasses} style={containerStyle}>
      <div 
        ref={variant === 'animated' ? circleRef : undefined}
        className={circleClasses}
      >
        {children}
      </div>
    </div>
  );
}
