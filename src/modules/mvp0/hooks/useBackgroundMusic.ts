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
import { onAudioUnlock, acquirePlayback, releasePlayback, getPlatformLabel } from '../utils/sharedAudioContext';
import type { BackgroundTrack, MusicPlaybackState } from '../types/audio';

// ─── Constants ────────────────────────────────────────────────────────────────

const FADE_IN_DURATION_MS = 9000; // 9s fade in
// Exported so SessionEngineModal can schedule fade OUT trigger dynamically
// without hardcoding the 9s value — change here propagates everywhere.
export const FADE_OUT_DURATION_MS = 9000; // 9s fade out
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
}// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBackgroundMusic(options?: { volumeOverride?: number; isActive?: boolean }): BackgroundMusicAPI {
  const { backgroundMusicEnabled, backgroundMusicVolume, selectedTrackSlug } = useSessionSettings();

  // isActive: when false (modal not open), suppress auto-load and audio operations.
  // This prevents multiple mounted SessionEngineModal instances (tab carousel)
  // from fighting over the _isAnyInstancePlaying singleton lock.
  const isActive = options?.isActive ?? true;

  // Allow caller to override volume (e.g. SMART session uses smartMusicVolume)
  const effectiveVolume = options?.volumeOverride ?? backgroundMusicVolume;

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
  // Dedicated ramp ref for crossfade secondary fade IN — must NOT share fadeInRampRef
  // (primary fade IN uses fadeInRampRef; if crossfade reused it, it would cancel primary's fade IN)
  const crossfadeSecondaryRampRef = useRef<number | null>(null);
  // Dedicated ramp ref for crossfade primary fade OUT (rAF-based, separate from session fade OUT
  // which uses setInterval via fadeOutRamp2Ref)
  const crossfadePrimaryRampRef   = useRef<number | null>(null);

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
    if (fadeInRampRef.current)             { window.cancelAnimationFrame(fadeInRampRef.current);             fadeInRampRef.current             = null; }
    if (fadeOutRampRef.current)            { window.clearInterval(fadeOutRampRef.current);                   fadeOutRampRef.current            = null; }
    if (fadeOutRamp2Ref.current)           { window.clearInterval(fadeOutRamp2Ref.current);                  fadeOutRamp2Ref.current           = null; }
    if (crossfadeSecondaryRampRef.current) { window.cancelAnimationFrame(crossfadeSecondaryRampRef.current); crossfadeSecondaryRampRef.current = null; }
    if (crossfadePrimaryRampRef.current)   { window.cancelAnimationFrame(crossfadePrimaryRampRef.current);   crossfadePrimaryRampRef.current   = null; }
  }, []);

  const rampVolume = useCallback((
    el: HTMLAudioElement,
    targetVolume: number,
    durationMs: number,
    rampRef: React.MutableRefObject<number | null>,
  ): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any previous ramp on this ref
      if (rampRef.current) {
        window.cancelAnimationFrame(rampRef.current);
        rampRef.current = null;
      }

      const startVol = el.volume;
      const target   = Math.max(0, Math.min(1, targetVolume));
      const delta    = target - startVol;

      if (Math.abs(delta) < 0.001) {
        el.volume = target;
        resolve();
        return;
      }

      // Use requestAnimationFrame + wall-clock timestamps instead of setInterval.
      // setInterval is throttled on mobile Safari when the page loses focus or
      // when the device is under load — causing the fade IN to "jump" to full volume.
      // rAF runs on the compositor thread and is not throttled during active rendering.
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed  = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        el.volume = Math.max(0, Math.min(1, startVol + delta * progress));

        if (progress < 1) {
          rampRef.current = window.requestAnimationFrame(tick);
        } else {
          el.volume = target;
          rampRef.current = null;
          resolve();
        }
      };

      rampRef.current = window.requestAnimationFrame(tick);
    });
  }, []);

  // Separate interval-based ramp used exclusively for FADE OUT.
  // rAF is throttled on iOS PWA when the screen dims or the system is under load,
  // causing fade OUT to stall and then snap — audible as a sudden cut.
  // setInterval at 50ms is NOT throttled during active audio playback on iOS,
  // giving a smooth ~20 steps/second volume decrease.
  // rampRef stores the interval ID (reusing the same MutableRefObject type as rampVolume).
  const rampVolumeInterval = useCallback((
    el: HTMLAudioElement,
    targetVolume: number,
    durationMs: number,
    rampRef: React.MutableRefObject<number | null>,
  ): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any previous ramp on this ref
      if (rampRef.current) {
        window.clearInterval(rampRef.current);
        rampRef.current = null;
      }

      const startVol = el.volume;
      const target   = Math.max(0, Math.min(1, targetVolume));
      const delta    = target - startVol;

      if (Math.abs(delta) < 0.001) {
        el.volume = target;
        resolve();
        return;
      }

      const INTERVAL_MS = 50; // 20 steps/second — smooth and not throttled on iOS
      const startTime = performance.now();

      rampRef.current = window.setInterval(() => {
        const elapsed  = performance.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        el.volume = Math.max(0, Math.min(1, startVol + delta * progress));

        if (progress >= 1) {
          el.volume = target;
          if (rampRef.current) { window.clearInterval(rampRef.current); rampRef.current = null; }
          resolve();
        }
      }, INTERVAL_MS);
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

          // Fade secondary IN and primary OUT simultaneously for smooth crossfade.
          // crossfadeSecondaryRampRef is intentionally separate from fadeInRampRef —
          // primary may still be in its initial 9s fade IN; sharing the ref would cancel it.
          // crossfadePrimaryRampRef is intentionally separate from fadeOutRamp2Ref —
          // fadeOutRamp2Ref uses setInterval (for session fade OUT), crossfade uses rAF.
          rampVolume(secondary, effectiveVolume, CROSSFADE_BEFORE_END * 1000, crossfadeSecondaryRampRef);
          rampVolume(primary, 0, CROSSFADE_BEFORE_END * 1000, crossfadePrimaryRampRef);

          window.setTimeout(() => {
            // Final guard before swap — stop() may have been called during the overlap
            if (!crossfadeEnabledRef.current) {
              secondary.pause();
              secondary.volume = 0;
              return;
            }

            primary.pause();
            primary.currentTime = 0;
            primary.volume = 0;
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
  }, [effectiveVolume, rampVolume]);

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

    console.log('[BackgroundMusic] playInternal start', {
      platform: getPlatformLabel(),
      src: primary.src.slice(-40), // last 40 chars to avoid log spam
      readyState: primary.readyState,
      paused: primary.paused,
      volume: primary.volume,
      effectiveVolume,
    });

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
      primary.currentTime = 0; // reset position — cached audio may have non-zero currentTime from a previous session
      // Note: volume is intentionally NOT set to 0 here.
      // On iOS Safari/PWA, setting volume=0 BEFORE play() is ignored — iOS reinitialises
      // the audio session on play() and resets volume to its own default (1.0).
      // We set volume=0 AFTER play() resolves, when the audio session is active and
      // JS volume changes are honoured. See comment below.

      await primary.play();

      // iOS audio session fix: set volume to 0 AFTER play() resolves.
      // iOS initialises the audio session during play() and resets any pre-play volume=0
      // back to 1.0. Setting it here (post-play) ensures we start the fade IN ramp from 0,
      // not from 1. On desktop Safari/Chrome, volume was already 0 from previous stop(),
      // so this is a harmless re-assignment.
      primary.volume = 0;

      // iOS PWA fix: on iOS, play() resolves but audio may not be buffered yet (readyState < 3).
      // Starting rampVolume immediately causes fade IN to complete before audio actually plays
      // → user hears music "jump" to full volume when it finally buffers.
      // Fix: wait for 'canplay' if audio isn't ready yet, then start the ramp.
      // Fallback: if canplay never fires within 600ms (iOS can drop events in background tab),
      // start the ramp anyway — better than staying silent.
      // On desktop Safari / Chrome, readyState is typically 4 (HAVE_ENOUGH_DATA) already —
      // the condition is true immediately → no delay.
      // iOS audio session fix: even when readyState >= 3 (audio buffered), iOS needs a
      // brief moment after play() resolves before it honours volume changes via JS.
      // If we start rampVolume immediately after play(), iOS ignores the first few frames
      // → volume stays at 0 → no fade IN heard, or volume "jumps" when session finally activates.
      // Fix: always defer ramp start by one macrotask (setTimeout 0) on ALL platforms.
      // On desktop Safari/Chrome this is imperceptible (~4ms = one rAF frame).
      // On iOS this gives the audio session time to activate before we start changing volume.
      //
      // Additionally, on iOS PWA, readyState can be < 3 even after play() resolves (audio not
      // yet fully buffered from CDN). In that case we also wait for canplay event, with a
      // 600ms safety timeout in case the event never fires.

      const startFadeInRamp = (trigger: string) => {
        if (stateRef.current !== 'playing') {
          console.warn('[BackgroundMusic] fade IN ramp skipped — state changed before trigger', {
            platform: getPlatformLabel(),
            trigger,
            state: stateRef.current,
          });
          return;
        }
        console.log(`[BackgroundMusic] fade IN ramp starting (trigger: ${trigger})`, {
          platform: getPlatformLabel(),
          readyState: primary.readyState,
          volume: primary.volume,
        });
        void rampVolume(primary, effectiveVolume, FADE_IN_DURATION_MS, fadeInRampRef);
      };

      if (primary.readyState >= 3) {
        // Audio fully buffered — defer by one macrotask to let iOS audio session activate
        console.log('[BackgroundMusic] readyState ready — deferring fade IN by 1 tick', {
          platform: getPlatformLabel(),
          readyState: primary.readyState,
        });
        window.setTimeout(() => startFadeInRamp('readyState-deferred'), 0);
      } else {
        // Audio not yet buffered (iOS PWA / slow network) — wait for canplay event
        console.log('[BackgroundMusic] readyState < 3 — waiting for canplay before fade IN', {
          platform: getPlatformLabel(),
          readyState: primary.readyState,
        });
        let canPlayFired = false;

        const startRamp = (trigger: 'canplay' | 'timeout') => {
          if (canPlayFired) return; // deduplicate — only start ramp once
          canPlayFired = true;
          primary.removeEventListener('canplay', onCanPlay);
          console.log(`[BackgroundMusic] fade IN ramp triggered by: ${trigger}`, {
            platform: getPlatformLabel(),
            readyState: primary.readyState,
            paused: primary.paused,
          });
          // Extra defer here too — same iOS session activation issue applies
          window.setTimeout(() => startFadeInRamp(trigger), 0);
        };

        const onCanPlay = () => startRamp('canplay');
        primary.addEventListener('canplay', onCanPlay);

        // Safety fallback: if canplay never fires (iOS can suppress events in PWA),
        // start ramp after 600ms anyway — audio is likely playing even without the event.
        window.setTimeout(() => startRamp('timeout'), 600);
      }
      scheduleCrossfade(primary);

      // Resume automatically when OS pauses audio due to device switch
      // (e.g. headphones connected/disconnected). Without this, music stops silently.
      //
      // iOS PWA issue: iOS fires a 'pause' event immediately after play() as part of
      // its internal audio session initialisation. If we call play() again in response,
      // iOS reinitialises the session and resets volume to 1.0 — destroying the fade IN
      // ramp that starts from 0. Fix: record the play() timestamp and ignore any pause
      // event that arrives within 800ms of it (that's the iOS init pause, not a real
      // external pause). Real headphones-disconnect pauses arrive later.
      const playStartedAt = Date.now();
      const INIT_PAUSE_GRACE_MS = 800;

      const handleExternalPause = () => {
        const msSincePlay = Date.now() - playStartedAt;
        if (msSincePlay < INIT_PAUSE_GRACE_MS) {
          // iOS initialisation pause — ignore, do NOT re-play() (would reset volume to 1)
          console.log('[BackgroundMusic] Ignoring early pause event (iOS session init)', {
            platform: getPlatformLabel(),
            msSincePlay,
          });
          return;
        }
        if (stateRef.current === 'playing' && crossfadeEnabledRef.current) {
          console.log('[BackgroundMusic] External pause detected — resuming', {
            platform: getPlatformLabel(),
            msSincePlay,
          });
          primary.play().catch(() => null);
        }
      };
      primary.addEventListener('pause', handleExternalPause);

      console.log('[BackgroundMusic] Playing with fade IN');

      // Inform iOS that this is a media playback session (not a notification/ringer sound).
      // Without this, iOS PWA may classify the audio as "ambient" and allow the hardware
      // ringer switch to mute it. Setting mediaSession.metadata + playbackState tells iOS
      // to treat it as active media → immune to the ringer switch.
      // Safe on desktop — mediaSession is a no-op or supported enhancement.
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack?.name ?? 'DechBar',
            artist: 'DechBar',
            album: 'Dechová cvičení',
          });
          navigator.mediaSession.playbackState = 'playing';
        } catch {
          // mediaSession not fully supported — silent skip
        }
      }
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
  }, [effectiveVolume, clearRamps, rampVolume, scheduleCrossfade, setStateAndRef]);

  // ─── Play (public) ───────────────────────────────────────────────────────

  const play = useCallback(async () => {
    // Note: intentionally no backgroundMusicEnabled check here.
    // The caller (SessionEngineModal) is responsible for deciding whether to call play().
    // This allows SMART sessions to use smartMusicEnabled independently of backgroundMusicEnabled.

    const currentState = stateRef.current;

    console.log('[BackgroundMusic] play() called', {
      platform: getPlatformLabel(),
      state: currentState,
      isActive,
      pendingPlay: pendingPlayRef.current,
      hasSrc: !!(primaryRef.current?.src && primaryRef.current.src !== window.location.href),
      setTrackInProgress: setTrackInProgressRef.current,
    });

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
      rampVolumeInterval(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
    ];
    if (secondary && secondary.volume > 0) {
      promises.push(rampVolumeInterval(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
    }

    Promise.all(promises).then(() => {
      primary.pause();
      secondary?.pause();
      releasePlayback();
      setStateAndRef('paused');
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = 'paused'; } catch { /* silent */ }
      }
      console.log('[BackgroundMusic] Paused');
    });
  }, [clearRamps, rampVolumeInterval, setStateAndRef]);

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
      // Inform iOS the media session is no longer active
      if ('mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = 'none'; } catch { /* silent */ }
      }
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
        rampVolumeInterval(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
      ];
      if (secondary && secondary.volume > 0) {
        promises.push(rampVolumeInterval(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
      }
      Promise.all(promises).then(() => {
        doStop();
        console.log('[BackgroundMusic] Stopped');
      });
    } else {
      doStop();
    }
  }, [clearRamps, rampVolumeInterval, setStateAndRef]);

  // ─── Start Fade OUT (pre-emptive, 9s before session end) ─────────────────

  const startFadeOut = useCallback(() => {
    // No toggle check here — caller (SessionEngineModal) decides whether music is enabled.
    // backgroundMusicEnabled guard was wrong for SMART sessions which use smartMusicEnabled.
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
      rampVolumeInterval(primary, 0, FADE_OUT_DURATION_MS, fadeOutRampRef),
    ];
    if (secondary && secondary.volume > 0) {
      promises.push(rampVolumeInterval(secondary, 0, FADE_OUT_DURATION_MS, fadeOutRamp2Ref));
    }

    Promise.all(promises).then(() => {
      // iOS fix: after fade OUT ramp completes, explicitly pause() both elements.
      // On iOS, HTMLAudioElement.volume = 0 may be overridden by the system audio session
      // (hardware volume control). Without pause(), audio continues playing at system volume
      // even though element.volume is 0. Calling pause() here ensures silence on all platforms.
      // On desktop Safari, pause() after volume=0 is harmless.
      primary.pause();
      if (secondary && secondary.volume <= 0.01) secondary.pause();
      console.log('[BackgroundMusic] Pre-emptive fade OUT complete — audio paused');
    });

    console.log('[BackgroundMusic] Pre-emptive fade OUT started (9s)');
  }, [clearRamps, rampVolumeInterval]);

  // ─── Volume sync (user slider change) ────────────────────────────────────

  useEffect(() => {
    if (stateRef.current !== 'playing') return;
    const primary = primaryRef.current;
    if (!primary) return;
    // Never interrupt a running 9s fade IN
    if (fadeInRampRef.current !== null) return;
    rampVolume(primary, effectiveVolume, 300, volumeSyncRampRef);
  }, [effectiveVolume, rampVolume]);

  // ─── Auto-play retry on Safari unlock ────────────────────────────────────
  // When play() is blocked by autoplay policy (NotAllowedError), pendingPlayRef
  // is set. On next user gesture, unlockSharedAudioContext() fires all listeners
  // — we retry playInternal() here once the audio pipeline is unblocked.
  // Guard: only retry if sessionState is still 'idle' AND we are NOT currently
  // playing — prevents double play() if music already started between unlock and callback.

  useEffect(() => {
    const unsub = onAudioUnlock(() => {
      // Only retry play if this modal instance is the active one
      if (!isActive) return;
      // Only retry if there is a pending play AND music is not already playing/loading
      if (pendingPlayRef.current && stateRef.current === 'idle') {
        pendingPlayRef.current = false;
        // Ensure volume is reset to 0 before retry so fade IN always starts from silence
        if (primaryRef.current) primaryRef.current.volume = 0;
        console.log('[BackgroundMusic] onAudioUnlock: retrying pendingPlay', { platform: getPlatformLabel(), state: stateRef.current });
        void playInternal();
      } else {
        // No retry needed — clear stale pending flag to prevent future spurious retries
        console.log('[BackgroundMusic] onAudioUnlock: no retry needed', { platform: getPlatformLabel(), state: stateRef.current, pendingPlay: pendingPlayRef.current });
        pendingPlayRef.current = false;
      }
    });
    return unsub;
  }, [playInternal, isActive]);

  // ─── Auto-load on track selection ────────────────────────────────────────

  useEffect(() => {
    // Only auto-load when modal is open — prevents multiple SessionEngineModal instances
    // (tab carousel pre-renders all pages) from all loading tracks and fighting over
    // the singleton lock.
    if (!isActive) return;
    if (selectedTrackSlug) {
      const currentSlug = currentTrack?.slug;
      if (currentSlug !== selectedTrackSlug) {
        void setTrack(selectedTrackSlug);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackSlug, isActive]);

  // ─── Auto-pause when music disabled in settings ───────────────────────────
  // Note: only reacts to backgroundMusicEnabled — SMART sessions manage their
  // own lifecycle through SessionEngineModal, not this auto-effect.

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
