/**
 * Platform API
 * 
 * Centralized exports for all platform API utilities
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

// Supabase client
export { supabase, isAuthenticated, getCurrentUser } from './supabase';

// Public stats for landing page
export { usePublicStats } from './usePublicStats';
export type { PublicStats } from './usePublicStats';

// KP Measurements API
export { useKPMeasurements } from './useKPMeasurements';
export type { KPMeasurement, KPStats, SaveKPData } from './useKPMeasurements';

// Challenge API (Březnová Výzva 2026)
export {
  sendChallengeMagicLink,
  checkChallengeAccess,
  isRegisteredForChallenge,
  getChallengeRegistration
} from './challenge';
export type {
  ChallengeMagicLinkResponse,
  ChallengeAccessStatus
} from './challenge';

// Onboarding API (Challenge Registration)
export {
  completeChallengeOnboarding,
  getOnboardingMetadata,
  canStillRegister,
  getDaysUntilDeadline
} from './onboarding';
export type {
  CompleteChallengeOnboardingData,
  CompleteChallengeOnboardingResponse
} from './onboarding';

// Ecomail API (Marketing Automation)
export {
  addContact,
  updateContact,
  addTag,
  removeTag,
  moveList,
  bulkAddContacts,
  bulkUpdateTags,
  getSyncQueueStatus,
  getPendingSyncCount,
  queueMetricsUpdate
} from './ecomail';
export type {
  EcomailContact,
  EcomailTag,
  EcomailList,
  ApiResponse,
  EcomailApiError,
  CustomFields,
  TagOperation,
  EcomailWebhook
} from './ecomail.types';
export {
  categorizeKP,
  categorizeEngagement,
  categorizeStudioLevel,
  getTariffTag
} from './ecomail.types';
export {
  ECOMAIL_LISTS,
  SYNC_EVENT_TYPES,
  KP_CATEGORIES,
  ENGAGEMENT_TIERS
} from './ecomail.constants';
