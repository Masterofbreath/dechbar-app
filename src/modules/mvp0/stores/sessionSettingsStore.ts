/**
 * Session Settings Store - Audio & Haptics Settings
 * 
 * Zustand store with persist middleware for user preferences.
 * Controls audio cues, haptics, background music, and walking mode.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Stores
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionSettings, HapticIntensity } from '../types/audio';
import { DEFAULT_SESSION_SETTINGS } from '../types/audio';

interface SessionSettingsStore extends SessionSettings {
  // Actions - Audio Cues
  setAudioCuesEnabled: (enabled: boolean) => void;
  setAudioCueVolume: (volume: number) => void;
  
  // Actions - Haptics
  setHapticsEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: HapticIntensity) => void;
  setHapticAdaptive: (adaptive: boolean) => void;
  
  // Actions - Background Music
  setBackgroundMusicEnabled: (enabled: boolean) => void;
  setSelectedTrack: (slug: string | null) => void;
  setBackgroundMusicVolume: (volume: number) => void;
  
  // Actions - Bells
  setBellsEnabled: (enabled: boolean) => void;
  
  // Actions - Walking Mode
  setWalkingMode: (enabled: boolean) => void;
  
  // Reset to defaults
  reset: () => void;
}

export const useSessionSettings = create<SessionSettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SESSION_SETTINGS,
      
      // Audio Cues
      setAudioCuesEnabled: (enabled) => set({ audioCuesEnabled: enabled }),
      setAudioCueVolume: (volume) => set({ audioCueVolume: Math.max(0, Math.min(1, volume)) }),
      
      // Haptics
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setHapticIntensity: (intensity) => set({ hapticIntensity: intensity }),
      setHapticAdaptive: (adaptive) => set({ hapticAdaptive: adaptive }),
      
      // Background Music
      setBackgroundMusicEnabled: (enabled) => set({ backgroundMusicEnabled: enabled }),
      setSelectedTrack: (slug) => set({ selectedTrackSlug: slug }),
      setBackgroundMusicVolume: (volume) => set({ backgroundMusicVolume: Math.max(0, Math.min(1, volume)) }),
      
      // Bells
      setBellsEnabled: (enabled) => set({ bellsEnabled: enabled }),
      
      // Walking Mode
      setWalkingMode: (enabled) => set({ walkingModeEnabled: enabled }),
      
      // Reset
      reset: () => set(DEFAULT_SESSION_SETTINGS),
    }),
    {
      name: 'dechbar-session-settings',
    }
  )
);
