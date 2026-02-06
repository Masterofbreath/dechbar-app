/**
 * AudioPlayer TypeScript Interfaces
 * 
 * Type definitions for DechBar Audio Player component system.
 * 
 * @package DechBar
 * @version 2.43.0
 */

/**
 * Track - Audio track metadata
 */
export interface Track {
  id: string;
  album_id: string | null;
  title: string;
  artist: string | null;
  album: string | null; // Legacy string field
  duration: number; // seconds
  audio_url: string; // Bunny CDN URL
  cover_url: string | null;
  duration_category: '3-9' | '10-25' | '26-60' | 'kurz' | 'reels' | null;
  mood_category: 'Ráno' | 'Energie' | 'Klid' | 'Soustředění' | 'Večer' | 'Special' | null;
  difficulty_level: 'easy' | 'medium' | 'hard' | 'extreme' | null; // Track difficulty
  kp_suitability: 'pod-10s' | '11s-20s' | '20s-30s' | 'nad-30s' | null; // Recommended for KP range
  media_type: 'audio' | 'video'; // Content type
  exercise_format: 'dechpresso' | 'meditace' | 'breathwork' | null; // Exercise type
  intensity_level: 'jemna' | 'stredni' | 'vysoka' | 'extremni' | null; // Physical intensity
  narration_type: 'pribeh' | 'bez-pribehu' | 'guided' | null; // Narration style
  tags: string[]; // ["Funkční probuzení", "Wim Hof"]
  description: string | null;
  track_order: number;
  waveform_peaks?: number[]; // Phase 2: [0.5, 0.7, ...] (80 values, 0-1 range)
  is_published: boolean;
  play_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Album - Playlist/Challenge/Course
 */
export interface Album {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  type: 'challenge' | 'course' | 'training' | 'decharna';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  is_locked: boolean;
  required_tier: 'FREE' | 'SMART' | 'AI_COACH';
  points: number;
  start_date: string | null; // ISO date (for challenges)
  end_date: string | null;
  day_count: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * TrackProgress - Real-time listening state
 */
export interface TrackProgress {
  id: string;
  user_id: string;
  track_id: string;
  album_id: string | null;
  listened_seconds: number; // Total unique seconds listened (80% calc)
  last_position: number; // Resume position (seconds)
  progress_percent: number; // 0.00 to 100.00
  last_played_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * TrackCompletion - Historical completion record (80% rule)
 */
export interface TrackCompletion {
  id: string;
  user_id: string;
  track_id: string;
  album_id: string | null;
  completion_count: number; // 1st, 2nd, 3rd listen...
  listen_time: number; // Actual seconds listened
  completed_at: string;
}

/**
 * TrackFavourite - User like
 */
export interface TrackFavourite {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
}

/**
 * ChallengeProgress - 21-day challenge state (strict sequence)
 */
export interface ChallengeProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_day: number; // 1 to 21
  last_completed_day: number; // 0 to 21
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * AudioPlayerProps - Main component props
 */
export interface AudioPlayerProps {
  trackId: string;
  mode?: 'fullscreen' | 'sticky';
  autoplay?: boolean;
  onComplete?: (trackId: string) => void;
  onClose?: () => void;
}

/**
 * AudioPlayerState - Zustand store interface
 */
export interface AudioPlayerState {
  // Current track
  currentTrack: Track | null;
  
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  mode: 'fullscreen' | 'sticky' | null;
  isExpanded: boolean; // Sticky player expanded?
  
  // Tracking (80% rule)
  listenedSegments: Array<[number, number]>; // [[start, end], ...]
  isCompleted: boolean;
  
  // Actions
  play: (track: Track) => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFavourite: () => Promise<void>;
  close: () => void;
  expandSticky: () => void;
  collapseToSticky: () => void;
  reset: () => void;
}

/**
 * WaveformProgressProps - Waveform component props
 */
export interface WaveformProgressProps {
  peaks: number[]; // 80 values (0-1 range)
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

/**
 * PlayPauseButtonProps - Play/Pause button props
 */
export interface PlayPauseButtonProps {
  isPlaying: boolean;
  isLoading?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

/**
 * VolumeControlProps - Volume control props
 */
export interface VolumeControlProps {
  volume: number; // 0 to 1
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onMuteToggle: () => void;
  variant?: 'slider' | 'button'; // slider (desktop), button (mobile)
}

/**
 * TimeDisplayProps - Time display props
 */
export interface TimeDisplayProps {
  current: number; // seconds
  total: number; // seconds
  variant?: 'default' | 'compact';
}

/**
 * FavouriteButtonProps - Favourite button props
 */
export interface FavouriteButtonProps {
  trackId: string;
  isFavourite?: boolean;
  onToggle?: (isFavourite: boolean) => void;
}
