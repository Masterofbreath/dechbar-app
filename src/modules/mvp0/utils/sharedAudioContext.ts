/**
 * sharedAudioContext — Singleton Web Audio API context
 *
 * Safari (and iOS WebView / Capacitor) require that AudioContext is:
 *   1. Created OR resumed directly inside a synchronous user gesture handler.
 *   2. Reused across all audio operations — never recreated per-tone.
 *
 * This module maintains a single AudioContext for the entire app lifetime.
 * Call `unlockSharedAudioContext()` inside every user gesture handler that
 * leads to audio playback (button click, tap, etc.).
 *
 * @package DechBar_App
 * @subpackage MVP0/Utils
 */

type WebKitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// ─── Platform detection ───────────────────────────────────────────────────────
// Used in diagnostic logs to distinguish iOS Safari / desktop Safari / PWA / Chrome.
// Read-only — never used for feature branching (platform-specific code paths
// should use capability detection, not UA sniffing).

export function getPlatformLabel(): string {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  const isChrome = /Chrome|CriOS/.test(ua);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

  if (isIOS && isPWA) return 'iOS-PWA';
  if (isIOS && isSafari) return 'iOS-Safari';
  if (isIOS && isChrome) return 'iOS-Chrome';
  if (isIOS) return 'iOS-other';
  if (isSafari) return 'desktop-Safari';
  if (isChrome) return 'desktop-Chrome';
  return 'other';
}

let _ctx: AudioContext | null = null;

// Module-level playback guard — only ONE useBackgroundMusic instance may play at a time.
// Set to true when any instance starts playing, false when it stops.
// Prevents duplicate audio when SessionEngineModal is mounted in multiple page tabs.
let _isAnyInstancePlaying = false;

export function acquirePlayback(): boolean {
  if (_isAnyInstancePlaying) return false;
  _isAnyInstancePlaying = true;
  return true;
}

export function releasePlayback(): void {
  _isAnyInstancePlaying = false;
}

// Listeners notified after each successful unlock — used by useBackgroundMusic
// to retry play() when it was blocked by Safari autoplay policy.
const _unlockListeners = new Set<() => void>();

/** Subscribe to unlock events. Returns unsubscribe function. */
export function onAudioUnlock(cb: () => void): () => void {
  _unlockListeners.add(cb);
  return () => _unlockListeners.delete(cb);
}

/**
 * Returns the shared AudioContext, creating it if needed.
 * Safe to call anywhere — but `resume()` must be called from a user gesture.
 */
export function getSharedAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ?? (window as WebKitWindow).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new AudioCtx();
      console.log('[SharedAudio] AudioContext created', {
        platform: getPlatformLabel(),
        state: _ctx.state,
        sampleRate: _ctx.sampleRate,
      });

      // Oprava #3: Auto-resume on statechange — handles iOS Safari interruptions
      // (phone call, notification, app backgrounding) which suspend the context AFTER
      // it was already running. We track whether the context was ever running to avoid
      // calling resume() on the initial suspended state (before first user gesture) —
      // that would cause Safari desktop to reject the resume and potentially close the context.
      let _wasEverRunning = false;
      _ctx.addEventListener('statechange', () => {
        if (!_ctx) return;
        if (_ctx.state === 'running') {
          _wasEverRunning = true;
        }
        // Only auto-resume if context was already running before — this is a real interruption
        // (e.g. phone call), not the initial suspended-before-gesture state.
        if (_ctx.state === 'suspended' && _wasEverRunning) {
          console.log('[SharedAudio] statechange → suspended (was running) — auto-resuming', { platform: getPlatformLabel() });
          void _ctx.resume();
        }
        // Oprava #4: Release singleton playback lock when context is interrupted/closed.
        // On iOS PWA, the context can be destroyed while music is playing.
        // _isAnyInstancePlaying stays true → new play() is permanently blocked.
        if (_ctx.state === 'closed' || _ctx.state === ('interrupted' as AudioContextState)) {
          console.log('[SharedAudio] statechange → closed/interrupted — releasing playback lock', { state: _ctx.state, platform: getPlatformLabel() });
          releasePlayback();
        }
      });
    }
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Must be called synchronously inside a user gesture handler.
 * Resumes the shared context so subsequent audio calls (even async) work on
 * Safari / iOS / Capacitor.
 *
 * Also plays a 0-volume silent buffer on all existing HTMLAudioElements to
 * unlock the media pipeline — required for Safari autoplay policy.
 */
export function unlockSharedAudioContext(): void {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const stateBefore = ctx.state;

    // Resume suspended context (Safari suspends on creation outside gesture)
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    // Play a 1-frame silent buffer — satisfies Safari's "audio was played" requirement
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    console.log('[SharedAudio] unlockSharedAudioContext', {
      platform: getPlatformLabel(),
      stateBefore,
      stateAfter: ctx.state,
      currentTime: ctx.currentTime,
    });

    // Notify subscribers (e.g. useBackgroundMusic retry) after unlock
    _unlockListeners.forEach(cb => { try { cb(); } catch { /* ignore */ } });
  } catch {
    // Best-effort — never throw from gesture handlers
  }
}

/**
 * Play a generated tone using the shared AudioContext.
 * Safe to call from async contexts (setInterval, setTimeout, Promise.then)
 * AFTER unlockSharedAudioContext() was called from a user gesture.
 *
 * @param hz        Frequency in Hz
 * @param duration  Duration in seconds
 * @param volume    Volume 0..1
 * @param isBell    true = triangle wave + exponential decay (bowl/bell feel)
 *                  false = sine wave + soft attack (cue feel)
 */
export function playSharedTone(
  hz: number,
  duration: number,
  volume: number,
  isBell = false,
): void {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) { console.warn('[SharedAudio] playSharedTone: no context'); return; }

    // If suspended, attempt resume and schedule the tone for after resume.
    // (unlockSharedAudioContext should have been called from the gesture handler,
    //  but the resume() Promise may not have resolved yet — race condition on Safari.)
    if (ctx.state === 'suspended') {
      console.warn(`[SharedAudio] playSharedTone: ctx suspended, resuming first (hz=${hz})`);
      void ctx.resume().then(() => {
        // Add a small start offset so the tone doesn't get scheduled into the past.
        // ctx.currentTime was frozen while suspended; after resume() it jumps forward.
        // Without offset, osc.start(frozenTime) is in the past → tone never plays on Safari.
        playToneOnContext(ctx, hz, duration, volume, isBell, 0.015);
      });
      return;
    }

    if (ctx.state !== 'running') {
      console.warn(`[SharedAudio] playSharedTone: ctx state=${ctx.state}, skipping hz=${hz}`);
      return;
    }

    playToneOnContext(ctx, hz, duration, volume, isBell, 0);
  } catch {
    // Web Audio not supported — silent skip
  }
}

/**
 * Schedule a generated tone to play at a future point on the Web Audio timeline.
 *
 * Unlike playSharedTone(), this function schedules the tone using an ABSOLUTE
 * ctx.currentTime offset — the AudioNode is created NOW (within the gesture call
 * stack) and will fire automatically when the timeline reaches `ctx.currentTime + delaySeconds`.
 *
 * This is the correct way to play bells during SMART prep countdown:
 *   - AudioContext must be `running` at the moment this is called (i.e. call from gesture)
 *   - No gesture token is needed when the tone actually fires (it fires via timeline)
 *   - Works identically on desktop Safari, mobile Safari, iOS PWA, Chrome
 *
 * Call this from a synchronous gesture handler (e.g. button click, screen tap)
 * AFTER unlockSharedAudioContext().
 *
 * @param hz            Frequency in Hz
 * @param duration      Duration in seconds
 * @param volume        Volume 0..1
 * @param delaySeconds  How many seconds from now to start the tone (0 = immediate)
 * @param isBell        true = triangle wave + exponential decay (bowl/bell feel)
 *
 * @returns A cancel function — call it to stop the scheduled tone before it fires.
 *          Returns null if context is not available or not running.
 */
export function scheduleSharedTone(
  hz: number,
  duration: number,
  volume: number,
  delaySeconds: number,
  isBell = false,
): (() => void) | null {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) {
      console.warn('[SharedAudio] scheduleSharedTone: no context');
      return null;
    }

    if (ctx.state !== 'running') {
      console.warn(`[SharedAudio] scheduleSharedTone: ctx state=${ctx.state} — not running, cannot schedule hz=${hz}`, { platform: getPlatformLabel(), currentTime: ctx.currentTime, delaySeconds });
      // Attempt resume and schedule after — best-effort fallback for unexpected suspension.
      if (ctx.state === 'suspended') {
        void ctx.resume().then(() => {
          playToneOnContext(ctx, hz, duration, volume, isBell, delaySeconds + 0.015);
        });
      }
      return null;
    }

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = hz;
    osc.type = isBell ? 'triangle' : 'sine';

    const startAt = ctx.currentTime + delaySeconds;
    const stopAt  = startAt + duration;

    console.log('[SharedAudio] scheduleSharedTone scheduled', {
      platform: getPlatformLabel(),
      hz, isBell, volume, delaySeconds,
      ctxState: ctx.state,
      currentTime: ctx.currentTime,
      startAt,
    });

    if (isBell) {
      gain.gain.setValueAtTime(volume, startAt);
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
    } else {
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(volume, startAt + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, stopAt);
    }

    osc.start(startAt);
    osc.stop(stopAt);

    // Return cancel function — disconnects node before it fires
    return () => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {
        // Already stopped or disconnected — ignore
      }
    };
  } catch (err) {
    console.warn('[SharedAudio] scheduleSharedTone failed:', err);
    return null;
  }
}

function playToneOnContext(
  ctx: AudioContext,
  hz: number,
  duration: number,
  volume: number,
  isBell: boolean,
  startOffset = 0,
): void {
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = hz;
    osc.type = isBell ? 'triangle' : 'sine';

    const now = ctx.currentTime + startOffset;
    if (isBell) {
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    osc.start(now);
    osc.stop(now + duration);
  } catch (err) {
    console.warn('[SharedAudio] playToneOnContext failed:', err);
  }
}
