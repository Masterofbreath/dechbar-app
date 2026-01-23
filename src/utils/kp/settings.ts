/**
 * KP Settings Utilities
 * 
 * Helper functions pro práci s uživatelskými preferencemi KP měření.
 * Ukládá do localStorage (později Supabase user preferences).
 * 
 * @package DechBar_App
 * @subpackage Utils/KP
 * @since 0.3.0
 */

/**
 * Get KP measurements count from user preferences
 * 
 * @returns 1 (rychlé) nebo 3 (přesné - default)
 */
export function getKPMeasurementsCount(): 1 | 3 {
  const saved = localStorage.getItem('kp-measurements-count');
  return saved === '1' ? 1 : 3; // Default 3x (doporučeno)
}

/**
 * Set KP measurements count
 * 
 * Volá se ze Settings modulu.
 * 
 * @param count - 1 (rychlé) nebo 3 (přesné)
 */
export function setKPMeasurementsCount(count: 1 | 3): void {
  localStorage.setItem('kp-measurements-count', String(count));
}
