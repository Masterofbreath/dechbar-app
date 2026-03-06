/**
 * useBackgroundMusic - Background Music Management
 *
 * Features:
 * - Fade IN on play (native volume ramp — no Web Audio API dependency)
 * - Fade OUT on stop/pause
 * - Seamless A/B crossfade loop: secondary element starts before primary ends
 * - Cache-first strategy (IndexedDB → CDN stream fallback)
 * - playWhenReady(): waits for canplaythrough before playing — no race conditions
 *
 * Architecture:
 *   Two HTMLAudioElement (primary / secondary) with native volume control.
 *   No Web Audio API — avoids CORS + createMediaElementSource complexity.
 *   stateRef mirrors React state for use inside callbacks (no stale closures).
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { useSessionSettings } from '../stores/sessionSettingsStore';
import { getCachedAudioFile, cacheAudioFile } from '../utils/audioCache';
import { onAudioUnlock, acquirePlayback, releasePlayback } from '../utils/sharedAudioContext';
import type { BackgroundTrack, MusicPlaybackState } from '../types/audio';

// ─── Constants ────────────────────────────────────────────────────────────────

const FADE_IN_DURATION_MS  = 9000; // 9s fade in
const FADE_OUT_DURATION_MS = 9000; // 9s fade out
const FADE_STEPS           = 90;   // 1 step per 100ms = smooth curve
const CROSSFADE_BEFORE_END = 10;   // seconds before track end to start secondary

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackgroundMusicAPI {
  /** Start playback with 9s fade IN. Waits for audio to be ready if needed. */
  play: () => Promise<void>;
  /** Pause with 9s fade OUT. */
  pause: () => void;
  /** Stop with fade OUT (or instant if startFadeOut already ran). */
  stop: () => void;
  /** Start 9s fade OUT immediately — call 9s before session ends for perfect timing. */
  startFadeOut: () => void;
  setTrack: (slug: string) => Promise<void>;
  fetchTracks: () => Promise<BackgroundTrack[]>;
  state: MusicPlaybackState;
  currentTrack: BackgroundTrack | null;
  tracks: BackgroundTrack[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackgroundMusic(): BackgroundMusicAPI {
  const { backgroundMusicEnabled, backgroundMusicVolume, selectedTrackSlug } = useSessionSettings();

  const [state, setState] = useState<MusicPlaybackState>('idle');
  // stateRef mirrors React state — always current inside callbacks (no stale closure)
  const stateRef = useRef<MusicPlaybackState>('idle');
  const setStateAndRef = useCallback((s: MusicPlaybackState) => {
    stateRef.current = s;
    setState(s);
  }, []);

  const [currentTrack, setCurrentTrack] = useState<BackgroundTrack | null>(null);
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);

  // A/B audio elements — swapped on each crossfade loop
  const primaryRef   = useRef<HTMLAudioElement | null>(null);
  const secondaryRef = useRef<HTMLAudioElement | null>(null);

  // Separate ramp refs so volume-sync never cancels main fade
  const fadeInRampRef     = useRef<number | null>(null);
  const fadeOutRampRef    = useRef<number | null>(null);
  const volumeSyncRampRef = useRef<number | null>(null);

  const crossfadeTimerRef = useRef<number | null>(null);
  const trackUrlRef       = useRef<string | null>(null);

  // Guard: prevents double fade OUT when startFadeOut() + stop() are both called
  const fadeOutStartedRef = useRef(false);

  // Guard: crossfade loop only runs while this is true.
  // Set to true by playInternal(), false by stop() / pause() / startFadeOut().
  // Prevents pending swap callbacks from firing after session ends.
  const crossfadeEnabledRef = useRef(false);

  // Separate fade OUT ramp for secondary element during simultaneous crossfade
  const fadeOutRamp2Ref = useRef<number | null>(null);

  // Guard: prevents setTrack from running in parallel (second call waits or is dropped)
  const setTrackInProgressRef = useRef(false);
  const pendingTrackSlugRef   = useRef<string | null>(null);

  // Pending play request — set when play() is called before audio is ready.
  // NOT reset by setTrack — only cleared when pending play is actually executed.
  const pendingPlayRef = useRef(false);

  // ─── Ramp helpers ────────────────────────────────────────────────────────

  const clearRamps = useCallback(() => {
    if (fadeInRampRef.current)   { window.clearInterval(fadeInRampRef.current);   fadeInRampRef.current   = null; }
    if (fadeOutRampRef.current)  { window.clearInterval(fadeOutRampRef.current);  fadeOutRampRef.current  = null; }
    if (fadeOutRamp2Ref.current) { window.clearInterval(fadeOutRamp2Ref.current); fadeOutRamp2Ref.current = null; }
  }, []);

  const rampVolume = useCallback((
    el: HTMLAudioElement,
    targetVolume: number,
    durationMs: number,
    rampRef: React.MutableRefObject<number | null>,
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (rampRef.current) window.clearInterval(rampRef.current);

      const startVol = el.volume;
      const target   = Math.max(0, Math.min(1, targetVolume));
      const delta    = target - startVol;
      const stepMs   = durationMs / FADE_STEPS;
      let step = 0;

      if (Math.abs(delta) < 0.001) {
        el.volume = target;
        resolve();
        return;
      }

      rampRef.current = window.setInterval(() => {
        step++;
        el.volume = Math.max(0, Math.min(1, startVol + delta * (step / FADE_STEPS)));

        if (step >= FADE_STEPS) {
          window.clearInterval(rampRef.current!);
          rampRef.current = null;
          el.volume = target;
          resolve();
        }
      }, stepMs);
    });
  }, []);

  // ─── Fetch tracks ────────────────────────────────────────────────────────

  const fetchTracks = useCallback(async (): Promise<BackgroundTrack[]> => {
    try {
      const { data, error } = await supabase
        .from('background_tracks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) { console.error('[BackgroundMusic] Fetch error:', error); return []; }
      const result = data ?? [];
      setTracks(result);
      return result;
    } catch (err) {
      console.error('[BackgroundMusic] Fetch exception:', err);
      return [];
    }
  }, []);

  // ─── Audio loading ───────────────────────────────────────────────────────

  const loadAudio = useCallback(async (url: string): Promise<string> => {
    try {
      const cached = await getCachedAudioFile(url);
      if (cached) {
        console.log('[BackgroundMusic] Using cached audio');
        return URL.createObjectURL(cached.blob);
      }
      console.log('[BackgroundMusic] Downloading from CDN...');
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      await cacheAudioFile(url, blob);
      return URL.createObjectURL(blob);
    } catch (err) {
      console.warn('[BackgroundMusic] Fetch failed, using direct stream:', err);
      // Direct stream fallback — Safari can play cross-origin URLs directly
      // as long as the CDN has proper CORS headers (Access-Control-Allow-Origin: *)
      return url;
    }
  }, []);

  // ─── Crossfade / loop ────────────────────────────────────────────────────

  const scheduleCrossfade = useCallback((el: HTMLAudioElement) => {
    if (crossfadeTimerRef.current) window.clearTimeout(crossfadeTimerRef.current);

    const schedule = () => {
      const dur = el.duration;
      if (!dur || !isFinite(dur) || dur <= CROSSFADE_BEFORE_END) {
        el.loop = true;
        return;
      }

      const waitMs = Math.max(0, (dur - el.currentTime - CROSSFADE_BEFORE_END) * 1000);

      crossfadeTimerRef.current = window.setTimeout(() => {
        // Abort if loop was disabled (session ended, stop/pause called)
        if (!crossfadeEnabledRef.current) return;

        const url       = trackUrlRef.current;
        const secondary = secondaryRef.current;
        const primary   = primaryRef.current;
        if (!url || !secondary || !primary) return;

        secondary.src         = url;
        secondary.volume      = 0;
        secondary.currentTime = 0;

        secondary.play().then(() => {
          // Abort again — state may have changed during async play()
          if (!crossfadeEnabledRef.current) {
            secondary.pause();
            secondary.volume = 0;
            return;
          }

          rampVolume(secondary, backgroundMusicVolume, FADE_IN_DURATION_MS, fadeInRampRef);

          window.setTimeout(() => {
            // Final guard before swap — stop() may have been called during the 10s overlap
            if (!crossfadeEnabledRef.current) {
              secondary.pause();
              secondary.volume = 0;
              return;
            }

            primary.pause();
            primary.currentTime = 0;
            primaryRef.current   = secondary;
            secondaryRef.current = primary;
            scheduleCrossfade(primaryRef.current);
            console.log('[BackgroundMusic] Loop swap complete');
          }, CROSSFADE_BEFORE_END * 1000);

        }).catch((err) => {
          console.warn('[BackgroundMusic] Secondary play failed, fallback loop:', err);
          el.loop = true;
        });

      }, waitMs);
    };

    if (!isFinite(el.duration) || el.duration <= 0) {
      el.addEventListener('loadedmetadata', schedule, { once: true });
    } else {
      schedule();
    }
  }, [backgroundMusicVolume, rampVolume]);

  // ─── Set track ───────────────────────────────────────────────────────────

  const setTrack = useCallback(async (slug: string) => {
    // If already loading, queue this slug and let the current load finish
    if (setTrackInProgressRef.current) {
      pendingTrackSlugRef.current = slug;
      return;
    }

    setTrackInProgressRef.current = true;

    try {
      setStateAndRef('loading');
      // Note: intentionally do NOT reset pendingPlayRef here —
      // play() may have been called and is waiting for load to complete.

      let track = tracks.find(t => t.slug === slug);
      if (!track) {
        const all = await fetchTracks();
        track = all.find(t => t.slug === slug);
      }
      if (!track) {
        console.error('[BackgroundMusic] Track not found:', slug);
        setStateAndRef('error');
        return;
      }

      setCurrentTrack(track);
      const audioUrl = await loadAudio(track.cdn_url);
      trackUrlRef.current = audioUrl;

      if (!primaryRef.current) primaryRef.current = new Audio();
      const primary = primaryRef.current;

      if (primary.src?.startsWith('blob:') && primary.src !== audioUrl) {
        URL.revokeObjectURL(primary.src);
      }

      // crossOrigin='anonymous' required for Safari to play cross-origin URLs
      // without triggering CORS errors on HTMLAudioElement
      primary.crossOrigin = 'anonymous';
      primary.src    = audioUrl;
      primary.volume = 0;
      primary.loop   = false;
      primary.load();

      if (!secondaryRef.current) {
        secondaryRef.current = new Audio();
        secondaryRef.current.crossOrigin = 'anonymous';
        secondaryRef.current.volume = 0;
      }

      setStateAndRef('idle');
      console.log('[BackgroundMusic] Track loaded:', track.name);

      // If play() was called while track was loading, execute it now
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        void playInternal();
      }
    } catch (err) {
      console.error('[BackgroundMusic] SetTrack error:', err);
      setStateAndRef('error');
    } finally {
      setTrackInProgressRef.current = false;

      // If another slug was queued during this load, process it now
      const queued = pendingTrackSlugRef.current;
      if (queued) {
        pendingTrackSlugRef.current = null;
        void setTrack(queued);
      }
    }
  // playInternal forward reference — safe, called only after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, fetchTracks, loadAudio, setStateAndRef]);

  // ─── Internal play (shared by play() and pending-play retry) ─────────────

  const playInternal = useCallback(async () => {
    const primary = primaryRef.current;
    if (!primary) { console.warn('[BackgroundMusic] No audio element'); return; }
    if (!primary.src || primary.src === window.location.href) {
      console.warn('[BackgroundMusic] Audio src not set');
      return;
    }

    try {
      // Singleton guard — only one instance plays at a time across all mounted hooks
      if (!acquirePlayback()) {
        console.log('[BackgroundMusic] Another instance is already playing — skipping');
        setStateAndRef('idle');
        return;
      }

      setStateAndRef('playing');
      clearRamps();
      fadeOutStartedRef.current   = false;
      crossfadeEnabledRef.current = true;
      primary.volume = 0;

      await primary.play();

      rampVolume(primary, backgroundMusicVolume, FADE_IN_DURATION_MS, fadeInRampRef);
      scheduleCrossfade(primary);

      // Resume automatically when OS pauses audio due to device switch
      // (e.g. headphones connected/disconnected). Without this, music stops silently.
      const handleExternalPause = () => {
        if (stateRef.current === 'playing' && crossfadeEnabledRef.current) {
          primary.play().catch(() => null);
        }
      };
      primary.addEventListener('pause', handleExternalPause);

      console.log('[BackgroundMusic] Playing with fade IN');
    } catch (err) {
      releasePlayback();
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        // Safari autoplay blocked — wait for next user gesture unlock then retry once
        console.warn('[BackgroundMusic] Autoplay blocked — will retry on next gesture');
        setStateAndRef('idle');
        pendingPlayRef.current = true;
      } else if (err instanceof DOMException && err.name === 'NotSupportedError') {
        console.warn('[BackgroundMusic] Source not supported');
        setStateAndRef('idle');
      } else {
        console.error('[BackgroundMusic] Play error:', err);
        setStateAndRef('error');
      }
    }
  }, [backgroundMusicVolume, clearRamps, rampVolume, scheduleCrossfade, setStateAndRef]);

  // ─── Play (public) ───────────────────────────────────────────────────────

  const play = useCallback(async () => {
    if (!backgroundMusicEnabled) return;

    const currentState = stateRef.current;

    // Already playing — nothing to do
    if (currentState === 'playing') return;

    // Track is still loading — mark as pending, setTrack will call playInternal when done
    if (currentState === 'loading' || setTrackInProgressRef.current) {
      console.log('[BackgroundMusic] Track still loading — queuing play');
      pendingPlayRef.current = true;
      return;
    }

    // No track src set yet — mark pending, auto-load effect will trigger setTrack
    if (!primaryRef.current?.src || primaryRef.current.src === window.location.href) {
      console.warn('[BackgroundMusic] play() called but no track loaded yet — queuing');
      pendingPlayRef.current = true;
      return;
    }

    await playInternal();
  }, [backgroundMusicEnabled, playInternal]);

  // ─── Pause ───────────────────────────────────────────────────────────────

  const pause = useCallback(() => {
    // Only pause if actually playing — don't trigger fade OUT on idle/loading state
    if (stateRef.current !== 'playing') return;

    crossfadeEnabledRef.current = false;
    clearRamps();
    if (crossfadeTimerRef.current) { window.clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }

    const primary   = primaryRef.current;
    const secondary = secondaryRef.current;
    if (!primary) return;

    const promises: Promise<void>[] = [
      rampVolume(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
    ];
    if (secondary && secondary.volume > 0) {
      promises.push(rampVolume(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
    }

    Promise.all(promises).then(() => {
      primary.pause();
      secondary?.pause();
      releasePlayback();
      setStateAndRef('paused');
      console.log('[BackgroundMusic] Paused');
    });
  }, [clearRamps, rampVolume, setStateAndRef]);

  // ─── Stop ────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    pendingPlayRef.current      = false;
    crossfadeEnabledRef.current = false;
    if (crossfadeTimerRef.current) { window.clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }

    const primary   = primaryRef.current;
    const secondary = secondaryRef.current;
    if (!primary) return;

    const doStop = () => {
      primary.pause();
      primary.currentTime = 0;
      if (secondary) { secondary.pause(); secondary.currentTime = 0; secondary.volume = 0; }
      releasePlayback();
      setStateAndRef('idle');
    };

    if (fadeOutStartedRef.current) {
      // Fade OUT already in progress — snap both to 0 and stop
      clearRamps();
      primary.volume = 0;
      if (secondary) secondary.volume = 0;
      doStop();
      console.log('[BackgroundMusic] Stopped (fade-out already ran)');
    } else if (stateRef.current === 'playing') {
      clearRamps();
      const promises: Promise<void>[] = [
        rampVolume(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
      ];
      if (secondary && secondary.volume > 0) {
        promises.push(rampVolume(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
      }
      Promise.all(promises).then(() => {
        doStop();
        console.log('[BackgroundMusic] Stopped');
      });
    } else {
      doStop();
    }
  }, [clearRamps, rampVolume, setStateAndRef]);

  // ─── Start Fade OUT (pre-emptive, 9s before session end) ─────────────────

  const startFadeOut = useCallback(() => {
    if (!backgroundMusicEnabled) return;
    if (stateRef.current !== 'playing') {
      console.log('[BackgroundMusic] startFadeOut skipped — not playing, state:', stateRef.current);
      return;
    }
    if (fadeOutStartedRef.current) return;

    fadeOutStartedRef.current   = true;
    crossfadeEnabledRef.current = false;
    clearRamps();
    if (crossfadeTimerRef.current) { window.clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }

    const primary   = primaryRef.current;
    const secondary = secondaryRef.current;
    if (!primary) return;

    const promises: Promise<void>[] = [
      rampVolume(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
    ];
    if (secondary && secondary.volume > 0) {
      promises.push(rampVolume(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
    }

    Promise.all(promises).then(() => {
      console.log('[BackgroundMusic] Pre-emptive fade OUT complete');
    });

    console.log('[BackgroundMusic] Pre-emptive fade OUT started (9s)');
  }, [backgroundMusicEnabled, clearRamps, rampVolume]);

  // ─── Volume sync (user slider change) ────────────────────────────────────

  useEffect(() => {
    if (stateRef.current !== 'playing') return;
    const primary = primaryRef.current;
    if (!primary) return;
    // Never interrupt a running 9s fade IN
    if (fadeInRampRef.current !== null) return;
    rampVolume(primary, backgroundMusicVolume, 300, volumeSyncRampRef);
  }, [backgroundMusicVolume, rampVolume]);

  // ─── Auto-play retry on Safari unlock ────────────────────────────────────
  // When play() is blocked by autoplay policy (NotAllowedError), pendingPlayRef
  // is set. On next user gesture, unlockSharedAudioContext() fires all listeners
  // — we retry playInternal() here once the audio pipeline is unblocked.

  useEffect(() => {
    const unsub = onAudioUnlock(() => {
      if (pendingPlayRef.current && stateRef.current === 'idle') {
        pendingPlayRef.current = false;
        // Ensure volume is reset to 0 before retry so fade IN always starts from silence
        if (primaryRef.current) primaryRef.current.volume = 0;
        void playInternal();
      }
    });
    return unsub;
  }, [playInternal]);

  // ─── Auto-load on track selection ────────────────────────────────────────

  useEffect(() => {
    if (selectedTrackSlug) {
      const currentSlug = currentTrack?.slug;
      if (currentSlug !== selectedTrackSlug) {
        void setTrack(selectedTrackSlug);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackSlug]);

  // ─── Auto-pause when music disabled in settings ───────────────────────────

  useEffect(() => {
    if (!backgroundMusicEnabled && stateRef.current === 'playing') {
      pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundMusicEnabled]);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const syncRamp  = volumeSyncRampRef;
    const ramp2     = fadeOutRamp2Ref;
    return () => {
      crossfadeEnabledRef.current = false;
      clearRamps();
      if (syncRamp.current) window.clearInterval(syncRamp.current);
      if (ramp2.current)    window.clearInterval(ramp2.current);
      if (crossfadeTimerRef.current) window.clearTimeout(crossfadeTimerRef.current);
      if (stateRef.current === 'playing') releasePlayback();
      primaryRef.current?.pause();
      secondaryRef.current?.pause();
      if (trackUrlRef.current?.startsWith('blob:')) URL.revokeObjectURL(trackUrlRef.current);
    };
  }, [clearRamps]);

  return { play, pause, stop, startFadeOut, setTrack, fetchTracks, state, currentTrack, tracks };
}
