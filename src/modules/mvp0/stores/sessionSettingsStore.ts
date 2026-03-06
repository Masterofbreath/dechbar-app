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
import type { SmartDurationMode } from '../types/exercises';

interface SessionSettingsStore extends SessionSettings {
  // Actions - Audio Cues
  setAudioCuesEnabled: (enabled: boolean) => void;
  setAudioCueVolume: (volume: number) => void;
  setSelectedCueSoundPack: (pack: string) => void;
  
  // Actions - Haptics
  setHapticsEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: HapticIntensity) => void;
  setHapticAdaptive: (adaptive: boolean) => void;
  
  // Actions - Background Music
  setBackgroundMusicEnabled: (enabled: boolean) => void;
  setSelectedTrack: (slug: string | null) => void;
  setBackgroundMusicRandomEnabled: (enabled: boolean) => void;
  setBackgroundMusicVolume: (volume: number) => void;
  
  // Actions - Bells
  setBellsEnabled: (enabled: boolean) => void;
  
  // Actions - Walking Mode
  setWalkingMode: (enabled: boolean) => void;

  // Actions - Wake Lock
  setKeepScreenOn: (enabled: boolean) => void;

  // Actions - Vocal Guidance
  setVocalGuidanceEnabled: (enabled: boolean) => void;
  setSelectedVoicePack: (id: string | null) => void;
  setVocalVolume: (volume: number) => void;

  // Actions - SMART CVIČENÍ
  setSmartDurationMode: (mode: SmartDurationMode) => void;
  setSmartAudioPack: (pack: string | null) => void;
  setSmartMusicEnabled: (enabled: boolean) => void;
  setSmartMusicSlug: (slug: string | null) => void;
  setSmartMusicRandomEnabled: (enabled: boolean) => void;
  setSmartMusicVolume: (volume: number) => void;
  setSmartBellsEnabled: (enabled: boolean) => void;
  setSmartCuesEnabled: (enabled: boolean) => void;
  setSmartCueVolume: (volume: number) => void;
  setSmartCueSoundSlug: (slug: string) => void;
  setSmartCueSoundVariant: (variant: string | null) => void;
  setCueSoundSlug: (slug: string) => void;
  setCueSoundVariant: (variant: string | null) => void;

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
      setSelectedCueSoundPack: (pack) => set({ selectedCueSoundPack: pack }),
      
      // Haptics
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setHapticIntensity: (intensity) => set({ hapticIntensity: intensity }),
      setHapticAdaptive: (adaptive) => set({ hapticAdaptive: adaptive }),
      
      // Background Music
      setBackgroundMusicEnabled: (enabled) => set({ backgroundMusicEnabled: enabled }),
      setSelectedTrack: (slug) => set({ selectedTrackSlug: slug }),
      setBackgroundMusicRandomEnabled: (enabled) => set({ backgroundMusicRandomEnabled: enabled }),
      setBackgroundMusicVolume: (volume) => set({ backgroundMusicVolume: Math.max(0, Math.min(1, volume)) }),
      
      // Bells
      setBellsEnabled: (enabled) => set({ bellsEnabled: enabled }),
      
      // Walking Mode
      setWalkingMode: (enabled) => set({ walkingModeEnabled: enabled }),

      // Wake Lock
      setKeepScreenOn: (enabled) => set({ keepScreenOn: enabled }),

      // Vocal Guidance
      setVocalGuidanceEnabled: (enabled) => set({ vocalGuidanceEnabled: enabled }),
      setSelectedVoicePack: (id) => set({ selectedVoicePackId: id }),
      setVocalVolume: (volume) => set({ vocalVolume: Math.max(0, Math.min(1, volume)) }),

      // SMART CVIČENÍ
    setSmartDurationMode: (mode) => set({ smartDurationMode: mode }),
    setSmartAudioPack: (pack) => set({ smartAudioPack: pack }),
    setSmartMusicEnabled: (enabled) => set({ smartMusicEnabled: enabled }),
    setSmartMusicSlug: (slug) => set({ smartMusicSlug: slug }),
    setSmartMusicRandomEnabled: (enabled) => set({ smartMusicRandomEnabled: enabled }),
    setSmartMusicVolume: (volume) => set({ smartMusicVolume: volume }),
    setSmartBellsEnabled: (enabled) => set({ smartBellsEnabled: enabled }),
    setSmartCuesEnabled: (enabled) => set({ smartCuesEnabled: enabled }),
    setSmartCueVolume: (volume) => set({ smartCueVolume: volume }),
    setSmartCueSoundSlug: (slug) => set({ smartCueSoundSlug: slug }),
    setSmartCueSoundVariant: (variant) => set({ smartCueSoundVariant: variant }),
    setCueSoundSlug: (slug) => set({ cueSoundSlug: slug }),
    setCueSoundVariant: (variant) => set({ cueSoundVariant: variant }),

      // Reset
      reset: () => set(DEFAULT_SESSION_SETTINGS),
    }),
    {
      name: 'dechbar-session-settings',
    }
  )
);
