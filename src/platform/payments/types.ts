/**
 * Payment System Types
 * 
 * TypeScript types for Stripe integration
 * 
 * @package DechBar/Platform
 * @since 2026-01-20
 */

export type BillingInterval = 'monthly' | 'annual';

export type CheckoutStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Stripe Checkout Session Response
 */
export interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

/**
 * Checkout Session Request
 * Note: user_id is extracted from JWT token in Edge Function
 */
export interface CheckoutSessionRequest {
  price_id: string;
  interval: BillingInterval;
  module_id: string;
  email?: string;  // Required for guest checkout
}

/**
 * Price Information from modules table
 */
export interface PriceInfo {
  amount: number;
  currency: 'CZK';
  stripe_price_id: string;
  per_month?: number;      // For annual pricing (e.g., 125 Kč/month billed annually)
  savings?: number;         // How much user saves (e.g., 1,494 Kč)
}

/**
 * Module Pricing (from modules.pricing JSONB)
 */
export interface ModulePricing {
  monthly: PriceInfo;
  annual: PriceInfo;
}

/**
 * Stripe Webhook Event Types
 */
export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed';

/**
 * Checkout Error
 */
export interface CheckoutError {
  message: string;
  code?: string;
}
