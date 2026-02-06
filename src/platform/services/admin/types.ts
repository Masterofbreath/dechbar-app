/**
 * Admin API Types
 * 
 * Type definitions for admin API operations (tracks, albums, playlists).
 * 
 * @package DechBar_App
 * @subpackage Platform/Services/Admin
 * @since 2.44.0
 */

export interface TrackInput {
  title: string;
  album_id: string | null;
  duration: number;
  audio_url: string;
  cover_url: string | null;
  category: string | null;
  tags: string[];
  description: string | null;
  track_order: number;
  waveform_peaks?: number[];
}

export interface TrackFilters {
  category?: string;
  album_id?: string;
  search?: string;
}
