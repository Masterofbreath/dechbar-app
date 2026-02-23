/**
 * Analytics Utility
 * @module Platform/Utils/Analytics
 * @description Centralized analytics wrapper for Google Analytics 4 + Meta Pixel
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
  }
}

/**
 * Track custom event in Google Analytics 4
 */
export function trackEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics GA4]', eventName, properties);
  }
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, properties);
  }
}

/**
 * Track custom Meta Pixel event
 * 
 * Standard events: Purchase, Lead, CompleteRegistration, AddToCart, 
 * InitiateCheckout, ViewContent, Search, Subscribe
 * 
 * @example
 * trackMetaEvent('Purchase', { value: 990, currency: 'CZK', content_name: 'Studio' });
 * trackMetaEvent('CompleteRegistration');
 * trackMetaEvent('Lead');
 */
export function trackMetaEvent(eventName: string, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics Meta]', eventName, data);
  }
  if (typeof window.fbq !== 'undefined') {
    window.fbq('track', eventName, data);
  }
}

/**
 * Track purchase in both GA4 and Meta Pixel simultaneously
 * Use after successful payment confirmation
 * 
 * @example
 * trackPurchase({ value: 990, currency: 'CZK', itemName: 'Studio lifetime' });
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

  trackMetaEvent('Purchase', { value, currency, content_name: itemName });
}
