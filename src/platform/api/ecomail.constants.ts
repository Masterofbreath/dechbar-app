/**
 * Ecomail Constants
 * 
 * Konstanty pro Ecomail integraci.
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

// =====================================================
// API CONFIGURATION
// =====================================================

/**
 * Ecomail API Base URL
 */
export const ECOMAIL_BASE_URL = 'https://api2.ecomailapp.cz';

/**
 * Contact List IDs
 * 
 * IMPORTANT: Tyto ID se získají po vytvoření listů v Ecomail dashboardu
 * Pro DEV a PROD budou různé!
 * 
 * Setup: docs/marketing/ECOMAIL_DEPLOYMENT.md
 */
export const ECOMAIL_LISTS = {
  UNREG: 'unreg_users',      // Magic link sent, not clicked
  REG: 'reg_users',          // Registered + onboarded
  ENGAGED: 'engaged_users',  // 5+ hours breathed
  PREMIUM: 'premium_users',  // Paid members
  CHURNED: 'churned_users'   // Inactive 60+ days
} as const;

/**
 * List IDs by environment
 * Updated: 2026-01-28 (Created via API)
 */
export const ECOMAIL_LIST_IDS = {
  DEV: {
    UNREG: '5',
    REG: '6',
    ENGAGED: '7',
    PREMIUM: '8',
    CHURNED: '9'
  },
  PROD: {
    UNREG: 'LIST_ID_UNREG_PROD',
    REG: 'LIST_ID_REG_PROD',
    ENGAGED: 'LIST_ID_ENGAGED_PROD',
    PREMIUM: 'LIST_ID_PREMIUM_PROD',
    CHURNED: 'LIST_ID_CHURNED_PROD'
  }
} as const;

// =====================================================
// RETRY CONFIGURATION
// =====================================================

/**
 * Retry policy pro API volání
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  DELAYS: [0, 1000, 5000], // 0s, 1s, 5s
  RETRYABLE_ERRORS: ['RATE_LIMIT_EXCEEDED', 'NETWORK_ERROR', 'SERVER_ERROR']
} as const;

/**
 * Rate limiting (Ecomail API limits)
 */
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 100,
  BATCH_SIZE: 50,
  MIN_DELAY_MS: 600 // 100 req/min = 1 per 600ms
} as const;

// =====================================================
// SYNC QUEUE CONFIGURATION
// =====================================================

/**
 * Event types pro sync queue
 */
export const SYNC_EVENT_TYPES = {
  CONTACT_ADD: 'contact_add',
  CONTACT_UPDATE: 'contact_update',
  LIST_MOVE: 'list_move',
  TAG_ADD: 'tag_add',
  TAG_REMOVE: 'tag_remove',
  METRICS_UPDATE: 'metrics_update',
  TRIAL_ACTIVATED: 'trial_activated',
  TRIAL_EXPIRED: 'trial_expired',
  TARIFF_CHANGED: 'tariff_changed'
} as const;

/**
 * Sync queue status
 */
export const SYNC_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

// =====================================================
// KP CATEGORIES
// =====================================================

/**
 * KP category ranges (pro UI a messaging)
 */
export const KP_CATEGORIES = {
  NOT_MEASURED: { min: null, max: null, label: 'Neměřeno', color: 'gray' },
  CRITICAL: { min: 0, max: 10, label: 'Kritický', color: 'red' },
  POOR: { min: 11, max: 20, label: 'Slabý', color: 'orange' },
  AVERAGE: { min: 21, max: 30, label: 'Průměrný', color: 'yellow' },
  GOOD: { min: 31, max: 40, label: 'Dobrý', color: 'green' },
  EXCELLENT: { min: 41, max: Infinity, label: 'Výborný', color: 'blue' }
} as const;

// =====================================================
// ENGAGEMENT TIERS
// =====================================================

/**
 * Engagement tier thresholds
 */
export const ENGAGEMENT_TIERS = {
  NONE: { min: 0, max: 0, label: 'Žádná aktivita' },
  LOW: { min: 0.1, max: 4.9, label: 'Nízká aktivita' },
  MEDIUM: { min: 5, max: 19.9, label: 'Střední aktivita' },
  HIGH: { min: 20, max: Infinity, label: 'Vysoká aktivita' }
} as const;

// =====================================================
// ERROR CODES
// =====================================================

/**
 * Ecomail API error codes
 */
export const ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  CONTACT_EXISTS: 'CONTACT_EXISTS',
  INVALID_EMAIL: 'INVALID_EMAIL',
  LIST_NOT_FOUND: 'LIST_NOT_FOUND',
  TAG_NOT_FOUND: 'TAG_NOT_FOUND',
  FIELD_NOT_FOUND: 'FIELD_NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get list ID based on environment
 */
export function getListId(listName: keyof typeof ECOMAIL_LISTS): string {
  const env = import.meta.env.MODE === 'production' ? 'PROD' : 'DEV';
  return ECOMAIL_LIST_IDS[env][listName];
}

/**
 * Check if error should be retried
 */
export function shouldRetryError(errorCode: string): boolean {
  return RETRY_CONFIG.RETRYABLE_ERRORS.includes(errorCode);
}

/**
 * Calculate delay for retry attempt
 */
export function getRetryDelay(attempt: number): number {
  return RETRY_CONFIG.DELAYS[Math.min(attempt, RETRY_CONFIG.DELAYS.length - 1)];
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
