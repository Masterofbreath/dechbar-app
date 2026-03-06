/**
 * Audio System Types - Session Engine Audio & Haptics
 * 
 * Type definitions for audio cues, haptics, background music, and settings.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Types
 */

// ==================== AUDIO CUES ====================

/**
 * Breathing phase for audio cue
 */
export type BreathingPhaseAudio = 'inhale' | 'hold' | 'exhale';

/**
 * Audio cue type
 */
export type AudioCueType = BreathingPhaseAudio | 'start' | 'end';

/**
 * Audio cue configuration
 */
export interface AudioCueConfig {
  type: AudioCueType;
  url: string;
  volume: number; // 0-1
  preload: boolean;
}

// ==================== HAPTICS ====================

/**
 * Haptic feedback intensity
 * @see Capacitor Haptics ImpactStyle
 */
export type HapticIntensity = 'off' | 'light' | 'medium' | 'heavy';

/**
 * Haptic pattern for breathing phase
 */
export interface HapticPattern {
  phase: BreathingPhaseAudio;
  style: 'light' | 'medium' | 'heavy'; // Capacitor ImpactStyle
  count: number; // Number of taps (1-3)
  interval?: number; // Interval between taps (ms)
}

// ==================== BACKGROUND MUSIC ====================

/**
 * Background track from database
 */
export interface BackgroundTrack {
  id: string;
  name: string;
  slug: string;
  category: string; // slug z background_categories (dynamické)
  description: string | null;
  duration_seconds: number;
  cdn_url: string;
  file_size_bytes: number | null;
  required_tier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  is_active: boolean;
  sort_order: number;
}

/**
 * Background music playback state
 */
export type MusicPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

// ==================== VOICE PACKS ====================

/**
 * Voice pack from database (vocal guidance)
 */
export interface VoicePack {
  id: string;
  name: string;
  author: string | null;
  language: string;
  voice_type: 'human' | 'ai';
  description: string | null;
  preview_url: string | null;
  required_tier: 'ZDARMA' | 'SMART' | 'AI_COACH';
  is_active: boolean;
  sort_order: number;
}

// ==================== SETTINGS ====================

/**
 * Session audio & haptics settings (Zustand store)
 */
export interface SessionSettings {
  // Audio Cues
  audioCuesEnabled: boolean;
  audioCueSound: 'solfeggio-963-639-396'; // Future: add more sound packs
  selectedCueSoundPack: string; // 'solfeggio' | 'tibetan-bowls' | 'birds' | ...
  audioCueVolume: number; // 0-1
  
  // Haptics
  hapticsEnabled: boolean;
  hapticIntensity: HapticIntensity;
  hapticAdaptive: boolean; // Adapt to exercise difficulty
  
  // Background Music
  backgroundMusicEnabled: boolean;
  selectedTrackSlug: string | null; // 'nature-forest', 'tibetan-bowls', etc.
  backgroundMusicRandomEnabled: boolean; // Náhodný výběr z aktivních tracků
  backgroundMusicVolume: number; // 0-1
  
  // Bells (Start/End)
  bellsEnabled: boolean;
  
  // Walking Mode
  walkingModeEnabled: boolean;

  // Wake Lock
  keepScreenOn: boolean;

  // Vocal Guidance
  vocalGuidanceEnabled: boolean;
  selectedVoicePackId: string | null;
  vocalVolume: number; // 0-1
}

/**
 * Default settings
 */
export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  audioCuesEnabled: true,
  audioCueSound: 'solfeggio-963-639-396',
  selectedCueSoundPack: 'solfeggio',
  audioCueVolume: 0.6,
  
  hapticsEnabled: true,
  hapticIntensity: 'medium',
  hapticAdaptive: false,
  
  backgroundMusicEnabled: false,
  selectedTrackSlug: null,
  backgroundMusicRandomEnabled: false,
  backgroundMusicVolume: 0.5,
  
  bellsEnabled: true,
  
  walkingModeEnabled: false,

  keepScreenOn: true,

  vocalGuidanceEnabled: true,
  selectedVoicePackId: null,
  vocalVolume: 0.7,
};

// ==================== CACHE ====================

/**
 * Cached audio file (IndexedDB)
 */
export interface CachedAudioFile {
  url: string;
  blob: Blob;
  cachedAt: number; // timestamp
  expiresAt: number | null; // null = never expires
  size: number; // bytes
}
