/**
 * useKPValidation - React Hook for KP Measurement Validation
 * 
 * Wrapper nad validation utils pro React komponenty.
 * 
 * @package DechBar_App
 * @subpackage Hooks/KP
 * @since 0.3.0
 */

import { useMemo } from 'react';
import { validateKPMeasurement, isMorningWindow } from '@/utils/kp';
import type { ValidationResult } from '@/utils/kp';

/**
 * Hook pro validaci KP měření
 * 
 * @param measuredAt - Timestamp měření (default: now)
 * @returns Validation result
 * 
 * @example
 * const validation = useKPValidation();
 * if (!validation.is_valid) {
 *   showWarning(validation.validation_notes);
 * }
 */
export function useKPValidation(measuredAt: Date = new Date()): ValidationResult {
  return useMemo(() => validateKPMeasurement(measuredAt), [measuredAt]);
}

/**
 * Hook pro check ranního okna
 * 
 * @returns true pokud je ranní okno (4-9h)
 * 
 * @example
 * const isMorning = useIsMorningWindow();
 * if (!isMorning) {
 *   showWarning('Pro relevantní data měř ráno (4-9h)');
 * }
 */
export function useIsMorningWindow(): boolean {
  return useMemo(() => isMorningWindow(), []);
}
