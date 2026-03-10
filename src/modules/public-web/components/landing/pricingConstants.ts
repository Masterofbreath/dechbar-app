/**
 * Sdílené konstanty pro pricing (Landing + Můj účet).
 * Jediný zdroj pravdy pro Stripe Price IDs a texty SMART tarifu.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Landing
 */

// Stripe Price IDs — SMART Membership
// LIVE: prod_U0SzbyNG0vrzZ0 (acct_1S3eJ5K0OYr7u1q9)
// Env override: VITE_STRIPE_PRICE_SMART_MONTHLY / VITE_STRIPE_PRICE_SMART_ANNUAL v .env.production
export const PRICE_IDS_SMART = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_SMART_MONTHLY ?? 'price_1T2S3eK0OYr7u1q9W5ZW042C',
  annual: import.meta.env.VITE_STRIPE_PRICE_SMART_ANNUAL ?? 'price_1T2S3dK0OYr7u1q9bwA0cNS8',
} as const;

// AI COACH (pro Můj účet a budoucí rozšíření)
export const PRICE_IDS_AI_COACH = {
  monthly: 'price_1SraCSK7en1dcW6HFkmAbdIL',
  annual: 'price_1SraIaK7en1dcW6HsYyN0Aj9',
} as const;

export const PRICE_IDS = {
  smart: PRICE_IDS_SMART,
  aiCoach: PRICE_IDS_AI_COACH,
} as const;

/** Sjednocený seznam benefitů SMART tarifu (Landing + Můj účet) */
export const SMART_FEATURES = [
  'SMART cvičení přesně pro tebe',
  'Neomezená vlastní cvičení',
  'Přístup k dechovým výzvám',
  'Přístup k 150+ audio lekcím',
  'Záznamy z pravidelných Online Session',
] as const;
