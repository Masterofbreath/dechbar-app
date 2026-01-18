/**
 * KPDisplay - Kontrolní Pauza (CP) Display
 * 
 * Displays current breathing control pause value in TOP NAV.
 * Opens detailed KP history/stats on click.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.1.0
 */

import type { MouseEvent } from 'react';

export interface KPDisplayProps {
  /**
   * Current KP value in seconds (e.g. 35)
   */
  kpValue: number;
  
  /**
   * Optional: Current KP status (affects color)
   */
  status?: 'low' | 'normal' | 'good' | 'excellent';
  
  /**
   * Click handler - opens KP detail view
   */
  onClick?: () => void;
}

/**
 * Get status color based on KP value
 * 
 * Reference:
 * - < 20s: Low (red)
 * - 20-30s: Normal (teal)
 * - 30-40s: Good (teal)
 * - > 40s: Excellent (gold)
 */
function getKPStatus(kpValue: number): KPDisplayProps['status'] {
  if (kpValue < 20) return 'low';
  if (kpValue < 30) return 'normal';
  if (kpValue < 40) return 'good';
  return 'excellent';
}

/**
 * KPDisplay component
 * 
 * @example
 * <KPDisplay kpValue={35} onClick={() => navigate('/kp-detail')} />
 */
export function KPDisplay({ kpValue, status, onClick }: KPDisplayProps) {
  const computedStatus = status || getKPStatus(kpValue);
  
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick?.();
  };
  
  return (
    <button 
      className={`kp-display kp-display--${computedStatus}`}
      onClick={handleClick}
      aria-label={`Kontrolní pauza: ${kpValue} sekund`}
      type="button"
    >
      <span className="kp-display__label">KP</span>
      <span className="kp-display__value">{kpValue}s</span>
    </button>
  );
}
