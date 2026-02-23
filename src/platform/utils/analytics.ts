/**
 * Analytics Utility
 * @module Platform/Utils/Analytics
 * @description Centralized analytics wrapper for Google Analytics 4 + Meta Pixel
 * 
 * TESTING IN DEV:
 * - All events are logged to console as [Analytics Meta] / [Analytics GA4]
 * - Install "Meta Pixel Helper" Chrome extension to verify pixel fires
 * - Use Meta Events Manager → "Test Events" tab for live event stream
 *   (requires adding ?fbclid param or using Test Event Code in pixel)
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}

/**
 * Parses a price string like "249 Kč" or "1 490 Kč" to a number (249, 1490)
 */
export function parsePriceString(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
}

/**
 * Track custom event in Google Analytics 4
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log('%c[GA4]', 'color: #4285F4; font-weight: bold', eventName, properties ?? '');
  }
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, properties);
  }
}

/**
 * Track standard Meta Pixel event
 *
 * Standard events: PageView, ViewContent, InitiateCheckout,
 * Purchase, Lead, CompleteRegistration, Subscribe
 *
 * @example
 * trackMetaEvent('Purchase', { value: 249, currency: 'CZK', content_name: 'SMART' });
 * trackMetaEvent('Lead');
 * trackMetaEvent('InitiateCheckout', { content_name: 'SMART', value: 249, currency: 'CZK' });
 */
export function trackMetaEvent(eventName: string, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log('%c[Meta Pixel]', 'color: #1877F2; font-weight: bold', eventName, data ?? '');
  }
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', eventName, data);
  }
}

/**
 * Track purchase in both GA4 and Meta Pixel simultaneously.
 * Call this after Stripe Embedded Checkout onComplete fires.
 *
 * @example
 * trackPurchase({ value: 249, currency: 'CZK', itemName: 'SMART monthly' });
 */
export function trackPurchase(params: {
  value: number;
  currency: string;
  itemName: string;
  transactionId?: string;
}): void {
  const { value, currency, itemName, transactionId } = params;

  trackEvent('purchase', {
    value,
    currency,
    transaction_id: transactionId ?? '',
    items: [{ item_name: itemName, price: value }],
  });

  trackMetaEvent('Purchase', {
    value,
    currency,
    content_name: itemName,
    content_type: 'product',
  });
}
