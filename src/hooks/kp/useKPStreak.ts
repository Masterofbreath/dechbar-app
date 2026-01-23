/**
 * useKPStreak - Calculate Weekly Streak
 * 
 * Výpočet týdenního streaku (kolik týdnů v řadě uživatel měřil KP).
 * Používá se pouze v Pokrok modulu (ne v TOP NAV).
 * 
 * @package DechBar_App
 * @subpackage Hooks/KP
 * @since 0.3.0
 */

import { useMemo } from 'react';

/**
 * KP Measurement interface (simplified for streak calculation)
 */
interface KPMeasurementForStreak {
  measured_at: string; // ISO timestamp
  is_valid: boolean;
}

/**
 * Calculate weekly streak from measurements
 * 
 * Pravidlo: Uživatel měří alespoň 1x týdně (ne každý den).
 * Streak roste, pokud měřil minulý týden i tento týden.
 * 
 * @param measurements - Všechna validní měření (sorted desc)
 * @returns Počet týdnů v řadě
 * 
 * @example
 * const measurements = [
 *   { measured_at: '2026-01-23T07:00', is_valid: true },  // Tento týden
 *   { measured_at: '2026-01-16T07:00', is_valid: true },  // Minulý týden
 *   { measured_at: '2026-01-09T07:00', is_valid: true },  // Před 2 týdny
 *   // 2026-01-02 - CHYBÍ (break streak)
 * ];
 * calculateWeeklyStreak(measurements); // 3 týdny
 */
export function calculateWeeklyStreak(measurements: KPMeasurementForStreak[]): number {
  if (measurements.length === 0) return 0;
  
  // Filtrovat jen validní měření
  const validMeasurements = measurements.filter(m => m.is_valid);
  if (validMeasurements.length === 0) return 0;
  
  // Získat začátky týdnů pro všechna měření
  const weekStarts = new Set<number>();
  
  validMeasurements.forEach(m => {
    const date = new Date(m.measured_at);
    const weekStart = getWeekStart(date);
    weekStarts.add(weekStart.getTime());
  });
  
  // Sort week starts (newest first)
  const sortedWeeks = Array.from(weekStarts).sort((a, b) => b - a);
  
  // Kontrola aktuálního týdne
  const currentWeekStart = getWeekStart(new Date());
  if (!sortedWeeks.includes(currentWeekStart.getTime())) {
    return 0; // Tento týden neměřil
  }
  
  // Počítat streak
  let streak = 1; // Tento týden měřil
  let expectedWeek = getWeekStart(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000));
  
  for (let i = 1; i < sortedWeeks.length; i++) {
    const weekTime = sortedWeeks[i];
    const expectedTime = expectedWeek.getTime();
    
    // Check if this week matches expected (consecutive)
    if (Math.abs(weekTime - expectedTime) < 24 * 60 * 60 * 1000) { // 1 day tolerance
      streak++;
      expectedWeek = getWeekStart(new Date(expectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      // Gap found, break streak
      break;
    }
  }
  
  return streak;
}

/**
 * Get week start (Monday 00:00) for a given date
 * 
 * @param date - Any date
 * @returns Monday of that week at 00:00
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  
  return weekStart;
}

/**
 * Hook for weekly streak calculation
 * 
 * @param measurements - Valid KP measurements
 * @returns Current weekly streak
 * 
 * @example
 * const { measurements } = useKPMeasurements();
 * const streak = useKPStreak(measurements);
 * // streak: 3 (3 týdny v řadě)
 */
export function useKPStreak(measurements: KPMeasurementForStreak[]): number {
  return useMemo(() => calculateWeeklyStreak(measurements), [measurements]);
}
