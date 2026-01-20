/**
 * Payment System Constants
 * 
 * Configuration constants for Stripe integration
 * 
 * @package DechBar/Platform
 * @since 2026-01-20
 */

/**
 * Checkout URLs (relative paths)
 */
export const CHECKOUT_URLS = {
  SUCCESS: '/checkout/success',
  CANCEL: '/checkout/cancel',
} as const;

/**
 * Stripe Currency
 */
export const STRIPE_CURRENCY = 'CZK' as const;

/**
 * Error Messages (Czech)
 */
export const CHECKOUT_ERRORS = {
  NOT_AUTHENTICATED: 'Musíš být přihlášený pro nákup předplatného.',
  MISSING_PRICE_ID: 'Chybí ID ceny. Kontaktuj podporu.',
  SESSION_FAILED: 'Nepodařilo se vytvořit platební relaci. Zkus to znovu.',
  NETWORK_ERROR: 'Chyba sítě. Zkontroluj připojení k internetu.',
  UNKNOWN_ERROR: 'Něco se pokazilo. Zkus to prosím znovu.',
} as const;

/**
 * Success Messages (Czech)
 */
export const CHECKOUT_SUCCESS = {
  REDIRECT: 'Přesměrovávám na platební bránu...',
  COMPLETED: 'Platba byla úspěšná!',
} as const;

/**
 * Module IDs (for Stripe metadata)
 */
export const MODULE_IDS = {
  SMART: 'membership-smart',
  AI_COACH: 'membership-ai-coach',
} as const;
