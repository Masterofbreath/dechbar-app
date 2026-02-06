/**
 * audioPlayerStore - Zustand store for audio player global state
 * 
 * Global state management for audio player:
 * - Current track and playback state
 * - UI mode (fullscreen, sticky, expanded)
 * - 80% completion tracking (listened segments)
 * - Volume and mute state
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import { create } from 'zustand';
import type { AudioPlayerState, Track } from './types';

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  // Current track
  currentTrack: null,
  
  // Playback state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  isLoading: false,
  error: null,
  
  // UI state
  mode: null,
  isExpanded: false,
  
  // Tracking (80% rule)
  listenedSegments: [],
  isCompleted: false,
  
  // Actions
  play: async (track: Track) => {
    set({ 
      currentTrack: track,
      mode: 'fullscreen',
      isPlaying: true,
      isLoading: true,
      error: null,
    });
  },
  
  pause: () => {
    set({ isPlaying: false });
  },
  
  seek: (time: number) => {
    set({ currentTime: time });
  },
  
  setVolume: (vol: number) => {
    const clampedVol = Math.max(0, Math.min(vol, 1));
    set({ volume: clampedVol, isMuted: clampedVol === 0 });
  },
  
  toggleMute: () => {
    const state = get();
    if (state.isMuted) {
      // Unmute: restore previous volume
      set({ isMuted: false, volume: state.volume || 1 });
    } else {
      // Mute: set volume to 0
      set({ isMuted: true, volume: 0 });
    }
  },
  
  toggleFavourite: async () => {
    // TODO: Implement DB save (Day 2)
    // Will be implemented with FavouriteButton component
    console.log('toggleFavourite - TODO: Implement DB save');
  },
  
  close: () => {
    set({ 
      mode: null,
      isPlaying: false,
      isExpanded: false,
    });
  },
  
  expandSticky: () => {
    set({ isExpanded: true });
  },
  
  collapseToSticky: () => {
    set({ 
      mode: 'sticky',
      isExpanded: false,
    });
  },
  
  reset: () => {
    set({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      mode: null,
      isExpanded: false,
      listenedSegments: [],
      isCompleted: false,
      error: null,
    });
  },
}));
