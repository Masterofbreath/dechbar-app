/**
 * Demo Configuration
 * 
 * Feature flags and variant testing for demo mockup.
 * Easy to change for A/B testing without code changes.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

export const DEMO_CONFIG = {
  // Feature flags
  features: {
    analytics: true,
    googleOAuth: true,
    emailRegistration: true,
  },
  
  // Variant testing (A/B)
  variant: {
    modal: 'personalized', // 'personalized' | 'generic'
    cta: 'google-first', // 'google-first' | 'email-first'
  },
  
  // Analytics tracking toggles
  analytics: {
    trackClicks: true,
    trackModalOpens: true,
    trackConversions: true,
  },
} as const;
