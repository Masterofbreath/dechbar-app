/**
 * Analytics — Time Utility Functions
 *
 * @package DechBar_App
 * @subpackage Platform/Analytics
 */

/**
 * Convert seconds to minutes (rounded to 1 decimal).
 */
export function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

/**
 * Format minutes into a human-readable string.
 * Examples: 47 → "47 min", 130 → "2h 10 min", 60 → "1h"
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMin = Math.round(minutes % 60);
  if (remainingMin === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMin} min`;
}

/**
 * Convert minutes of activity to a heat-map level (0–4).
 * Used in the activity graph (GitHub-style squares).
 *
 * 0 = no activity
 * 1 = < 5 min
 * 2 = 5–14 min
 * 3 = 15–29 min
 * 4 = ≥ 30 min
 */
export function getActivityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 5) return 1;
  if (minutes < 15) return 2;
  if (minutes < 30) return 3;
  return 4;
}

/**
 * Format a date as YYYY-MM-DD local date string.
 */
export function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Return the ISO date string for yesterday (local timezone).
 */
export function yesterdayIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toIsoDateString(d);
}
