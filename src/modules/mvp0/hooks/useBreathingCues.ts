/**
 * useBreathingCues - Audio Cues Management (DB-driven)
 *
 * Manages playback of solfeggio frequency audio cues and bells.
 * Data is fetched from the `breathing_cues` Supabase table.
 *
 * Volume ramp strategy:
 *   - Start: breathing cycle 0 → 25%, cycle 1 → 50%, cycle 2 → 75%, cycle 3+ → 100%
 *   - End:   set via notifySessionEnding(n) → n=3→75%, n=2→50%, n=1→25%, n=0→silent
 *   - Bells: always at full audioCueVolume (not ramped — intentionally loud)
 *   - "Cycle" = 1 complete inhale trigger (not each individual phase call)
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
import { playSharedTone } from '../utils/sharedAudioContext';
import type { BreathingPhaseAudio } from '../types/audio';

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
  /**
   * Play a bell sound.
   * @param type 'start' | 'end'
   * @param volumeScale Optional multiplier [0..1] applied on top of audioCueVolume.
   *   start bells use 0.33 / 0.66 / 1.0 for countdown ramp.
   *   end bell defaults to 0.5 (calm finish).
   *   Omit for 100% of audioCueVolume.
   */
  playBell: (type: 'start' | 'end', volumeScale?: number) => Promise<void>;
  preloadAll: () => Promise<void>;
  /** Call each time the INHALE phase triggers (= 1 new breathing cycle) */
  notifyCuePlayed: () => void;
  /** Call when session is entering last N cycles — triggers fade out */
  notifySessionEnding: (cyclesRemaining: number) => void;
  isReady: boolean;
}

/**
 * Volume scale per breathing cycle index (0-based, triggered by 'inhale' phase).
 * cycle 0 → 25%, cycle 1 → 50%, cycle 2 → 75%, cycle 3+ → 100%
 */
const CYCLE_RAMP_STEPS = [0.25, 0.50, 0.75, 1.0];

/**
 * Volume scale for end-of-session fade out.
 * cyclesRemaining: 3→75%, 2→50%, 1→25%, 0→silent (bell takes over)
 */
const END_RAMP_SCALES = [0, 0.25, 0.50, 0.75]; // index = cyclesRemaining

export function useBreathingCues(options?: { isSmartSession?: boolean }): BreathingCuesAPI {
  const isSmartSession = options?.isSmartSession ?? false;

  const {
    audioCuesEnabled,
    audioCueVolume,
    bellsEnabled,
    smartCuesEnabled,
    smartCueVolume,
    smartBellsEnabled,
  } = useSessionSettings();

  // Effective settings — SMART sessions use their own toggles/volume
  const effectiveCuesEnabled = isSmartSession ? smartCuesEnabled : audioCuesEnabled;
  const effectiveCueVolume   = isSmartSession ? smartCueVolume   : audioCueVolume;
  const effectiveBellsEnabled = isSmartSession ? smartBellsEnabled : bellsEnabled;

  const [isReady, setIsReady] = useState(false);

  // Cue data fetched from DB (keyed by phase)
  const cueDataRef = useRef<Map<string, BreathingCueData>>(new Map());

  // Loaded audio elements (keyed by cdn_url)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  /**
   * Breathing CYCLE counter.
   * Incremented only when 'inhale' phase plays (= 1 full cycle begins).
   * cycle 0 = first inhale ever → 25% volume.
   */
  const cycleCountRef = useRef(0);

  /**
   * Cycles remaining until session end.
   * null = not in ending phase (use cycleCountRef for start ramp instead).
   */
  const cyclesRemainingRef = useRef<number | null>(null);

  // ─── Volume calculation ────────────────────────────────────────────────────

  /**
   * Returns volume scale [0..1] for the current cue based on session position.
   * End ramp takes priority over start ramp.
   */
  const getVolumeScale = useCallback((): number => {
    const remaining = cyclesRemainingRef.current;
    if (remaining !== null) {
      const idx = Math.max(0, Math.min(3, remaining));
      return END_RAMP_SCALES[idx];
    }
    const idx = Math.min(cycleCountRef.current, CYCLE_RAMP_STEPS.length - 1);
    return CYCLE_RAMP_STEPS[idx];
  }, []);

  // ─── Audio element management ──────────────────────────────────────────────

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
      if (cached) return URL.createObjectURL(cached.blob);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      await cacheAudioFile(url, blob);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`[BreathingCues] Failed to load ${url}:`, error);
      return url; // stream fallback
    }
  }, []);

  // ─── Preload ──────────────────────────────────────────────────────────────

  const preloadAll = useCallback(async () => {
    try {
      console.log('[BreathingCues] Fetching cues from DB...');

      const { data, error } = await supabase
        .from('breathing_cues')
        .select('id, phase, cdn_url, generate_hz, playback_rate, duration_ms')
        .eq('is_active', true);

      if (error) throw error;

      const cues = (data ?? []) as BreathingCueData[];

      // Reset counters for new session
      cueDataRef.current.clear();
      cycleCountRef.current = 0;
      cyclesRemainingRef.current = null;

      for (const cue of cues) {
        cueDataRef.current.set(cue.phase, cue);
      }

      // Preload CDN audio files
      const loadPromises = cues
        .filter(cue => cue.cdn_url !== null)
        .map(async (cue) => {
          const audioUrl = await loadAudio(cue.cdn_url!);
          const audio = getAudioElement(cue.cdn_url!);
          audio.src = audioUrl;
          audio.volume = effectiveCueVolume * CYCLE_RAMP_STEPS[0]; // pre-set to 25% = first cue volume
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
      setIsReady(true);
    }
  }, [loadAudio, getAudioElement, effectiveCueVolume]);

  // ─── playCue ──────────────────────────────────────────────────────────────

  const playCue = useCallback(async (phase: BreathingPhaseAudio) => {
    if (!effectiveCuesEnabled) return;

    const cue = cueDataRef.current.get(phase);
    if (!cue) {
      console.warn(`[BreathingCues] No cue data for phase: ${phase}`);
      return;
    }

    // Increment cycle counter when inhale starts — this is the start of a new breathing cycle
    if (phase === 'inhale') {
      cycleCountRef.current++;
    }

    const scale = getVolumeScale();
    const effectiveVolume = effectiveCueVolume * scale;

    // Silent — skip playback (end of session or scale=0)
    if (effectiveVolume < 0.01) return;

    try {
      if (cue.cdn_url) {
        const audio = getAudioElement(cue.cdn_url);
        if (!audio.src || audio.src === window.location.href) return;
        audio.volume = effectiveVolume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
      } else if (cue.generate_hz) {
        playSharedTone(cue.generate_hz, 1.5, effectiveVolume);
      }
    } catch (error) {
      // NotSupportedError / NotAllowedError → fallback to shared Web Audio
      if (cue.generate_hz) {
        playSharedTone(cue.generate_hz, 1.5, effectiveVolume);
      } else {
        console.error(`[BreathingCues] Play error (${phase}):`, error);
      }
    }
  }, [effectiveCuesEnabled, effectiveCueVolume, getAudioElement, getVolumeScale]);

  // ─── playBell ─────────────────────────────────────────────────────────────

  /**
   * Bells play relative to audioCueVolume × volumeScale.
   * start_bell: caller passes 0.33 / 0.66 / 1.0 for the countdown ramp.
   * end_bell: defaults to 0.5 × audioCueVolume (calm, not startling).
   */
  const playBell = useCallback(async (type: 'start' | 'end', volumeScale?: number) => {
    if (!effectiveBellsEnabled) return;

    // Default scale: end bell is 50% (calm finish), start bell is full unless caller specifies
    const scale = volumeScale ?? (type === 'end' ? 0.5 : 1.0);
    const volume = effectiveCueVolume * scale;

    const phase = type === 'start' ? 'start_bell' : 'end_bell';
    const cue = cueDataRef.current.get(phase);

    try {
      if (cue?.cdn_url) {
        const audio = getAudioElement(cue.cdn_url);
        if (!audio.src || audio.src === window.location.href) return;
        audio.volume = volume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
      } else if (cue?.generate_hz) {
        const bellDuration = type === 'start' ? 2.5 : 3.5;
        playSharedTone(cue.generate_hz, bellDuration, volume, true);
      } else {
        console.warn(`[BreathingCues] Bell (${type}) has no audio source configured`);
      }
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'NotSupportedError' || error.name === 'NotAllowedError')) {
        // HTMLAudioElement blocked by autoplay policy → fallback to shared Web Audio
        if (cue?.generate_hz) {
          const bellDuration = type === 'start' ? 2.5 : 3.5;
          playSharedTone(cue.generate_hz, bellDuration, volume, true);
        } else {
          console.warn(`[BreathingCues] Bell (${type}) blocked and no fallback hz`);
        }
      } else {
        console.error(`[BreathingCues] Bell error (${type}):`, error);
      }
    }
  }, [effectiveBellsEnabled, effectiveCueVolume, getAudioElement]);

  // ─── Session lifecycle callbacks ───────────────────────────────────────────

  /**
   * Notify that a new breathing cycle (inhale) has just started.
   * Decrements cyclesRemaining if in ending phase.
   * (Informational — playCue handles cycle increment internally.)
   */
  const notifyCuePlayed = useCallback(() => {
    if (cyclesRemainingRef.current !== null && cyclesRemainingRef.current > 0) {
      cyclesRemainingRef.current--;
    }
  }, []);

  /**
   * Notify that the session is ending.
   * cyclesRemaining: how many complete inhale cycles remain before session end.
   *   3 → 75% volume, 2 → 50%, 1 → 25%, 0 → silent (end bell plays instead)
   * Call this only ONCE per threshold to avoid re-triggering.
   */
  const notifySessionEnding = useCallback((cyclesRemaining: number) => {
    // Only decrease — never increase remaining (prevents re-triggering issues)
    if (cyclesRemainingRef.current === null || cyclesRemaining < cyclesRemainingRef.current) {
      cyclesRemainingRef.current = cyclesRemaining;
    }
  }, []);

  // ─── Volume sync (settings change) ────────────────────────────────────────

  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      // Only update volume on actively playing elements — idle ones will get
      // correct volume set in playCue() / playBell() on next trigger.
      if (!audio.paused) {
        audio.volume = effectiveCueVolume;
      }
    });
  }, [effectiveCueVolume]);

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const refs = audioRefs.current;
    return () => {
      refs.forEach((audio) => {
        audio.pause();
        if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
      });
      refs.clear();
    };
  }, []);

  return { playCue, playBell, preloadAll, notifyCuePlayed, notifySessionEnding, isReady };
}
