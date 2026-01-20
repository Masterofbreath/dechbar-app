/**
 * Calculate Savings Utility
 * 
 * Calculate savings for annual vs monthly billing
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

import { formatPrice } from './formatPrice';

/**
 * Calculate annual savings
 * 
 * Calculates how much user saves by choosing annual vs monthly billing
 * 
 * @param monthlyPrice - Monthly price (e.g., 249 Kč)
 * @param annualPrice - Annual price (e.g., 1,494 Kč)
 * @returns Savings amount in CZK
 * 
 * @example
 * calculateSavings(249, 1494) // 1494 (saves 1,494 Kč per year)
 */
export function calculateSavings(
  monthlyPrice: number,
  annualPrice: number
): number {
  const yearlyMonthlyTotal = monthlyPrice * 12;
  return yearlyMonthlyTotal - annualPrice;
}

/**
 * Calculate savings percentage
 * 
 * @param monthlyPrice - Monthly price
 * @param annualPrice - Annual price
 * @returns Percentage saved (0-100)
 * 
 * @example
 * calculateSavingsPercentage(249, 1494) // 50
 */
export function calculateSavingsPercentage(
  monthlyPrice: number,
  annualPrice: number
): number {
  const savings = calculateSavings(monthlyPrice, annualPrice);
  const yearlyMonthlyTotal = monthlyPrice * 12;
  return Math.round((savings / yearlyMonthlyTotal) * 100);
}

/**
 * Format savings badge text
 * 
 * @param monthlyPrice - Monthly price
 * @param annualPrice - Annual price
 * @returns Formatted badge text in Czech
 * 
 * @example
 * formatSavingsBadge(249, 1494) // "Ušetříš 1 494 Kč"
 */
export function formatSavingsBadge(
  monthlyPrice: number,
  annualPrice: number
): string {
  const savings = calculateSavings(monthlyPrice, annualPrice);
  return `Ušetříš ${formatPrice(savings)}`;
}

/**
 * Format savings with percentage
 * 
 * @param monthlyPrice - Monthly price
 * @param annualPrice - Annual price
 * @returns Formatted text with savings and percentage
 * 
 * @example
 * formatSavingsWithPercentage(249, 1494)
 * // "Ušetříš 1 494 Kč (50%)"
 */
export function formatSavingsWithPercentage(
  monthlyPrice: number,
  annualPrice: number
): string {
  const savings = calculateSavings(monthlyPrice, annualPrice);
  const percentage = calculateSavingsPercentage(monthlyPrice, annualPrice);
  return `Ušetříš ${formatPrice(savings)} (${percentage}%)`;
}
