/**
 * StaticBreathingCircle - Static Breathing Circle Component
 * 
 * Vizuálně identický s breathing circle ze session engine,
 * ale bez animací a color transitions.
 * Používá se pro KP měření (zádrž dechu = static circle).
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

export interface StaticBreathingCircleProps {
  /**
   * Content to display inside circle (timer, placeholder, etc.)
   */
  children?: React.ReactNode;
}

/**
 * StaticBreathingCircle Component
 * 
 * @example
 * <StaticBreathingCircle>
 *   <div className="timer">00:35</div>
 * </StaticBreathingCircle>
 */
export function StaticBreathingCircle({ children }: StaticBreathingCircleProps) {
  return (
    <div className="static-breathing-circle-container">
      <div className="static-breathing-circle">
        {children}
      </div>
    </div>
  );
}
