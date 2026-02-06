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
