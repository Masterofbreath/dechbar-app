/**
 * Platform Payments - Public API
 * 
 * Exports for Stripe payment integration
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

// Hooks
export { useCheckout } from './useCheckout';
export { useEmbeddedCheckout } from './useEmbeddedCheckout';

// Components
export { PaymentModal } from './PaymentModal';

// Types
export type {
  BillingInterval,
  CheckoutStatus,
  CheckoutSessionResponse,
  CheckoutSessionRequest,
  EmbeddedCheckoutSessionResponse,
  EmbeddedCheckoutSessionRequest,
  PaymentModalState,
  PriceInfo,
  ModulePricing,
  CheckoutError,
} from './types';

// Constants
export {
  CHECKOUT_URLS,
  STRIPE_CURRENCY,
  CHECKOUT_ERRORS,
  CHECKOUT_SUCCESS,
  MODULE_IDS,
} from './constants';

// Utilities
export {
  formatPrice,
  formatPriceWithInterval,
  formatMonthlyEquivalent,
  formatAnnualPricing,
} from './utils/formatPrice';

export {
  calculateSavings,
  calculateSavingsPercentage,
  formatSavingsBadge,
  formatSavingsWithPercentage,
} from './utils/calculateSavings';
