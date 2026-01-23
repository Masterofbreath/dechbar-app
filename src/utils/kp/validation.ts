/**
 * KP Measurement Validation Utilities
 * 
 * Validace ranního okna, time_of_day detection, device type detection.
 * 
 * @package DechBar_App
 * @subpackage Utils/KP
 * @since 0.3.0
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  is_morning_measurement: boolean;
  is_valid: boolean;
  validation_notes: string | null;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  hour_of_measurement: number;
}

/**
 * Validate KP measurement timing
 * 
 * Ranní okno: 4-9h (valid)
 * Ostatní časy: invalid (lze měřit vzorově)
 * 
 * @param measuredAt - Timestamp měření
 * @returns ValidationResult
 * 
 * @example
 * const result = validateKPMeasurement(new Date('2026-01-23T07:30:00'));
 * // { is_valid: true, is_morning_measurement: true, time_of_day: 'morning', ... }
 */
export function validateKPMeasurement(measuredAt: Date): ValidationResult {
  const hour = measuredAt.getHours();
  const isMorning = hour >= 4 && hour < 9;
  
  // Pro validní data: pouze ranní měření (4-9h)
  const isValid = isMorning;
  
  // Validation notes pro invalid měření
  let validationNotes: string | null = null;
  if (!isValid) {
    validationNotes = 'Měření mimo ranní okno (4-9h). Pro relevantní data měř ráno hned po probuzení.';
  }
  
  return {
    is_morning_measurement: isMorning,
    is_valid: isValid,
    validation_notes: validationNotes,
    time_of_day: getTimeOfDay(hour),
    hour_of_measurement: hour,
  };
}

/**
 * Get time of day category based on hour
 * 
 * @param hour - Hour (0-23)
 * @returns Time of day category
 */
export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 4 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Detect device type from user agent
 * 
 * @returns Device type
 */
export function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipod|android|mobile/.test(userAgent);
  const isTablet = /ipad|tablet/.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

/**
 * Check if current time is in morning window (4-9h)
 * 
 * @returns true if in morning window
 */
export function isMorningWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 4 && hour < 9;
}
