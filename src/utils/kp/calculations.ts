/**
 * KP Measurement Calculations
 * 
 * Průměr, trend, status calculation.
 * 
 * @package DechBar_App
 * @subpackage Utils/KP
 * @since 0.3.0
 */

/**
 * KP status levels based on value
 */
export type KPStatus = 'low' | 'normal' | 'good' | 'excellent';

/**
 * Calculate average from attempts
 * 
 * Filtruje null hodnoty a počítá průměr.
 * 
 * @param attempts - Array pokusů [33, 36, 36] nebo [33, null, null]
 * @returns Zaokrouhlený průměr
 * 
 * @example
 * calculateAverage([33, 36, 36]) // 35
 * calculateAverage([33, null, null]) // 33
 * calculateAverage([30, 35]) // 33 (zaokrouhleno)
 */
export function calculateAverage(attempts: (number | null)[]): number {
  const validAttempts = attempts.filter((a): a is number => a !== null);
  
  if (validAttempts.length === 0) {
    throw new Error('No valid attempts to calculate average');
  }
  
  const sum = validAttempts.reduce((acc, val) => acc + val, 0);
  const average = sum / validAttempts.length;
  
  // Zaokrouhlit na celé sekundy
  return Math.round(average);
}

/**
 * Calculate trend from current vs previous measurement
 * 
 * @param current - Aktuální KP hodnota
 * @param previous - Předchozí KP hodnota (nebo null pokud není)
 * @returns Rozdíl (+/- sekundy)
 * 
 * @example
 * calculateTrend(35, 33) // +2
 * calculateTrend(30, 33) // -3
 * calculateTrend(35, null) // 0 (první měření)
 */
export function calculateTrend(current: number, previous: number | null): number {
  if (previous === null) return 0;
  return current - previous;
}

/**
 * Get KP status based on value
 * 
 * Reference values:
 * - < 20s: Low (red) - Začátečník
 * - 20-29s: Normal (teal) - Průměrný
 * - 30-39s: Good (teal) - Dobrý
 * - 40+s: Excellent (gold) - Skvělý
 * 
 * @param value - KP v sekundách
 * @returns Status level
 * 
 * @example
 * getKPStatus(15) // 'low'
 * getKPStatus(25) // 'normal'
 * getKPStatus(35) // 'good'
 * getKPStatus(45) // 'excellent'
 */
export function getKPStatus(value: number): KPStatus {
  if (value < 20) return 'low';
  if (value < 30) return 'normal';
  if (value < 40) return 'good';
  return 'excellent';
}

/**
 * Get status label in Czech
 * 
 * @param status - KP status
 * @returns Czech label
 */
export function getKPStatusLabel(status: KPStatus): string {
  const labels: Record<KPStatus, string> = {
    low: 'Začni s pravidelnými nádechy',
    normal: 'Průměrný stav',
    good: 'Dobrý stav',
    excellent: 'Skvělý výkon',
  };
  
  return labels[status];
}

/**
 * Calculate average KP for a period
 * 
 * @param measurements - Array of KP values
 * @returns Average KP
 */
export function calculatePeriodAverage(measurements: number[]): number {
  if (measurements.length === 0) return 0;
  
  const sum = measurements.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / measurements.length);
}

/**
 * Get best (highest) KP from measurements
 * 
 * @param measurements - Array of KP values
 * @returns Highest KP value
 */
export function getBestKP(measurements: number[]): number {
  if (measurements.length === 0) return 0;
  return Math.max(...measurements);
}
