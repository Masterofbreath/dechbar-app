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
    if (!ctx) return;

    // If still suspended after unlock attempt, silently skip
    if (ctx.state === 'suspended') return;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = hz;
    osc.type = isBell ? 'triangle' : 'sine';

    const now = ctx.currentTime;
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
  } catch {
    // Web Audio not supported — silent skip
  }
}
