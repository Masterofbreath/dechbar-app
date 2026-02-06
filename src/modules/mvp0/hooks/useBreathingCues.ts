/**
 * useBreathingCues - Audio Cues Management
 * 
 * Manages playback of solfeggio frequency audio cues and bells.
 * Handles caching, preloading, and fallbacks.
 * 
 * @example
 * const breathingCues = useBreathingCues();
 * await breathingCues.preloadAll(); // During countdown
 * await breathingCues.playCue('inhale'); // On phase change
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { getCachedAudioFile, cacheAudioFile } from '../utils/audioCache';
import type { BreathingPhaseAudio } from '../types/audio';

const CDN_BASE = 'https://cdn.dechbar.cz/audio';

const CUES = {
  inhale: `${CDN_BASE}/cues/inhale-963hz.aac`,
  hold: `${CDN_BASE}/cues/hold-639hz.aac`,
  exhale: `${CDN_BASE}/cues/exhale-396hz.aac`,
};

const BELLS = {
  start: `${CDN_BASE}/bells/start-bell.aac`,
  end: `${CDN_BASE}/bells/end-bell.aac`,
};

// Fallback to existing bell sound if CDN fails
const FALLBACK_BELL = '/sounds/bell.mp3';

interface BreathingCuesAPI {
  /**
   * Play audio cue for breathing phase
   */
  playCue: (phase: BreathingPhaseAudio) => Promise<void>;
  
  /**
   * Play bell sound (start or end)
   */
  playBell: (type: 'start' | 'end') => Promise<void>;
  
  /**
   * Preload all audio files (call during countdown)
   */
  preloadAll: () => Promise<void>;
  
  /**
   * Whether audio is ready to play
   */
  isReady: boolean;
}

/**
 * Hook to manage breathing audio cues
 */
export function useBreathingCues(): BreathingCuesAPI {
  const { audioCuesEnabled, audioCueVolume, bellsEnabled } = useSessionSettings();
  const [isReady, setIsReady] = useState(false);
  
  // Audio element refs
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  /**
   * Get or create audio element
   */
  const getAudioElement = useCallback((url: string): HTMLAudioElement => {
    let audio = audioRefs.current.get(url);
    
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRefs.current.set(url, audio);
    }
    
    return audio;
  }, []);
  
  /**
   * Load audio from cache or CDN
   */
  const loadAudio = useCallback(async (url: string): Promise<string> => {
    try {
      // Check cache first
      const cached = await getCachedAudioFile(url);
      
      if (cached) {
        // Use cached blob
        return URL.createObjectURL(cached.blob);
      }
      
      // Download from CDN
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Cache for offline use
      await cacheAudioFile(url, blob);
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`[BreathingCues] Failed to load ${url}:`, error);
      // Return original URL as fallback (will stream if network available)
      return url;
    }
  }, []);
  
  /**
   * Preload all audio files
   */
  const preloadAll = useCallback(async () => {
    try {
      console.log('[BreathingCues] Preloading audio...');
      
      const urls = [
        ...Object.values(CUES),
        ...Object.values(BELLS),
      ];
      
      const loadPromises = urls.map(async (url) => {
        const audioUrl = await loadAudio(url);
        const audio = getAudioElement(url);
        audio.src = audioUrl;
        audio.volume = audioCueVolume;
        
        // Wait for canplaythrough
        return new Promise<void>((resolve) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.load();
        });
      });
      
      await Promise.all(loadPromises);
      
      setIsReady(true);
      console.log('[BreathingCues] Preload complete');
    } catch (error) {
      console.error('[BreathingCues] Preload error:', error);
      // Still set ready to allow playback attempts
      setIsReady(true);
    }
  }, [loadAudio, getAudioElement, audioCueVolume]);
  
  /**
   * Play audio cue for breathing phase
   */
  const playCue = useCallback(async (phase: BreathingPhaseAudio) => {
    if (!audioCuesEnabled) {
      return;
    }
    
    try {
      const url = CUES[phase];
      const audio = getAudioElement(url);
      audio.volume = audioCueVolume;
      audio.currentTime = 0;
      
      await audio.play();
      console.log(`[BreathingCues] Played: ${phase}`);
    } catch (error) {
      console.error(`[BreathingCues] Play error (${phase}):`, error);
    }
  }, [audioCuesEnabled, audioCueVolume, getAudioElement]);
  
  /**
   * Play bell sound
   */
  const playBell = useCallback(async (type: 'start' | 'end') => {
    if (!bellsEnabled) {
      return;
    }
    
    try {
      const url = BELLS[type];
      let audio = getAudioElement(url);
      
      // If CDN bell not loaded, try fallback
      if (!audio.src || audio.error) {
        audio = getAudioElement(FALLBACK_BELL);
        if (!audio.src) {
          audio.src = FALLBACK_BELL;
        }
      }
      
      audio.volume = audioCueVolume;
      audio.currentTime = 0;
      
      await audio.play();
      console.log(`[BreathingCues] Bell: ${type}`);
    } catch (error) {
      console.error(`[BreathingCues] Bell error (${type}):`, error);
    }
  }, [bellsEnabled, audioCueVolume, getAudioElement]);
  
  // Update volume when settings change
  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.volume = audioCueVolume;
    });
  }, [audioCueVolume]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRefs.current.forEach((audio) => {
        audio.pause();
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      });
      audioRefs.current.clear();
    };
  }, []);
  
  return {
    playCue,
    playBell,
    preloadAll,
    isReady,
  };
}
