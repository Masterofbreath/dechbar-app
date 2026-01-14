/**
 * Application Constants
 * 
 * Static configuration values that don't change at runtime.
 * DO NOT store pricing here - pricing is in database!
 */

export const APP_CONFIG = {
  // Application info
  name: 'DechBar',
  fullName: 'DechBar App',
  version: '0.1.0',
  description: 'Breathing exercises for wellness',

  // URLs
  urls: {
    website: 'https://dechbar.cz',
    support: 'mailto:podpora@dechbar.cz',
    privacy: 'https://dechbar.cz/privacy',
    terms: 'https://dechbar.cz/terms',
  },

  // Module IDs (technical identifiers, never change)
  modules: {
    STUDIO: 'studio',
    CHALLENGES: 'challenges',
    AKADEMIE: 'akademie',
    GAME: 'game',
    AI_COACH: 'ai-coach',
  } as const,

  // Membership Plans (technical identifiers)
  memberships: {
    FREE: 'ZDARMA',
    SMART: 'SMART',
    AI_COACH: 'AI_COACH',
  } as const,

  // User Roles (technical identifiers)
  roles: {
    MEMBER: 'member',
    VIP_MEMBER: 'vip_member',
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    CEO: 'ceo',
  } as const,

  // UI Configuration
  ui: {
    // Exercise constraints
    exercise: {
      minDuration: 1, // seconds
      maxDuration: 3600, // seconds (1 hour)
      minBreathLength: 1, // seconds
      maxBreathLength: 60, // seconds
    },

    // Pagination
    itemsPerPage: 20,
    
    // Debounce delays
    searchDebounce: 300, // ms
    autosaveDebounce: 1000, // ms
  },

  // Feature Flags
  features: {
    bluetoothEnabled: false, // Coming in v2.0
    aiCoachBeta: true,
    socialSharing: false, // Coming later
    offlineMode: false, // Coming later
  },

  // Defaults
  defaults: {
    locale: 'cs-CZ',
    currency: 'CZK',
    timezone: 'Europe/Prague',
  },

  // External Services
  services: {
    ecomailListId: '1', // Replace with actual list ID
    vyfakturujTemplateId: '1', // Replace with template ID
  },
} as const;

/**
 * Type-safe module ID
 */
export type ModuleId = typeof APP_CONFIG.modules[keyof typeof APP_CONFIG.modules];

/**
 * Type-safe membership plan
 */
export type MembershipPlan = typeof APP_CONFIG.memberships[keyof typeof APP_CONFIG.memberships];

/**
 * Type-safe role
 */
export type Role = typeof APP_CONFIG.roles[keyof typeof APP_CONFIG.roles];
