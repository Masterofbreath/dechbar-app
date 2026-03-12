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

// ─── Global registry of scheduled breathing cue nodes ────────────────────────
// Every OscillatorNode created by scheduleSharedTone (for cues, not bells) is
// registered here. cancelAllScheduledNodes() is the single reliable kill-switch
// for all pre-scheduled cues — used when session ends or is abandoned.
//
// Bells (scheduleBells / scheduleSharedTone with isBell=true) are NOT registered
// here — they have their own cancel functions via scheduleBells() return value.

interface ScheduledNode {
  osc: OscillatorNode;
  gain: GainNode;
  stopAt: number; // ctx.currentTime when node stops (for cleanup)
}

const _scheduledCueNodes: Set<ScheduledNode> = new Set();

/** Cancel all pre-scheduled breathing cue nodes — call on session end/abandon. */
export function cancelAllScheduledCueNodes(): void {
  const count = _scheduledCueNodes.size;
  console.log('[SharedAudio] cancelAllScheduledCueNodes —', count, 'nodes', { platform: getPlatformLabel() });
  _scheduledCueNodes.forEach(({ osc, gain }) => {
    try { osc.stop();        } catch { /* already stopped */ }
    try { osc.disconnect();  } catch { /* already disconnected */ }
    try { gain.disconnect(); } catch { /* already disconnected */ }
  });
  _scheduledCueNodes.clear();
}

/** How many cue nodes are currently scheduled (diagnostic). */
export function getScheduledCueNodeCount(): number {
  return _scheduledCueNodes.size;
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
        const newState = _ctx.state;
        console.log('[SharedAudio] statechange →', newState, {
          platform: getPlatformLabel(),
          currentTime: _ctx.currentTime,
          scheduledCueNodes: _scheduledCueNodes.size,
        });
        if (newState === 'running') {
          _wasEverRunning = true;
        }
        // Only auto-resume if context was already running before — this is a real interruption
        // (e.g. phone call), not the initial suspended-before-gesture state.
        if (newState === 'suspended' && _wasEverRunning) {
          console.log('[SharedAudio] statechange → suspended (was running) — auto-resuming', { platform: getPlatformLabel() });
          void _ctx.resume();
        }
        // Release singleton playback lock when context is interrupted/closed.
        // On iOS PWA, the context can be destroyed while music is playing.
        if (newState === 'closed' || newState === ('interrupted' as AudioContextState)) {
          console.log('[SharedAudio] statechange → closed/interrupted — releasing playback lock + clearing scheduled nodes', {
            state: newState, platform: getPlatformLabel(), scheduledCueNodes: _scheduledCueNodes.size,
          });
          releasePlayback();
          // Pre-scheduled nodes on this context are now dead — clear registry.
          // They'll be rescheduled on new context when session resumes.
          _scheduledCueNodes.clear();
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
 * Handles all three non-running states:
 *   - suspended   → ctx.resume() (standard path)
 *   - interrupted → null _ctx, create fresh context, resume() it
 *   - closed      → null _ctx, create fresh context (getSharedAudioContext() handles it)
 */
export function unlockSharedAudioContext(): void {
  try {
    // If interrupted, force-recreate the context before resuming.
    // iOS sets 'interrupted' on lock screen / phone call — ctx.resume() alone
    // does NOT transition it back to 'running'. A fresh context is required.
    if (_ctx?.state === ('interrupted' as AudioContextState)) {
      console.log('[SharedAudio] unlockSharedAudioContext: ctx interrupted — recreating', { platform: getPlatformLabel() });
      _ctx = null; // force getSharedAudioContext() to create fresh one
    }

    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const stateBefore = ctx.state;

    // Resume suspended context (Safari suspends on creation outside gesture)
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    // Play a 1-frame silent buffer — satisfies Safari's "audio was played" requirement
    // Also works as a no-op heartbeat to keep the audio session alive on iOS PWA.
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
 * Force-resume the shared AudioContext after returning from background (lock screen / app switch).
 *
 * iOS can set AudioContext to 'suspended' OR 'interrupted' on lock:
 *   - suspended   → ctx.resume() suffices
 *   - interrupted → must null _ctx and create a fresh context (resume() alone won't work)
 *
 * Returns a Promise that resolves when the context is running (best-effort).
 */
export async function resumeSharedAudioContext(): Promise<void> {
  try {
    // Handle interrupted state — same as in unlockSharedAudioContext
    if (_ctx?.state === ('interrupted' as AudioContextState)) {
      console.log('[SharedAudio] resumeSharedAudioContext: ctx interrupted — recreating', { platform: getPlatformLabel() });
      _ctx = null;
    }

    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'running') {
      console.log('[SharedAudio] resumeSharedAudioContext: already running', { platform: getPlatformLabel() });
      return;
    }

    console.log('[SharedAudio] resumeSharedAudioContext — state was:', ctx.state, { platform: getPlatformLabel() });
    await ctx.resume();
    console.log('[SharedAudio] resumeSharedAudioContext — state now:', ctx.state, { platform: getPlatformLabel() });

    // Play a silent 1-frame buffer to re-anchor the audio session to the active MediaSession
    // (iOS resets the session association after lock-screen unlock)
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (err) {
    console.warn('[SharedAudio] resumeSharedAudioContext failed:', err);
  }
}

/**
 * Like scheduleSharedTone() but async-safe — waits for ctx.resume() if context
 * is suspended or interrupted before scheduling the tone.
 *
 * USE THIS for scheduling cues AFTER lock-screen recovery, where the context
 * may still be in the process of resuming when visibilitychange fires.
 *
 * NOT suitable for synchronous gesture handlers — use scheduleSharedTone() there.
 */
export async function scheduleSharedToneAsync(
  hz: number,
  duration: number,
  volume: number,
  delaySeconds: number,
  isBell = false,
): Promise<(() => void) | null> {
  try {
    // Recreate if interrupted — iOS sets 'interrupted' after lock; ctx.resume() won't work
    if (_ctx?.state === ('interrupted' as AudioContextState)) {
      console.log('[SharedAudio] scheduleSharedToneAsync: ctx interrupted — recreating before schedule', {
        platform: getPlatformLabel(), hz, delaySeconds,
      });
      _ctx = null;
    }

    const ctx = getSharedAudioContext();
    if (!ctx) return null;

    if (ctx.state !== 'running') {
      console.log('[SharedAudio] scheduleSharedToneAsync: awaiting resume()', {
        platform: getPlatformLabel(), ctxState: ctx.state, hz, delaySeconds,
        currentTime: ctx.currentTime,
      });
      await ctx.resume();
      console.log('[SharedAudio] scheduleSharedToneAsync: after resume()', {
        platform: getPlatformLabel(), ctxState: ctx.state, hz,
        currentTime: ctx.currentTime,
      });
    }

    if (ctx.state !== 'running') {
      console.warn('[SharedAudio] scheduleSharedToneAsync: ctx still not running after resume() — DROPPING tone', {
        platform: getPlatformLabel(), ctxState: ctx.state, hz, delaySeconds,
      });
      return null;
    }

    const cancelFn = scheduleSharedTone(hz, duration, volume, Math.max(0.01, delaySeconds), isBell);
    return cancelFn;
  } catch (err) {
    console.warn('[SharedAudio] scheduleSharedToneAsync failed:', err);
    return null;
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

    // iOS-specific: AudioContext can enter 'interrupted' state (phone call, lock screen, app switch).
    // On desktop Safari this state never occurs. When interrupted, we force-recreate the context
    // by nulling _ctx — getSharedAudioContext() will create a fresh one on next call.
    // We then attempt to play the tone on the new context after a short delay.
    if (ctx.state === ('interrupted' as AudioContextState)) {
      console.warn(`[SharedAudio] playSharedTone: ctx interrupted — recreating context for hz=${hz}`, { platform: getPlatformLabel() });
      _ctx = null; // force recreation on next getSharedAudioContext() call
      // Small delay to let iOS finalize the interruption before creating new context
      window.setTimeout(() => {
        const freshCtx = getSharedAudioContext();
        if (freshCtx && freshCtx.state === 'running') {
          playToneOnContext(freshCtx, hz, duration, volume, isBell, 0.015);
        } else if (freshCtx && freshCtx.state === 'suspended') {
          void freshCtx.resume().then(() => {
            playToneOnContext(freshCtx, hz, duration, volume, isBell, 0.015);
          });
        }
      }, 300);
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

    // Register non-bell cue nodes in global registry for cancelAllScheduledCueNodes()
    const nodeEntry: ScheduledNode | null = !isBell ? { osc, gain, stopAt } : null;
    if (nodeEntry) _scheduledCueNodes.add(nodeEntry);

    // Auto-remove from registry when node naturally finishes
    if (!isBell) {
      osc.addEventListener('ended', () => {
        if (nodeEntry) _scheduledCueNodes.delete(nodeEntry);
      });
    }

    // Return cancel function — disconnects node before it fires
    return () => {
      try {
        if (nodeEntry) _scheduledCueNodes.delete(nodeEntry);
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
