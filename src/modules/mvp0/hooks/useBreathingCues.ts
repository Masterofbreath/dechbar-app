/**
 * useBreathingCues - Audio Cues Management (DB-driven)
 *
 * Manages playback of solfeggio frequency audio cues and bells.
 * Data is fetched from the `breathing_cues` Supabase table.
 *
 * Fallback chain (per cue):
 *   1. cdn_url → fetch, cache in IndexedDB, play via HTMLAudioElement
 *   2. cdn_url = null + generate_hz → generate sine wave via Web Audio API
 *   3. Network failure → play generated tone (if generate_hz available) or silent skip
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
import { supabase } from '@/platform/api/supabase';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { getCachedAudioFile, cacheAudioFile } from '../utils/audioCache';
import type { BreathingPhaseAudio } from '../types/audio';

// Fallback bell sound (bundled — works offline)
const FALLBACK_BELL = '/sounds/bell.mp3';

interface BreathingCueData {
  id: string;
  phase: string;
  cdn_url: string | null;
  generate_hz: number | null;
  playback_rate: number;
  duration_ms: number | null;
}

interface BreathingCuesAPI {
  playCue: (phase: BreathingPhaseAudio) => Promise<void>;
  playBell: (type: 'start' | 'end') => Promise<void>;
  preloadAll: () => Promise<void>;
  isReady: boolean;
}

/**
 * Generate a Solfeggio sine wave tone via Web Audio API.
 * Used as fallback when cdn_url is NULL or unavailable.
 */
function playGeneratedTone(hz: number, durationSeconds: number, volume: number): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = hz;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSeconds);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationSeconds);

    // Cleanup AudioContext after tone ends
    osc.addEventListener('ended', () => {
      ctx.close().catch(() => null);
    });
  } catch {
    // Web Audio not supported — silent skip
  }
}

export function useBreathingCues(): BreathingCuesAPI {
  const { audioCuesEnabled, audioCueVolume, bellsEnabled } = useSessionSettings();
  const [isReady, setIsReady] = useState(false);

  // Cue data fetched from DB (keyed by phase)
  const cueDataRef = useRef<Map<string, BreathingCueData>>(new Map());

  // Loaded audio elements (keyed by cdn_url)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const getAudioElement = useCallback((url: string): HTMLAudioElement => {
    let audio = audioRefs.current.get(url);
    if (!audio) {
      audio = new Audio();
      audio.preload = 'auto';
      audioRefs.current.set(url, audio);
    }
    return audio;
  }, []);

  const loadAudio = useCallback(async (url: string): Promise<string> => {
    try {
      const cached = await getCachedAudioFile(url);
      if (cached) {
        return URL.createObjectURL(cached.blob);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      await cacheAudioFile(url, blob);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`[BreathingCues] Failed to load ${url}:`, error);
      return url;
    }
  }, []);

  const preloadAll = useCallback(async () => {
    try {
      console.log('[BreathingCues] Fetching cues from DB...');

      // Fetch active cues from database
      const { data, error } = await supabase
        .from('breathing_cues')
        .select('id, phase, cdn_url, generate_hz, playback_rate, duration_ms')
        .eq('is_active', true);

      if (error) throw error;

      const cues = (data ?? []) as BreathingCueData[];

      // Build phase → data map
      cueDataRef.current.clear();
      for (const cue of cues) {
        cueDataRef.current.set(cue.phase, cue);
      }

      // Preload only cues that have cdn_url
      const loadPromises = cues
        .filter(cue => cue.cdn_url !== null)
        .map(async (cue) => {
          const audioUrl = await loadAudio(cue.cdn_url!);
          const audio = getAudioElement(cue.cdn_url!);
          audio.src = audioUrl;
          audio.volume = audioCueVolume;
          audio.playbackRate = cue.playback_rate;

          return new Promise<void>((resolve) => {
            const timeout = window.setTimeout(() => resolve(), 3000);
            audio.addEventListener('canplaythrough', () => {
              clearTimeout(timeout);
              resolve();
            }, { once: true });
            audio.load();
          });
        });

      await Promise.all(loadPromises);

      setIsReady(true);
      console.log('[BreathingCues] Preload complete', cueDataRef.current.size, 'cues');
    } catch (error) {
      console.error('[BreathingCues] Preload error:', error);
      // Still set ready — Web Audio fallback will handle missing cues
      setIsReady(true);
    }
  }, [loadAudio, getAudioElement, audioCueVolume]);

  const playCue = useCallback(async (phase: BreathingPhaseAudio) => {
    if (!audioCuesEnabled) return;

    const cue = cueDataRef.current.get(phase);

    // No DB data yet — silent skip (preloadAll not called or failed)
    if (!cue) {
      console.warn(`[BreathingCues] No cue data for phase: ${phase}`);
      return;
    }

    try {
      if (cue.cdn_url) {
        // Play from CDN/cache
        const audio = getAudioElement(cue.cdn_url);
        audio.volume = audioCueVolume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
      } else if (cue.generate_hz) {
        // Web Audio API fallback
        playGeneratedTone(cue.generate_hz, 1.5, audioCueVolume);
      }
    } catch (error) {
      console.error(`[BreathingCues] Play error (${phase}):`, error);
      // Last resort: try Web Audio if we have hz
      if (cue.generate_hz) {
        playGeneratedTone(cue.generate_hz, 1.5, audioCueVolume);
      }
    }
  }, [audioCuesEnabled, audioCueVolume, getAudioElement]);

  const playBell = useCallback(async (type: 'start' | 'end') => {
    if (!bellsEnabled) return;

    const phase = type === 'start' ? 'start_bell' : 'end_bell';
    const cue = cueDataRef.current.get(phase);

    try {
      if (cue?.cdn_url) {
        const audio = getAudioElement(cue.cdn_url);
        audio.volume = audioCueVolume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
      } else {
        // Fallback to bundled bell
        const audio = getAudioElement(FALLBACK_BELL);
        if (!audio.src) audio.src = FALLBACK_BELL;
        audio.volume = audioCueVolume;
        if (type === 'end') audio.playbackRate = 0.9;
        audio.currentTime = 0;
        await audio.play();
      }
    } catch (error) {
      console.error(`[BreathingCues] Bell error (${type}):`, error);
    }
  }, [bellsEnabled, audioCueVolume, getAudioElement]);

  // Update volume and playback rate on settings change
  useEffect(() => {
    audioRefs.current.forEach((audio, url) => {
      audio.volume = audioCueVolume;
      // Re-apply playback_rate from cue data
      for (const cue of cueDataRef.current.values()) {
        if (cue.cdn_url === url) {
          audio.playbackRate = cue.playback_rate;
          break;
        }
      }
    });
  }, [audioCueVolume]);

  // Cleanup on unmount
  useEffect(() => {
    const refs = audioRefs.current;
    return () => {
      refs.forEach((audio) => {
        audio.pause();
        if (audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }
      });
      refs.clear();
    };
  }, []);

  return { playCue, playBell, preloadAll, isReady };
}
