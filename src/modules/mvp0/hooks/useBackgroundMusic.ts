/**
 * useBackgroundMusic - Background Music Management
 * 
 * Manages playback of ambient background tracks during sessions.
 * Handles fetching from Supabase, caching, and perfect loop playback.
 * 
 * @example
 * const backgroundMusic = useBackgroundMusic();
 * await backgroundMusic.setTrack('nature-forest');
 * await backgroundMusic.play();
 * 
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { getCachedAudioFile, cacheAudioFile } from '../utils/audioCache';
import type { BackgroundTrack, MusicPlaybackState } from '../types/audio';

interface BackgroundMusicAPI {
  /**
   * Start playback
   */
  play: () => Promise<void>;
  
  /**
   * Pause playback
   */
  pause: () => void;
  
  /**
   * Stop playback and reset
   */
  stop: () => void;
  
  /**
   * Set track by slug
   */
  setTrack: (slug: string) => Promise<void>;
  
  /**
   * Fetch available tracks from database
   */
  fetchTracks: () => Promise<BackgroundTrack[]>;
  
  /**
   * Current playback state
   */
  state: MusicPlaybackState;
  
  /**
   * Currently loaded track
   */
  currentTrack: BackgroundTrack | null;
  
  /**
   * Available tracks
   */
  tracks: BackgroundTrack[];
}

/**
 * Hook to manage background music playback
 */
export function useBackgroundMusic(): BackgroundMusicAPI {
  const { backgroundMusicEnabled, backgroundMusicVolume, selectedTrackSlug } = useSessionSettings();
  const [state, setState] = useState<MusicPlaybackState>('idle');
  const [currentTrack, setCurrentTrack] = useState<BackgroundTrack | null>(null);
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  /**
   * Initialize audio element
   */
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true; // Perfect loop (no crossfade)
      audioRef.current.preload = 'auto';
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }
    };
  }, []);
  
  /**
   * Fetch available tracks from Supabase
   */
  const fetchTracks = useCallback(async (): Promise<BackgroundTrack[]> => {
    try {
      const { data, error } = await supabase
        .from('background_tracks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('[BackgroundMusic] Fetch error:', error);
        return [];
      }
      
      setTracks(data || []);
      return data || [];
    } catch (error) {
      console.error('[BackgroundMusic] Fetch exception:', error);
      return [];
    }
  }, []);
  
  /**
   * Load audio from cache or CDN
   */
  const loadAudio = useCallback(async (url: string): Promise<string> => {
    try {
      // Check cache first
      const cached = await getCachedAudioFile(url);
      
      if (cached) {
        console.log('[BackgroundMusic] Using cached audio');
        return URL.createObjectURL(cached.blob);
      }
      
      console.log('[BackgroundMusic] Downloading from CDN...');
      
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
      console.error(`[BackgroundMusic] Load error:`, error);
      // Return original URL as fallback (stream if network available)
      return url;
    }
  }, []);
  
  /**
   * Set track by slug
   */
  const setTrack = useCallback(async (slug: string) => {
    try {
      setState('loading');
      
      // Find track in local cache or fetch
      let track = tracks.find(t => t.slug === slug);
      
      if (!track) {
        const allTracks = await fetchTracks();
        track = allTracks.find(t => t.slug === slug);
      }
      
      if (!track) {
        console.error('[BackgroundMusic] Track not found:', slug);
        setState('error');
        return;
      }
      
      setCurrentTrack(track);
      
      // Load audio
      const audioUrl = await loadAudio(track.cdn_url);
      
      if (audioRef.current) {
        // Cleanup old src if blob
        if (audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        
        audioRef.current.src = audioUrl;
        audioRef.current.volume = backgroundMusicVolume;
        audioRef.current.load();
        
        setState('idle');
        console.log('[BackgroundMusic] Track loaded:', track.name);
      }
    } catch (error) {
      console.error('[BackgroundMusic] SetTrack error:', error);
      setState('error');
    }
  }, [tracks, fetchTracks, loadAudio, backgroundMusicVolume]);
  
  /**
   * Play background music
   */
  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) {
      console.warn('[BackgroundMusic] No track loaded');
      return;
    }
    
    try {
      setState('playing');
      await audioRef.current.play();
      console.log('[BackgroundMusic] Playing:', currentTrack.name);
    } catch (error) {
      console.error('[BackgroundMusic] Play error:', error);
      setState('error');
    }
  }, [currentTrack]);
  
  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState('paused');
      console.log('[BackgroundMusic] Paused');
    }
  }, []);
  
  /**
   * Stop and reset
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState('idle');
      console.log('[BackgroundMusic] Stopped');
    }
  }, []);
  
  // Update volume when settings change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = backgroundMusicVolume;
    }
  }, [backgroundMusicVolume]);
  
  // Auto-load selected track on mount or change
  useEffect(() => {
    if (selectedTrackSlug && !currentTrack) {
      setTrack(selectedTrackSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackSlug, currentTrack]); // FIXED: Removed setTrack from deps
  
  // Auto-pause when disabled
  useEffect(() => {
    if (!backgroundMusicEnabled && state === 'playing') {
      pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundMusicEnabled, state]); // FIXED: Removed pause from deps
  
  return {
    play,
    pause,
    stop,
    setTrack,
    fetchTracks,
    state,
    currentTrack,
    tracks,
  };
}
