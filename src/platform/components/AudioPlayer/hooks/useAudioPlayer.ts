/**
 * useAudioPlayer - HTML5 Audio management hook
 * 
 * Manages HTML5 Audio element, playback controls, and event listeners.
 * Handles play, pause, seek, volume, and cleanup (prevents memory leaks).
 * 
 * @version 2.43.0
 * @status ✅ IMPLEMENTED
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { Track } from '../types';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  audioElement: HTMLAudioElement | null;
}

export const useAudioPlayer = (track: Track | null): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize audio element when track changes
  useEffect(() => {
    if (!track) return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = track.audio_url;
    
    audioRef.current = audio;
    setIsLoading(true);
    setError(null);
    
    // Event listeners
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    
    const handleError = () => {
      setError('Nepodařilo se načíst audio');
      setIsLoading(false);
    };
    
    const handleCanPlay = () => {
      setIsLoading(false);
    };
    
    const handleWaiting = () => {
      setIsLoading(true);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    
    // Cleanup (CRITICAL: prevents memory leaks!)
    return () => {
      audio.pause();
      audio.src = '';
      audio.load();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audioRef.current = null;
    };
  }, [track?.id]);
  
  // Play (iOS Safari: must be synchronous user gesture!)
  const play = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError('Nepodařilo se spustit přehrávání');
      console.error('Audio play failed:', err);
    }
  }, []);
  
  // Pause
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);
  
  // Seek (clamp to valid range)
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    const clampedTime = Math.max(0, Math.min(time, duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  }, [duration]);
  
  // Set volume (0-1 range)
  const setVolume = useCallback((vol: number) => {
    if (!audioRef.current) return;
    
    const clampedVol = Math.max(0, Math.min(vol, 1));
    audioRef.current.volume = clampedVol;
  }, []);
  
  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume,
    audioElement: audioRef.current,
  };
};
