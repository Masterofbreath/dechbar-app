/**
 * Format Price Utility
 * 
 * Format prices in Czech koruna format
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

import type { BillingInterval } from '../types';

/**
 * Format price in CZK
 * 
 * @example
 * formatPrice(249) // "249 Kč"
 * formatPrice(1494) // "1 494 Kč" (with space separator)
 */
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('cs-CZ')} Kč`;
}

/**
 * Format price with interval
 * 
 * @example
 * formatPriceWithInterval(249, 'monthly') // "249 Kč/měsíc"
 * formatPriceWithInterval(1494, 'annual') // "1 494 Kč/rok"
 */
export function formatPriceWithInterval(
  amount: number,
  interval: BillingInterval
): string {
  const price = formatPrice(amount);
  const period = interval === 'monthly' ? 'měsíc' : 'rok';
  return `${price}/${period}`;
}

/**
 * Format monthly equivalent for annual pricing
 * 
 * @example
 * formatMonthlyEquivalent(125) // "125 Kč/měsíc"
 */
export function formatMonthlyEquivalent(monthlyAmount: number): string {
  return `${monthlyAmount} Kč/měsíc`;
}

/**
 * Format full annual pricing description
 * 
 * @example
 * formatAnnualPricing(125, 1494)
 * // "125 Kč/měsíc (fakturace 1 494 Kč ročně)"
 */
export function formatAnnualPricing(
  perMonth: number,
  totalAnnual: number
): string {
  return `${perMonth} Kč/měsíc (fakturace ${totalAnnual.toLocaleString('cs-CZ')} Kč ročně)`;
}
