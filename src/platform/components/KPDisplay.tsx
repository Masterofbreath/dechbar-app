/**
 * KPDisplay - Kontrolní Pauza (CP) Display
 * 
 * Displays current breathing control pause value in TOP NAV.
 * Opens detailed KP history/stats on click.
 * Connected to useKPMeasurements API.
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.1.0
 */

import { useKPMeasurements } from '@/platform/api';
import { useNavigation } from '@/platform/hooks';
import { getKPStatus } from '@/utils/kp';

/**
 * KPDisplay component
 * 
 * Auto-loads current KP from Supabase via useKPMeasurements.
 * 
 * @example
 * <KPDisplay />
 */
export function KPDisplay() {
  const { currentKP, isLoading } = useKPMeasurements();
  const { openKPDetail } = useNavigation();
  
  // Display value (0 if no measurement yet)
  const displayValue = currentKP ?? 0;
  const status = getKPStatus(displayValue);
  
  const handleClick = () => {
    openKPDetail();
  };
  
  // Don't show if loading or no data yet
  if (isLoading || displayValue === 0) {
    return null;
  }
  
  return (
    <button 
      className={`kp-display kp-display--${status}`}
      onClick={handleClick}
      aria-label={`Kontrolní pauza: ${displayValue} sekund`}
      type="button"
    >
      <span className="kp-display__label">KP</span>
      <span className="kp-display__value">{displayValue}s</span>
    </button>
  );
}
