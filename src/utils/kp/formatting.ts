/**
 * KP Measurement Formatting Utilities
 * 
 * Format čísel, času, attempts pro UI zobrazení.
 * 
 * @package DechBar_App
 * @subpackage Utils/KP
 * @since 0.3.0
 */

/**
 * Format seconds to "XXs" string
 * 
 * @param seconds - Sekundy
 * @returns Formatted string
 * 
 * @example
 * formatSeconds(35) // "35s"
 * formatSeconds(0) // "0s"
 */
export function formatSeconds(seconds: number): string {
  return `${seconds}s`;
}

/**
 * Format attempts array to "XX•XX•XX" string
 * 
 * Null hodnoty se ignorují.
 * 
 * @param attempts - Array pokusů
 * @returns Formatted string
 * 
 * @example
 * formatAttempts([33, 36, 36]) // "33•36•36"
 * formatAttempts([33, null, null]) // "33"
 * formatAttempts([33, 36, null]) // "33•36"
 */
export function formatAttempts(attempts: (number | null)[]): string {
  const validAttempts = attempts.filter((a): a is number => a !== null);
  return validAttempts.map(a => a.toString()).join('•');
}

/**
 * Format trend to "+Xs" or "-Xs" string
 * 
 * @param trend - Trend value (positive or negative)
 * @returns Formatted string with sign
 * 
 * @example
 * formatTrend(2) // "+2s"
 * formatTrend(-3) // "-3s"
 * formatTrend(0) // "--" (první měření)
 */
export function formatTrend(trend: number): string {
  if (trend === 0) return '--';
  const sign = trend > 0 ? '+' : '';
  return `${sign}${trend}s`;
}

/**
 * Format milliseconds to MM:SS string
 * 
 * @param ms - Milliseconds
 * @returns Formatted time string
 * 
 * @example
 * formatTimer(0) // "00:00"
 * formatTimer(35000) // "00:35"
 * formatTimer(125000) // "02:05"
 */
export function formatTimer(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format milliseconds to "XXs" string (for KP timer)
 * 
 * Zkrácený formát pro realtimový KP timer zobrazující pouze sekundy.
 * Používá se během měření KP pro čitelnost a konzistenci s výsledky.
 * Výhody: Méně znaků → větší font možný, scalabilita nad 99s, konzistence.
 * 
 * @param ms - Milliseconds
 * @returns Formatted time string with seconds only
 * 
 * @example
 * formatTimerSeconds(0) // "0s"
 * formatTimerSeconds(5000) // "5s"
 * formatTimerSeconds(35000) // "35s"
 * formatTimerSeconds(125000) // "125s"
 */
export function formatTimerSeconds(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  return `${totalSeconds}s`;
}

/**
 * Format date to Czech locale
 * 
 * @param date - Date object or ISO string
 * @param includeTime - Include time in output
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date('2026-01-23')) // "23. 1. 2026"
 * formatDate(new Date('2026-01-23T07:30'), true) // "23. 1. 2026 7:30"
 */
export function formatDate(date: Date | string, includeTime = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (includeTime) {
    return dateObj.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time (např. "před 2 dny")
 * 
 * @param date - Date object or ISO string
 * @returns Relative time string in Czech
 * 
 * @example
 * formatRelativeTime(new Date()) // "právě teď"
 * formatRelativeTime(yesterday) // "včera"
 * formatRelativeTime(lastWeek) // "před 7 dny"
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'právě teď';
  if (diffMinutes < 60) return `před ${diffMinutes} min`;
  if (diffHours < 24) return `před ${diffHours} h`;
  if (diffDays === 1) return 'včera';
  if (diffDays < 7) return `před ${diffDays} dny`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `před ${weeks} ${weeks === 1 ? 'týdnem' : 'týdny'}`;
  }
  
  const months = Math.floor(diffDays / 30);
  return `před ${months} ${months === 1 ? 'měsícem' : 'měsíci'}`;
}

/**
 * Format countdown seconds to "Xs" string
 * 
 * @param seconds - Countdown seconds
 * @returns Formatted countdown
 * 
 * @example
 * formatCountdown(15) // "15s"
 * formatCountdown(5) // "5s"
 * formatCountdown(0) // "0s"
 */
export function formatCountdown(seconds: number): string {
  return `${seconds}s`;
}
