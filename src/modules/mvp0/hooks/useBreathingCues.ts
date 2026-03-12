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
import { playSharedTone, scheduleSharedTone, scheduleSharedToneAsync, getSharedAudioContext, isIOSPlatform } from '../utils/sharedAudioContext';
import { getPlatformLabel } from '../utils/sharedAudioContext';
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
  /**
   * Pre-schedule upcoming breathing cues via Web Audio timeline.
   *
   * iOS Safari throttles/stops setInterval when the screen locks, which prevents
   * playCue() from being called at the right moment. This function schedules
   * the next N cues directly on the AudioContext timeline (which continues
   * running natively even when the screen is locked).
   *
   * Async-safe: awaits ctx.resume() if context is suspended/interrupted.
   *
   * @param cues  Array of { phase, delaySeconds } — relative to `Date.now()`
   * @returns Promise resolving to cancel function (aborts unplayed nodes)
   */
  scheduleUpcomingCues: (cues: Array<{ phase: BreathingPhaseAudio; delaySeconds: number }>) => Promise<() => void>;
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

export function useBreathingCues(options?: { isSmartSession?: boolean; isTronSession?: boolean }): BreathingCuesAPI {
  const isSmartSession = options?.isSmartSession ?? false;
  const isTronSession  = options?.isTronSession  ?? false;

  const {
    audioCuesEnabled,
    audioCueVolume,
    bellsEnabled,
    smartCuesEnabled,
    smartCueVolume,
    smartBellsEnabled,
    tronCuesEnabled,
    tronCueVolume,
    tronBellsEnabled,
  } = useSessionSettings();

  // Effective settings per session type
  const effectiveCuesEnabled  = isSmartSession ? smartCuesEnabled  : isTronSession ? tronCuesEnabled  : audioCuesEnabled;
  const effectiveCueVolume    = isSmartSession ? smartCueVolume    : isTronSession ? tronCueVolume    : audioCueVolume;
  const effectiveBellsEnabled = isSmartSession ? smartBellsEnabled : isTronSession ? tronBellsEnabled : bellsEnabled;

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
      // crossOrigin='anonymous' required for Safari cross-origin audio (CORS policy)
      audio.crossOrigin = 'anonymous';
      audioRefs.current.set(url, audio);
    }
    return audio;
  }, []);

  const loadAudio = useCallback(async (url: string): Promise<string> => {
    try {
      const cached = await getCachedAudioFile(url);
      if (cached) return URL.createObjectURL(cached.blob);
      // mode: 'cors' required for Safari to fetch cross-origin audio without CORS error
      const response = await fetch(url, { mode: 'cors' });
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

      // NOTE: CueSoundSelector (smartCueSoundSlug/Variant) is currently not applied here.
      // All active cues are loaded regardless of pack selection — intentional because only
      // one cue pack exists in DB. When multiple packs are added, filter by slug/variant here.
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
      console.warn(`[BreathingCues] No cue data for phase: ${phase}`, { platform: getPlatformLabel() });
      return;
    }

    if (phase === 'inhale') {
      cycleCountRef.current++;
    }

    const scale = getVolumeScale();
    const effectiveVolume = effectiveCueVolume * scale;

    if (effectiveVolume < 0.01) return;

    const method = cue.generate_hz ? 'WebAudio' : cue.cdn_url ? 'HTMLAudio' : 'none';
    console.log('[BreathingCues] playCue', {
      platform: getPlatformLabel(),
      phase, method,
      hz: cue.generate_hz ?? null,
      volume: effectiveVolume,
      scale,
    });

    try {
      // Prefer Web Audio for cues — reliable on Safari PWA without per-play gesture
      if (cue.generate_hz) {
        playSharedTone(cue.generate_hz, 1.5, effectiveVolume);
        return;
      }

      // CDN cue — HTMLAudioElement
      if (cue.cdn_url) {
        const audio = getAudioElement(cue.cdn_url);
        if (!audio.src || audio.src === window.location.href) return;
        audio.volume = effectiveVolume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
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
   *
   * Strategy: prefer Web Audio API (playSharedTone) when generate_hz is available
   * because Web Audio bypasses Safari's per-play autoplay restriction — once
   * AudioContext is unlocked by a user gesture it stays active for the session.
   * Fall back to HTMLAudioElement for CDN-only bells.
   */
  const playBell = useCallback(async (type: 'start' | 'end', volumeScale?: number) => {
    if (!effectiveBellsEnabled) return;

    const scale = volumeScale ?? (type === 'end' ? 0.5 : 1.0);
    const volume = effectiveCueVolume * scale;
    const phase = type === 'start' ? 'start_bell' : 'end_bell';
    const cue = cueDataRef.current.get(phase);
    const method = cue?.generate_hz ? 'WebAudio' : cue?.cdn_url ? 'HTMLAudio' : 'fallback-WebAudio';

    console.log('[BreathingCues] playBell', {
      platform: getPlatformLabel(),
      type, method, volume, scale,
      hz: cue?.generate_hz ?? null,
      cueLoaded: !!cue,
    });

    if (!cue) {
      // No cue data yet — generate_hz fallback with reasonable defaults
      const hz = type === 'start' ? 528 : 396; // solfeggio defaults
      const bellDuration = type === 'start' ? 2.5 : 3.5;
      playSharedTone(hz, bellDuration, volume, true);
      return;
    }

    try {
      // Prefer Web Audio (generate_hz) — works reliably on Safari PWA without per-play gesture
      if (cue.generate_hz) {
        const bellDuration = type === 'start' ? 2.5 : 3.5;
        playSharedTone(cue.generate_hz, bellDuration, volume, true);
        return;
      }

      // CDN bell — attempt HTMLAudioElement, fall back to Web Audio on error
      if (cue.cdn_url) {
        const audio = getAudioElement(cue.cdn_url);
        if (!audio.src || audio.src === window.location.href) {
          // src not loaded — use Web Audio fallback immediately
          const hz = type === 'start' ? 528 : 396;
          playSharedTone(hz, type === 'start' ? 2.5 : 3.5, volume, true);
          return;
        }
        audio.volume = volume;
        audio.playbackRate = cue.playback_rate;
        audio.currentTime = 0;
        await audio.play();
      } else {
        console.warn(`[BreathingCues] Bell (${type}) has no audio source configured`);
      }
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'NotSupportedError' || error.name === 'NotAllowedError')) {
        // HTMLAudioElement blocked (Safari autoplay or format) — fall back to Web Audio tone
        console.warn(`[BreathingCues] Bell (${type}) CDN blocked — falling back to Web Audio tone`);
        const hz = type === 'start' ? 528 : 396;
        playSharedTone(hz, type === 'start' ? 2.5 : 3.5, volume, true);
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

  // ─── scheduleUpcomingCues ─────────────────────────────────────────────────
  /**
   * Pre-schedule an array of breathing cues via the Web Audio timeline.
   *
   * KEY PROPERTY: Web Audio AudioNode playback is driven by the browser's native
   * audio engine (C++ thread). Once scheduled, nodes fire regardless of whether
   * JS timers are running — this is what makes cues work with a locked screen.
   *
   * Async-safe: if AudioContext is suspended or interrupted (iOS lock screen),
   * this function awaits resume() before scheduling — so calling it immediately
   * after visibilitychange 'visible' always works even if the context isn't
   * fully running yet.
   *
   * @param cues  Array of { phase, delaySeconds } — seconds from now
   * @returns Promise resolving to a cancel function (aborts unplayed nodes)
   */
  const scheduleUpcomingCues = useCallback(async (
    cues: Array<{ phase: BreathingPhaseAudio; delaySeconds: number }>,
  ): Promise<() => void> => {
    if (!effectiveCuesEnabled) {
      console.log('[BreathingCues] scheduleUpcomingCues skipped — cues disabled', { platform: getPlatformLabel() });
      return () => {/* noop */};
    }

    // Pre-scheduling is only needed on iOS where JS timers are throttled when screen locks.
    // On desktop (Safari, Chrome) timers run normally — playCue() fires at the right time.
    // Skipping pre-schedule on desktop avoids race conditions with the regular playCue() flow.
    if (!isIOSPlatform()) {
      console.log('[BreathingCues] scheduleUpcomingCues skipped — not iOS (timers work normally)', { platform: getPlatformLabel() });
      return () => {/* noop */};
    }

    if (cues.length === 0) return () => {/* noop */};

    console.log('[BreathingCues] scheduleUpcomingCues', {
      platform: getPlatformLabel(),
      count: cues.length,
      horizonSec: Math.round((cues[cues.length - 1]?.delaySeconds ?? 0)),
    });

    const cancelFns: Array<(() => void)> = [];

    // Use scheduleSharedToneAsync so each tone awaits ctx.resume() if needed.
    // We schedule all cues in parallel (Promise.all) for efficiency.
    const promises = cues
      .filter(c => c.delaySeconds >= 0)
      .map(async ({ phase, delaySeconds }) => {
        const cueData = cueDataRef.current.get(phase);
        if (!cueData?.generate_hz) return; // CDN cues cannot be pre-scheduled

        const scale = getVolumeScale();
        const volume = effectiveCueVolume * scale;
        if (volume < 0.01) return;

        const cancel = await scheduleSharedToneAsync(
          cueData.generate_hz,
          1.5,
          volume,
          delaySeconds,
          false,
        );
        if (cancel) cancelFns.push(cancel);
      });

    await Promise.all(promises);

    console.log('[BreathingCues] scheduleUpcomingCues done — scheduled', cancelFns.length, 'nodes', {
      platform: getPlatformLabel(),
    });

    return () => {
      console.log('[BreathingCues] scheduleUpcomingCues CANCEL called —', cancelFns.length, 'nodes to stop', {
        platform: getPlatformLabel(),
      });
      cancelFns.forEach(fn => fn());
    };
  }, [effectiveCuesEnabled, effectiveCueVolume, getVolumeScale]);

  // ─── scheduleBells ────────────────────────────────────────────────────────
  /**
   * Pre-schedule the two SMART countdown start bells using the Web Audio timeline.
   *
   * MUST be called synchronously from a user gesture handler (e.g. button click)
   * AFTER unlockSharedAudioContext() so that AudioContext.state === 'running'.
   *
   * On iOS, ctx.resume() is async and may not have resolved by the time scheduleBells
   * is called synchronously. We handle this by:
   *   1. If ctx is already running → schedule immediately (desktop / fast iOS path)
   *   2. If ctx is suspended → await resume() Promise, then schedule with adjusted delays
   *      (iOS slow resume path — adjusts for elapsed time so bells still fire at correct time)
   *
   * AudioNodes are created immediately (within the gesture stack) and will fire
   * automatically when ctx.currentTime reaches the scheduled offset — no gesture
   * token is needed at the moment of playback. This is the correct solution for
   * Safari's autoplay restriction in the SMART prep countdown.
   *
   * @param delay1Sec  Seconds from now for the first bell  (e.g. 3.0 → fires 3s later)
   * @param delay2Sec  Seconds from now for the second bell (e.g. 4.0 → fires 4s later)
   *
   * @returns A cancel function that stops both scheduled bells (e.g. if session is aborted).
   */
  const scheduleBells = useCallback((delay1Sec: number, delay2Sec: number): (() => void) => {
    if (!effectiveBellsEnabled) {
      console.log('[BreathingCues] scheduleBells skipped — bells disabled', { platform: getPlatformLabel() });
      return () => {/* bells disabled — nothing to cancel */};
    }

    const cue = cueDataRef.current.get('start_bell');
    const hz = cue?.generate_hz ?? 528;
    const volume = effectiveCueVolume;
    const vol1   = volume * 0.5;
    const vol2   = volume * 1.0;

    const ctx = getSharedAudioContext();
    const ctxState = ctx?.state ?? 'none';

    console.log('[BreathingCues] scheduleBells', {
      platform: getPlatformLabel(),
      hz, vol1, vol2, delay1Sec, delay2Sec,
      cueLoaded: !!cue,
      ctxState,
    });

    // Mutable cancel refs — filled once scheduling actually happens
    let cancel1: (() => void) | null = null;
    let cancel2: (() => void) | null = null;
    let cancelled = false;

    const doSchedule = (adjustedDelay1: number, adjustedDelay2: number) => {
      if (cancelled) {
        console.log('[BreathingCues] scheduleBells: cancelled before scheduling — skipping', { platform: getPlatformLabel() });
        return;
      }
      console.log('[BreathingCues] scheduleBells: scheduling now', {
        platform: getPlatformLabel(),
        adjustedDelay1, adjustedDelay2,
        ctxState: ctx?.state ?? 'none',
        ctxCurrentTime: ctx?.currentTime ?? 0,
      });
      cancel1 = scheduleSharedTone(hz, 2.5, vol1, Math.max(0.05, adjustedDelay1), true);
      cancel2 = scheduleSharedTone(hz, 2.5, vol2, Math.max(0.05, adjustedDelay2), true);
    };

    if (!ctx) {
      console.warn('[BreathingCues] scheduleBells: no AudioContext — bells cannot be scheduled', { platform: getPlatformLabel() });
    } else if (ctx.state === 'running') {
      // Happy path — context already running (desktop Safari / fast iOS)
      console.log('[BreathingCues] scheduleBells: ctx already running — scheduling immediately', { platform: getPlatformLabel() });
      doSchedule(delay1Sec, delay2Sec);
    } else if (ctx.state === 'suspended') {
      // iOS slow path — resume() hasn't resolved yet. Await it, then schedule.
      // We capture scheduledAt to compute elapsed time during resume wait,
      // so bells still fire at the correct absolute time after the delay.
      const scheduledAt = performance.now();
      console.log('[BreathingCues] scheduleBells: ctx suspended — awaiting resume()', {
        platform: getPlatformLabel(),
        scheduledAt,
        delay1Sec, delay2Sec,
      });
      void ctx.resume().then(() => {
        const elapsedSec = (performance.now() - scheduledAt) / 1000;
        const adj1 = delay1Sec - elapsedSec;
        const adj2 = delay2Sec - elapsedSec;
        console.log('[BreathingCues] scheduleBells: resume() resolved', {
          platform: getPlatformLabel(),
          elapsedSec,
          adj1, adj2,
          ctxState: ctx.state,
          ctxCurrentTime: ctx.currentTime,
        });
        doSchedule(adj1, adj2);
      }).catch((err) => {
        console.warn('[BreathingCues] scheduleBells: resume() failed — bells cannot be scheduled', {
          platform: getPlatformLabel(), err: String(err),
        });
      });
    } else {
      console.warn('[BreathingCues] scheduleBells: unexpected ctx state — bells cannot be scheduled', {
        platform: getPlatformLabel(), ctxState,
      });
    }

    return () => {
      cancelled = true;
      cancel1?.();
      cancel2?.();
    };
  }, [effectiveBellsEnabled, effectiveCueVolume]);

  return { playCue, playBell, scheduleBells, scheduleUpcomingCues, preloadAll, notifyCuePlayed, notifySessionEnding, isReady };
}
