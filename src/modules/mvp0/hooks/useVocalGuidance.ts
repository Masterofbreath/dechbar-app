/**
 * useVocalGuidance — Vocal Intelligence System
 *
 * Contextual vocal guidance hook that selects and plays audio snippets
 * during breathing sessions based on phase, session progress, user KP level,
 * exercise type, and intensity.
 *
 * Performance design:
 * - Only `isReady` state triggers re-renders
 * - All snippet data lives in refs (no re-render side effects)
 * - Cooldown + per-session count tracking in refs
 * - Caller must pass stable option values via refs where possible
 *
 * Safety rules (NEVER play snippet if):
 * - vocalGuidanceEnabled === false
 * - selectedVoicePackId === null
 * - phaseTimeRemaining * 1000 < snippet.duration_ms + 500
 * - Current cycle total < 4s (too fast)
 * - phase.type === 'silence' (preserve quiet)
 * - snippet.required_tier > userTier
 * - max_per_session exceeded (unless 0 = unlimited)
 * - cooldown_cycles not satisfied
 *
 * @package DechBar_App
 * @subpackage MVP0/Hooks
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/platform/api/supabase';
import { getCachedAudioFile, cacheAudioFile } from '../utils/audioCache';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { Exercise, ExercisePhase } from '../types/exercises';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UserTier = 'ZDARMA' | 'SMART' | 'AI_COACH';

const TIER_LEVEL: Record<UserTier, number> = {
  ZDARMA: 0,
  SMART: 1,
  AI_COACH: 2,
};

export type TriggerCondition =
  | 'PATTERN_INHALE_LONGER_EXHALE'
  | 'PATTERN_EXHALE_LONGER_INHALE'
  | 'PATTERN_HAS_HOLD_INHALE'
  | 'PATTERN_HAS_HOLD_EXHALE'
  | 'PATTERN_CYCLE_SHORT'
  | 'PATTERN_CYCLE_LONG'
  | 'KP_BEGINNER'
  | 'KP_INTERMEDIATE'
  | 'KP_ADVANCED'
  | 'KP_UNKNOWN'
  | 'SESSION_FIRST_QUARTER'
  | 'SESSION_MID'
  | 'SESSION_LAST_QUARTER'
  | 'INTENSITY_LOW'
  | 'INTENSITY_NORMAL'
  | 'INTENSITY_HIGH'
  | 'PHASE_FIRST'
  | 'PHASE_LAST'
  | 'PHASE_TRANSITION'
  | 'SILENCE_PHASE'
  | 'IS_PROTOCOL'
  | 'IS_SIMPLE_EXERCISE'
  | 'IS_MULTI_PHASE'
  | 'TIER_SMART_OR_ABOVE';

interface VocalSnippet {
  id: string;
  voice_pack_id: string;
  snippet_key: string;
  voice_category: string;
  cdn_url: string;
  phase_context: string;
  session_moment: string;
  trigger_conditions: string[];
  cooldown_cycles: number;
  max_per_session: number;
  priority: number;
  required_tier: string;
  duration_ms: number | null;
  is_active: boolean;
}

export interface VocalGuidanceOptions {
  exercise: Exercise;
  currentPhaseIndex: number;
  totalPhases: number;
  phaseTimeRemaining: number;
  sessionProgress: number;           // 0-100
  currentInstruction: string;
  elapsedSessionSeconds: number;
  intensityStep: number;             // 0-4
  multiplier: number;                // 0.5-1.5
  currentKP: number | null;
  baselineKP: number | null;
  userTier: UserTier;
  selectedVoicePackId: string | null;
  vocalVolume: number;
  vocalGuidanceEnabled: boolean;
}

export interface VocalGuidanceAPI {
  triggerPhaseStart: (phaseIndex: number) => void;
  triggerIntensityChange: (direction: 'up' | 'down') => void;
  preloadSnippets: () => Promise<void>;
  isReady: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tier check helper
// ─────────────────────────────────────────────────────────────────────────────

function canAccessTier(required: string, userTier: UserTier): boolean {
  return (TIER_LEVEL[userTier] ?? 0) >= (TIER_LEVEL[required as UserTier] ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluate trigger conditions (AND logic)
// ─────────────────────────────────────────────────────────────────────────────

function evaluateConditions(
  conditions: string[],
  opts: VocalGuidanceOptions,
): boolean {
  if (conditions.length === 0) return true;

  const currentPhase: ExercisePhase | undefined =
    opts.exercise.breathing_pattern.phases[opts.currentPhaseIndex];

  const pattern = currentPhase?.pattern ?? null;

  // Calculate cycle duration for speed checks
  const cycleDuration = pattern
    ? pattern.inhale_seconds + pattern.hold_after_inhale_seconds +
      pattern.exhale_seconds + pattern.hold_after_exhale_seconds
    : 0;

  return conditions.every((cond) => {
    switch (cond as TriggerCondition) {
      case 'PATTERN_INHALE_LONGER_EXHALE':
        return pattern ? pattern.inhale_seconds > pattern.exhale_seconds : false;
      case 'PATTERN_EXHALE_LONGER_INHALE':
        return pattern ? pattern.exhale_seconds > pattern.inhale_seconds : false;
      case 'PATTERN_HAS_HOLD_INHALE':
        return pattern ? pattern.hold_after_inhale_seconds > 0 : false;
      case 'PATTERN_HAS_HOLD_EXHALE':
        return pattern ? pattern.hold_after_exhale_seconds > 0 : false;
      case 'PATTERN_CYCLE_SHORT':
        return cycleDuration > 0 && cycleDuration < 6;
      case 'PATTERN_CYCLE_LONG':
        return cycleDuration > 12;

      case 'KP_BEGINNER':
        return opts.currentKP !== null && opts.currentKP < 20;
      case 'KP_INTERMEDIATE':
        return opts.currentKP !== null && opts.currentKP >= 20 && opts.currentKP < 40;
      case 'KP_ADVANCED':
        return opts.currentKP !== null && opts.currentKP >= 40;
      case 'KP_UNKNOWN':
        return opts.currentKP === null;

      case 'SESSION_FIRST_QUARTER':
        return opts.sessionProgress < 25;
      case 'SESSION_MID':
        return opts.sessionProgress >= 25 && opts.sessionProgress < 75;
      case 'SESSION_LAST_QUARTER':
        return opts.sessionProgress >= 75;

      case 'INTENSITY_LOW':
        return opts.intensityStep <= 1;
      case 'INTENSITY_NORMAL':
        return opts.intensityStep === 2;
      case 'INTENSITY_HIGH':
        return opts.intensityStep >= 3;

      case 'PHASE_FIRST':
        return opts.currentPhaseIndex === 0;
      case 'PHASE_LAST':
        return opts.currentPhaseIndex === opts.totalPhases - 1;
      case 'PHASE_TRANSITION':
        return true; // Caller only invokes on transition, so always true when we get here

      case 'SILENCE_PHASE':
        return currentPhase?.type === 'silence';
      case 'IS_PROTOCOL':
        return isProtocol(opts.exercise);
      case 'IS_SIMPLE_EXERCISE':
        return opts.exercise.breathing_pattern.type === 'simple';
      case 'IS_MULTI_PHASE':
        return opts.exercise.breathing_pattern.type === 'multi-phase';
      case 'TIER_SMART_OR_ABOVE':
        return opts.userTier !== 'ZDARMA';

      default:
        return true;
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Audio cache + load helper
// ─────────────────────────────────────────────────────────────────────────────

async function loadAudioUrl(cdnUrl: string): Promise<string> {
  try {
    const cached = await getCachedAudioFile(cdnUrl);
    if (cached) return URL.createObjectURL(cached.blob);
    // mode: 'cors' required for Safari cross-origin audio fetch
    const res = await fetch(cdnUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    await cacheAudioFile(cdnUrl, blob);
    return URL.createObjectURL(blob);
  } catch {
    return cdnUrl; // Fallback to streaming
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useVocalGuidance(opts: VocalGuidanceOptions): VocalGuidanceAPI {
  const [isReady, setIsReady] = useState(false);

  // All runtime data lives in refs — no re-renders
  const snippetsRef = useRef<VocalSnippet[]>([]);
  const blobUrlsRef = useRef<Map<string, string>>(new Map()); // cdn_url → blob URL
  const cooldownMapRef = useRef<Map<string, number>>(new Map()); // snippet_key → last_played_cycle
  const perSessionCountRef = useRef<Map<string, number>>(new Map()); // snippet_key → count
  const currentCycleRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  // Keep a stable ref to opts so callbacks don't become stale
  const optsRef = useRef<VocalGuidanceOptions>(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  // ── preloadSnippets ─────────────────────────────────────────────────────────

  const preloadSnippets = useCallback(async () => {
    const { selectedVoicePackId, vocalGuidanceEnabled } = optsRef.current;

    if (!vocalGuidanceEnabled || !selectedVoicePackId) {
      setIsReady(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vocal_snippets')
        .select('*')
        .eq('voice_pack_id', selectedVoicePackId)
        .eq('is_active', true);

      if (error) throw error;

      snippetsRef.current = (data ?? []) as VocalSnippet[];

      // Preload up to first 10 snippets (avoid large upfront bandwidth)
      const toPreload = snippetsRef.current.slice(0, 10);
      await Promise.allSettled(
        toPreload.map(async (snippet) => {
          if (!blobUrlsRef.current.has(snippet.cdn_url)) {
            const blobUrl = await loadAudioUrl(snippet.cdn_url);
            blobUrlsRef.current.set(snippet.cdn_url, blobUrl);
          }
        })
      );

      setIsReady(true);
    } catch (err) {
      console.error('[VocalGuidance] Preload failed:', err);
      setIsReady(true); // Still set ready so we don't block session
    }
  }, []);

  // ── pickSnippet ─────────────────────────────────────────────────────────────

  const pickSnippet = useCallback((
    phaseContext: string,
    sessionMoment: string,
    categoryHint?: string,
  ): VocalSnippet | null => {
    const o = optsRef.current;

    if (!o.vocalGuidanceEnabled || !o.selectedVoicePackId) return null;
    if (snippetsRef.current.length === 0) return null;

    const currentPhase = o.exercise.breathing_pattern.phases[o.currentPhaseIndex];

    // Safety: never play during silence phase
    if (currentPhase?.type === 'silence') return null;

    // Safety: cycle too fast (< 4s total)
    const pattern = currentPhase?.pattern;
    if (pattern) {
      const cycleDuration =
        pattern.inhale_seconds + pattern.hold_after_inhale_seconds +
        pattern.exhale_seconds + pattern.hold_after_exhale_seconds;
      if (cycleDuration > 0 && cycleDuration < 4) return null;
    }

    const candidates = snippetsRef.current.filter((s) => {
      // Phase context
      if (s.phase_context !== 'any' && s.phase_context !== phaseContext) return false;

      // Session moment
      if (s.session_moment !== 'any') {
        const prog = o.sessionProgress;
        switch (s.session_moment) {
          case 'first_25pct':   if (prog >= 25) return false; break;
          case 'mid_50pct':     if (prog < 25 || prog >= 75) return false; break;
          case 'last_25pct':    if (prog < 75) return false; break;
          case 'first_cycle':   if (currentCycleRef.current > 0) return false; break;
        }
      }

      // Category hint
      if (categoryHint && s.voice_category !== categoryHint) return false;

      // Tier check
      if (!canAccessTier(s.required_tier, o.userTier)) return false;

      // Trigger conditions (AND)
      if (!evaluateConditions(s.trigger_conditions, o)) return false;

      // Safety: phaseTimeRemaining check
      if (s.duration_ms !== null) {
        if (o.phaseTimeRemaining * 1000 < s.duration_ms + 500) return false;
      }

      // Cooldown
      if (s.cooldown_cycles > 0) {
        const lastPlayed = cooldownMapRef.current.get(s.snippet_key) ?? -999;
        if (currentCycleRef.current - lastPlayed < s.cooldown_cycles) return false;
      }

      // Max per session
      if (s.max_per_session > 0) {
        const count = perSessionCountRef.current.get(s.snippet_key) ?? 0;
        if (count >= s.max_per_session) return false;
      }

      return true;
    });

    if (candidates.length === 0) return null;

    // Sort by priority (descending), then shuffle within same priority
    const maxPriority = Math.max(...candidates.map(c => c.priority));
    const topCandidates = candidates.filter(c => c.priority === maxPriority);

    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }, []);

  // ── playSnippet ─────────────────────────────────────────────────────────────

  const playSnippet = useCallback(async (snippet: VocalSnippet) => {
    if (isPlayingRef.current) return; // Don't overlap

    const { vocalVolume } = optsRef.current;

    try {
      isPlayingRef.current = true;

      // Lazily load audio if not preloaded
      if (!blobUrlsRef.current.has(snippet.cdn_url)) {
        const blobUrl = await loadAudioUrl(snippet.cdn_url);
        blobUrlsRef.current.set(snippet.cdn_url, blobUrl);
      }

      const audioUrl = blobUrlsRef.current.get(snippet.cdn_url)!;

      const audio = new Audio(audioUrl);
      audio.crossOrigin = 'anonymous'; // required for Safari cross-origin audio
      audioRef.current = audio;
      audio.volume = vocalVolume;

      await audio.play();
      console.log(`[VocalGuidance] Playing: ${snippet.snippet_key}`);

      // Update tracking
      cooldownMapRef.current.set(snippet.snippet_key, currentCycleRef.current);
      perSessionCountRef.current.set(
        snippet.snippet_key,
        (perSessionCountRef.current.get(snippet.snippet_key) ?? 0) + 1,
      );

      audio.addEventListener('ended', () => {
        isPlayingRef.current = false;
      }, { once: true });

    } catch (err) {
      console.error('[VocalGuidance] Playback error:', err);
      isPlayingRef.current = false;
    }
  }, []);

  // ── triggerPhaseStart ───────────────────────────────────────────────────────

  const triggerPhaseStart = useCallback((phaseIndex: number) => {
    const o = optsRef.current;
    if (!o.vocalGuidanceEnabled || !o.selectedVoicePackId) return;

    currentCycleRef.current += 1;

    const currentPhase = o.exercise.breathing_pattern.phases[phaseIndex];
    if (!currentPhase) return;

    const phaseContext = currentPhase.type === 'silence' ? 'silence' : 'phase_transition';
    const sessionMoment = o.sessionProgress < 25
      ? 'first_25pct'
      : o.sessionProgress < 75
        ? 'mid_50pct'
        : 'last_25pct';

    const snippet = pickSnippet(phaseContext, sessionMoment, 'phase_transition');
    if (snippet) {
      void playSnippet(snippet);
    }
  }, [pickSnippet, playSnippet]);

  // ── triggerIntensityChange ──────────────────────────────────────────────────

  const triggerIntensityChange = useCallback((direction: 'up' | 'down') => {
    const o = optsRef.current;
    if (!o.vocalGuidanceEnabled || !o.selectedVoicePackId) return;

    const category = direction === 'up' ? 'intensity_up' : 'intensity_down';
    const sessionMoment = 'any';

    const snippet = pickSnippet('any', sessionMoment, category);
    if (snippet) {
      void playSnippet(snippet);
    }
  }, [pickSnippet, playSnippet]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    const blobUrls = blobUrlsRef.current;
    return () => {
      audioRef.current?.pause();
      // Revoke preloaded blob URLs
      blobUrls.forEach((blobUrl) => {
        if (blobUrl.startsWith('blob:')) URL.revokeObjectURL(blobUrl);
      });
      blobUrls.clear();
    };
  }, []);

  return {
    triggerPhaseStart,
    triggerIntensityChange,
    preloadSnippets,
    isReady,
  };
}
