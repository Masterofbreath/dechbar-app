/**
 * Ecomail TypeScript Types
 * 
 * Type definitions pro Ecomail API integraci.
 * See: docs/marketing/ECOMAIL_TAXONOMY.md pro complete taxonomy
 * 
 * @package DechBar_App
 * @subpackage Platform/API
 */

// =====================================================
// CORE TYPES
// =====================================================

export interface EcomailContact {
  email: string;
  name?: string;
  surname?: string;
  vokativ?: string; // Czech vocative form
  custom_fields?: Partial<CustomFields>;
  tags?: EcomailTag[];
}

export interface EcomailList {
  id: string;
  name: string;
  description?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export class EcomailApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'EcomailApiError';
  }
}

// =====================================================
// TAGS (see ECOMAIL_TAXONOMY.md)
// =====================================================

export type EcomailTag = 
  // Lifecycle
  | 'MAGIC_LINK_SENT'
  | 'MAGIC_LINK_CLICKED'
  | 'ONBOARDING_COMPLETE'
  | 'PASSWORD_SET'
  | 'PROFILE_COMPLETE'
  
  // KP Categories
  | 'KP_NOT_MEASURED'
  | 'KP_CRITICAL'
  | 'KP_POOR'
  | 'KP_AVERAGE'
  | 'KP_GOOD'
  | 'KP_EXCELLENT'
  
  // Engagement
  | 'ENGAGEMENT_NONE'
  | 'ENGAGEMENT_LOW'
  | 'ENGAGEMENT_MEDIUM'
  | 'ENGAGEMENT_HIGH'
  
  // Tariffs
  | 'TARIF_ZDARMA'
  | 'TARIF_SMART'
  | 'TARIF_AI_COACH'
  
  // Trial
  | 'TRIAL_ELIGIBLE'
  | 'TRIAL_ACTIVE'
  | 'TRIAL_EXPIRED'
  
  // Roles
  | 'ROLE_USER'
  | 'ROLE_ADMIN'
  | 'ROLE_TESTER'
  | 'ROLE_INFLUENCER'
  
  // Symptoms (30+)
  | 'SYMPTOM_ASTHMA'
  | 'SYMPTOM_ANXIETY'
  | 'SYMPTOM_PANIC_ATTACKS'
  | 'SYMPTOM_SLEEP_ISSUES'
  | 'SYMPTOM_STRESS'
  | 'SYMPTOM_HIGH_BP'
  | 'SYMPTOM_COPD'
  | 'SYMPTOM_LONG_COVID'
  | 'SYMPTOM_APNEA'
  | 'SYMPTOM_ALLERGIES'
  | 'SYMPTOM_HYPERVENTILATION'
  | 'SYMPTOM_FATIGUE'
  | 'SYMPTOM_CONCENTRATION'
  | 'SYMPTOM_ANGER'
  | 'SYMPTOM_DEPRESSION'
  | 'SYMPTOM_SNORING'
  | 'SYMPTOM_MIGRAINE'
  | 'SYMPTOM_DIGESTIVE'
  | 'SYMPTOM_HEART_RATE'
  | 'SYMPTOM_PERFORMANCE'
  | 'SYMPTOM_OTHER'
  
  // Health Restrictions
  | 'HEALTH_PREGNANCY'
  | 'HEALTH_HEART_CONDITION'
  | 'HEALTH_EPILEPSY'
  
  // Motivations
  | 'MOTIVATION_HEALTH'
  | 'MOTIVATION_STRESS'
  | 'MOTIVATION_SLEEP'
  | 'MOTIVATION_PERFORMANCE'
  | 'MOTIVATION_RELAXATION'
  | 'MOTIVATION_LUNG_CAPACITY'
  | 'MOTIVATION_CURIOSITY'
  
  // Conversion Sources
  | 'SOURCE_HERO_CTA'
  | 'SOURCE_MOCKUP_KP'
  | 'SOURCE_MOCKUP_PROTOCOLS'
  | 'SOURCE_MOCKUP_EXERCISES'
  | 'SOURCE_FOOTER_CTA'
  | 'SOURCE_INSTAGRAM'
  | 'SOURCE_FACEBOOK'
  | 'SOURCE_GOOGLE'
  | 'SOURCE_ORGANIC'
  | 'SOURCE_REFERRAL'
  
  // Behavioral
  | 'BEHAVIOR_DAILY_USER'
  | 'BEHAVIOR_WEEKLY_USER'
  | 'BEHAVIOR_OCCASIONAL'
  | 'BEHAVIOR_INACTIVE'
  | 'BEHAVIOR_WEEKEND_WARRIOR'
  | 'BEHAVIOR_MORNING_PERSON'
  | 'BEHAVIOR_NIGHT_OWL'
  
  // Challenge
  | 'CHALLENGE_REGISTERED'
  | 'CHALLENGE_DAY_1'
  | 'CHALLENGE_DAY_7'
  | 'CHALLENGE_DAY_14'
  | 'CHALLENGE_COMPLETED'
  | 'CHALLENGE_DROPOUT_EARLY'
  | 'CHALLENGE_DROPOUT_LATE'
  
  // Studio Level
  | 'STUDIO_BEGINNER'
  | 'STUDIO_INTERMEDIATE'
  | 'STUDIO_ADVANCED'
  | 'STUDIO_MASTER'
  ;

// =====================================================
// CUSTOM FIELDS (25 fields)
// =====================================================

export interface CustomFields {
  // Profile
  FNAME: string;
  REGISTRATION_DATE: string; // YYYY-MM-DD
  CONVERSION_SOURCE: string;
  REFERRAL_CODE: string;
  
  // KP Metrics
  KP_VALUE: number;
  KP_FIRST: number;
  KP_IMPROVEMENT: number;
  KP_MEASURED_AT: string; // YYYY-MM-DD
  
  // Engagement
  HOURS_BREATHED: number;
  EXERCISES_COMPLETED: number;
  LAST_EXERCISE_DATE: string; // YYYY-MM-DD
  DAYS_ACTIVE: number;
  LONGEST_STREAK: number;
  CURRENT_STREAK: number;
  
  // Studio
  STUDIO_LEVEL: number;
  STUDIO_EXPERIENCE: number;
  
  // Challenge
  CHALLENGE_STATUS: 'registered' | 'onboarded' | 'active' | 'completed';
  CHALLENGE_START_DATE: string; // YYYY-MM-DD
  CHALLENGE_COMPLETION_PCT: number;
  CHALLENGE_DAYS_COMPLETED: number;
  
  // Business
  TARIFF: 'ZDARMA' | 'SMART' | 'AI_COACH';
  TARIFF_START_DATE: string; // YYYY-MM-DD
  TRIAL_END_DATE: string; // YYYY-MM-DD
  LIFETIME_VALUE_CZK: number;
}

// =====================================================
// WEBHOOK TYPES
// =====================================================

export interface EcomailWebhook {
  event: 'unsubscribed' | 'bounced' | 'clicked' | 'opened';
  email: string;
  campaign_id?: string;
  list_id?: string;
  timestamp: string;
  reason?: string; // For bounces/unsubscribes
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface AddContactRequest {
  subscriber_data: EcomailContact;
  trigger_autoresponders?: boolean;
  update_existing?: boolean;
  resubscribe?: boolean;
}

export interface BulkAddContactsRequest {
  subscribers: EcomailContact[];
  trigger_autoresponders?: boolean;
  update_existing?: boolean;
}

export interface BulkAddContactsResponse {
  added: number;
  updated: number;
  failed: number;
}

export interface TagOperation {
  email: string;
  tag: EcomailTag;
  action: 'add' | 'remove';
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * KP category helper
 */
export function categorizeKP(kpValue: number | null): EcomailTag {
  if (kpValue === null) return 'KP_NOT_MEASURED';
  if (kpValue <= 10) return 'KP_CRITICAL';
  if (kpValue <= 20) return 'KP_POOR';
  if (kpValue <= 30) return 'KP_AVERAGE';
  if (kpValue <= 40) return 'KP_GOOD';
  return 'KP_EXCELLENT';
}

/**
 * Engagement tier helper
 */
export function categorizeEngagement(hoursBreathed: number): EcomailTag {
  if (hoursBreathed === 0) return 'ENGAGEMENT_NONE';
  if (hoursBreathed < 5) return 'ENGAGEMENT_LOW';
  if (hoursBreathed < 20) return 'ENGAGEMENT_MEDIUM';
  return 'ENGAGEMENT_HIGH';
}

/**
 * Studio level helper
 */
export function categorizeStudioLevel(level: number): EcomailTag {
  if (level <= 5) return 'STUDIO_BEGINNER';
  if (level <= 10) return 'STUDIO_INTERMEDIATE';
  if (level <= 20) return 'STUDIO_ADVANCED';
  return 'STUDIO_MASTER';
}

/**
 * Tariff tag helper
 */
export function getTariffTag(tariff: string): EcomailTag {
  switch (tariff.toUpperCase()) {
    case 'SMART':
      return 'TARIF_SMART';
    case 'AI_COACH':
      return 'TARIF_AI_COACH';
    default:
      return 'TARIF_ZDARMA';
  }
}
