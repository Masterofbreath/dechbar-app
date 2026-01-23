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
  
  // Helper: Get display text based on state
  const getDisplayText = () => {
    if (isLoading) return '...';
    if (displayValue === 0) return '?';
    return `${displayValue}s`;
  };
  
  // Helper: Get display status class
  const getDisplayStatus = () => {
    if (isLoading || displayValue === 0) return 'unknown';
    return status;
  };
  
  // Helper: Get aria label
  const getAriaLabel = () => {
    if (isLoading) return 'Kontrolní pauza: načítání';
    if (displayValue === 0) return 'Kontrolní pauza: zatím neměřeno';
    return `Kontrolní pauza: ${displayValue} sekund`;
  };
  
  return (
    <button 
      className={`kp-display kp-display--${getDisplayStatus()}`}
      onClick={handleClick}
      aria-label={getAriaLabel()}
      type="button"
    >
      <span className="kp-display__label">KP</span>
      <span className="kp-display__value">{getDisplayText()}</span>
    </button>
  );
}
