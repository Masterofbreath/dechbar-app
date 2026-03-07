/**
 * Admin API Types
 * 
 * Type definitions for admin API operations (tracks, albums, playlists).
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 * @since 2.44.0
 */

export interface AlbumInput {
  name: string;
  description?: string | null;
  cover_url?: string | null;
  type: 'challenge' | 'course' | 'training' | 'decharna';
  difficulty?: 'easy' | 'medium' | 'hard' | 'extreme';
  is_locked?: boolean;
  required_tier?: 'FREE' | 'SMART' | 'AI_COACH';
  points?: number;
  start_date?: string | null;
  end_date?: string | null;
  day_count?: number | null;
}

export interface AlbumFilters {
  type?: string;
  difficulty?: string;
  is_locked?: boolean;
  search?: string;
}

export interface TrackInput {
  title: string;
  album_id?: string | null;
  artist?: string | null;
  album?: string | null;
  duration: number;
  audio_url: string;
  cover_url?: string | null;
  duration_category?: '3-9' | '10-25' | '26-60' | 'kurz' | 'reels' | null;
  mood_category?: 'Ráno' | 'Energie' | 'Klid' | 'Soustředění' | 'Večer' | 'Special' | null;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'extreme' | null;
  kp_suitability?: 'pod-10s' | '11s-20s' | '20s-30s' | 'nad-30s' | null;
  media_type?: 'audio' | 'video';
  exercise_format?: 'dechpresso' | 'meditace' | 'breathwork' | null;
  intensity_level?: 'jemna' | 'stredni' | 'vysoka' | 'extremni' | null;
  narration_type?: 'pribeh' | 'bez-pribehu' | 'guided' | null;
  tags?: string[];
  description?: string | null;
  track_order?: number;
  waveform_peaks?: number[];
  is_published?: boolean;
}

export interface TrackFilters {
  duration_category?: string;
  mood_category?: string;
  difficulty_level?: string;
  kp_suitability?: string;
  media_type?: string;
  exercise_format?: string;
  intensity_level?: string;
  narration_type?: string;
  album_id?: string;
  is_published?: boolean;
  search?: string;
}

// ============================================================
// AKADEMIE ADMIN TYPES
// ============================================================

export interface AkademieCategoryInput {
  name: string;
  slug: string;
  icon?: string;
  description: string;
  description_long?: string;
  cover_image_url?: string;
  sort_order: number;
  is_active: boolean;
  required_module_id?: string;
}

export interface AkademieCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  description_long: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  required_module_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AkademieProgramInput {
  /** Slouží jako module_id v modules tabulce */
  slug: string;
  name: string;
  description?: string;
  description_long?: string;
  price_czk: number;
  cover_image_url?: string;
  duration_days?: number;
  daily_minutes?: number;
  launch_date?: string;
  is_published: boolean;
  category_id: string;
}

export interface AkademieProgram {
  id: string;
  module_id: string;
  category_id: string;
  description_long: string | null;
  cover_image_url: string | null;
  sort_order: number;
  duration_days: number | null;
  daily_minutes: number | null;
  launch_date: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  /** JOIN: module name + price */
  module_name?: string;
  module_price_czk?: number;
  module_stripe_price_id?: string | null;
  module_ecomail_list_in?: string | null;
  module_ecomail_list_before?: string | null;
  category_name?: string;
}

export interface AkademieSeriesInput {
  module_id: string;
  name: string;
  week_number: number;
  description?: string;
  sort_order: number;
}

export interface AkademieSeries {
  id: string;
  module_id: string;
  series_module_id: string | null;
  name: string;
  description: string | null;
  week_number: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AkademieLessonInput {
  series_id: string;
  module_id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  day_number: number;
  sort_order: number;
  is_published?: boolean;
  /** Primární dechová technika — čte SMART CVIČENÍ algoritmus */
  primary_technique?: string | null;
  /** Sekundární dechová technika (volitelná, bez CHECK constraintu) */
  secondary_technique?: string | null;
}

export interface AkademieLesson {
  id: string;
  series_id: string;
  module_id: string;
  title: string;
  audio_url: string;
  duration_seconds: number;
  day_number: number;
  sort_order: number;
  is_published: boolean;
  /** Primární dechová technika — čte SMART CVIČENÍ algoritmus */
  primary_technique: string | null;
  /** Sekundární dechová technika (volitelná, rozšiřitelná) */
  secondary_technique: string | null;
  created_at: string;
  updated_at: string;
}

export interface AkademieProgramModuleUpdate {
  name?: string;
  price_czk?: number;
}

export interface FeaturedProgramRecord {
  id: string;
  module_id: string;
  title_override: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface AkademieProgramCreateResult {
  moduleId: string;
  programId: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  ecmailListInId?: string | null;
  ecmailListBeforeId?: string | null;
  stripeError?: string | null;
  ecmailError?: string | null;
}

// ============================================================
// EXERCISES & PROTOCOLS ADMIN TYPES
// ============================================================

export interface BackgroundTrackInput {
  name: string;
  slug: string;
  category: string; // slug z background_categories
  description?: string | null;
  cdn_url: string;
  duration_seconds?: number;
  file_size_bytes?: number | null;
  required_tier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  is_active?: boolean;
  sort_order?: number;
}

export interface BackgroundCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackgroundCategoryInput {
  slug: string;
  name: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface BreathingCueUpdate {
  cdn_url?: string | null;
  generate_hz?: number | null;
  playback_rate?: number;
  duration_ms?: number | null;
  is_active?: boolean;
}

export interface BreathingCueRecord {
  id: string;
  phase: 'inhale' | 'hold' | 'exhale' | 'start_bell' | 'end_bell';
  name: string;
  cdn_url: string | null;
  generate_hz: number | null;
  playback_rate: number;
  duration_ms: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeriesInput {
  id?: string;
  name: string;
  week_number: number;
  description?: string;
  sort_order: number;
}

export interface LessonInput {
  id?: string;
  title: string;
  day_number: number;
  audio_file?: File;
  audio_url?: string;
  duration_seconds?: number;
  sort_order: number;
}

export interface ProgramWizardState {
  step: 1 | 2 | 3 | 4 | 'summary';
  category: {
    existingCategoryId?: string;
    name?: string;
    slug?: string;
    description?: string;
    description_long?: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
    required_module_id?: string;
    cover_image_url?: string;
  };
  program: {
    name: string;
    slug: string;
    description: string;
    description_long?: string;
    price_czk: number;
    cover_image_file?: File;
    cover_image_url?: string;
    duration_days?: number;
    daily_minutes?: number;
    launch_date?: string;
    is_published: boolean;
    /** Set after successful creation */
    created_module_id?: string;
    stripe_product_id?: string;
    stripe_price_id?: string;
    ecomail_list_in_id?: string;
    ecomail_list_before_id?: string;
    /** Set if Stripe/Ecomail failed during creation */
    stripeError?: string | null;
    ecmailError?: string | null;
  };
  series: SeriesInput[];
  /** Key = series index in `series` array */
  lessons: Record<number, LessonInput[]>;
}
