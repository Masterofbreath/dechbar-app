/**
 * SessionEngineModal - Breathing Exercise Session Engine (Refactored)
 * 
 * Main orchestrator component - delegates rendering to sub-components
 * 
 * Architecture:
 * - Uses custom hooks for breathing animation and audio
 * - Manages state machine (idle → countdown → active → completed)
 * - Renders state-specific components
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/platform/hooks';
import { useAuth } from '@/platform/auth';
import { Button } from '@/platform/components';
import { useMembership } from '@/platform/membership/useMembership';
import { ConfirmModal, FullscreenModal } from '@/components/shared';
import { useBreathingAnimation } from '@/components/shared/BreathingCircle';
import { SafetyQuestionnaire } from '../SafetyQuestionnaire';
import { useSafetyFlags, useCompleteSession, useIncrementSmartSessionCount } from '../../api/exercises';
import { useAudioCues } from './hooks/useAudioCues';
import { useIntensityControl } from './hooks/useIntensityControl';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useHaptics } from '../../hooks/useHaptics';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { useBreathingCues } from '../../hooks/useBreathingCues';
import { unlockSharedAudioContext } from '../../utils/sharedAudioContext';
import { useBackgroundMusic, FADE_OUT_DURATION_MS } from '../../hooks/useBackgroundMusic';
import { useVocalGuidance } from '../../hooks/useVocalGuidance';
import { useSessionSettings } from '../../stores/sessionSettingsStore';
import { isProtocol } from '@/utils/exerciseHelpers';
import { SmartPrepState } from './SmartPrepState';
import { buildSmartExercise, buildSmartContextSnapshot } from '../../engine/BreathIntelligenceEngine';
import { smartKeys } from '../../hooks/useSmartExercise';
import { updateStreakOnActivity } from '@/platform/analytics';
import { useQueryClient } from '@tanstack/react-query';
import {
  SessionStartScreen,
  SessionCountdown,
  SessionActive,
  SessionCompleted,
  MoodBeforePick,
} from './components';
import type { Exercise, MoodType, SmartSessionConfig } from '../../types/exercises';
import type { SessionState } from './types';

export interface SessionEngineModalProps {
  exercise: Exercise;
  isOpen?: boolean;
  onClose: () => void;
  skipFlow?: boolean; // Skip SessionStartScreen + MoodBeforePick
  smartConfig?: SmartSessionConfig; // Present for SMART sessions
}

/**
 * SessionEngineModal - Complete session engine
 */
export function SessionEngineModal({
  exercise: exerciseProp,
  isOpen = true,
  onClose,
  skipFlow = false,
  smartConfig,
}: SessionEngineModalProps) {
  // =====================================================
  // STATE
  // =====================================================
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [countdownNumber, setCountdownNumber] = useState(5);
  const [moodBefore, setMoodBefore] = useState<MoodType | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodType | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(0);
  const [showSaveError, setShowSaveError] = useState(false);

  // Guard: prevents double-save on rapid taps (iOS touchscreen sends multiple events)
  const isSavingRef = useRef(false);

  // SMART: adjusted duration state (changed via ±1 min buttons in SmartPrepState)
  const [smartDurationAdjust, setSmartDurationAdjust] = useState(0);

  // SMART: derive effective exercise (re-built when duration changes)
  const smartConfigAdjusted = useMemo<SmartSessionConfig | undefined>(
    () => smartConfig
      ? { ...smartConfig, totalDurationSeconds: smartConfig.totalDurationSeconds + smartDurationAdjust }
      : undefined,
    [smartConfig, smartDurationAdjust],
  );
  const exercise: Exercise = smartConfigAdjusted
    ? buildSmartExercise(smartConfigAdjusted)
    : exerciseProp;

  // Session type ref (for saveSession)
  const sessionTypeRef = useRef<'preset' | 'custom' | 'smart'>(smartConfig ? 'smart' : 'preset');

  const timerRef = useRef<number | null>(null);
  const currentPhaseRef = useRef(currentPhaseIndex);
  const queryClient = useQueryClient();
  
  const { user } = useAuth();
  const { data: safetyFlags } = useSafetyFlags();
  const { currentKP } = useKPMeasurements();
  const hasNoKP = currentKP === null || currentKP === undefined;
  const completeSession = useCompleteSession();
  const incrementSmartCount = useIncrementSmartSessionCount();
  const intensityControl = useIntensityControl({ userId: user?.id });
  const { plan: userTier } = useMembership();
  
  // Custom hooks
  const { playBell } = useAudioCues(); // Legacy bell sound (fallback)
  const { circleRef, animateBreathingCircle, cleanup: cleanupAnimation } = useBreathingAnimation();
  const wakeLock = useWakeLock();
  
  const { walkingModeEnabled, backgroundMusicEnabled, keepScreenOn, vocalGuidanceEnabled, selectedVoicePackId, vocalVolume, backgroundMusicRandomEnabled,
    smartMusicEnabled, smartMusicSlug, smartMusicRandomEnabled, smartMusicVolume,
    selectedTrackSlug,
  } = useSessionSettings();

  // NEW: Audio & Haptics system
  const haptics = useHaptics();
  const breathingCues = useBreathingCues({ isSmartSession: !!smartConfig });
  const backgroundMusic = useBackgroundMusic({
    volumeOverride: sessionTypeRef.current === 'smart' ? smartMusicVolume : undefined,
    isActive: isOpen,
  });

  /**
   * Unlock audio pipeline on user gesture — must be called synchronously in every
   * button handler that leads to audio playback.
   */
  const unlockAudio = useCallback(() => {
    unlockSharedAudioContext();
  }, []);

  // NEW: Vocal Intelligence System
  const vocalGuidance = useVocalGuidance({
    exercise,
    currentPhaseIndex,
    totalPhases: exercise.breathing_pattern.phases.length,
    phaseTimeRemaining,
    sessionProgress,
    currentInstruction,
    elapsedSessionSeconds: sessionStartTime ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) : 0,
    intensityStep: intensityControl.intensityStep,
    multiplier: intensityControl.multiplier,
    currentKP: null,
    baselineKP: null,
    userTier,
    selectedVoicePackId,
    vocalVolume,
    vocalGuidanceEnabled,
  });
  
  useScrollLock(isOpen);

  // Reset per-session state each time the modal opens (isOpen transitions false → true).
  // Without this, smartDurationAdjust accumulates across multiple sessions.
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setSmartDurationAdjust(0);
      isSavingRef.current = false;
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);
  
  const currentPhase = useMemo(
    () => exercise.breathing_pattern.phases[currentPhaseIndex],
    [exercise.breathing_pattern.phases, currentPhaseIndex]
  );
  const totalPhases = exercise.breathing_pattern.phases.length;
  
  // Update ref when phase index changes
  useEffect(() => {
    currentPhaseRef.current = currentPhaseIndex;
  }, [currentPhaseIndex]);
  
  // Hide nav on mobile (immersive mode)
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      document.body.classList.add('immersive-mode');
    }
    return () => {
      document.body.classList.remove('immersive-mode');
    };
  }, [isOpen]);
  
  // Auto-switch to smart-prep state when smartConfig is provided
  useEffect(() => {
    if (smartConfig && sessionState === 'idle') {
      setSessionState('smart-prep');
    }
  }, [smartConfig, sessionState]);

  // Auto-start countdown for direct protocol start (skipFlow).
  // Note: skipFlow sessions are initiated by a user tap in the parent component,
  // so audio is typically already unlocked. We call unlockAudio() here as safety net.
  useEffect(() => {
    if (skipFlow && sessionState === 'idle' && !smartConfig) {
      unlockAudio();
      startCountdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipFlow, sessionState]);
  
  // ✅ Wake Lock - Keep screen on during active session (respects user preference)
  useEffect(() => {
    if (sessionState === 'active' && keepScreenOn) {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
  }, [sessionState, keepScreenOn]); // eslint-disable-line react-hooks/exhaustive-deps -- wakeLock stable ref, intentionally omitted
  
  // Preload breathing cues + vocal snippets when modal opens.
  // Previously ran on mount — but SessionEngineModal is always mounted (tab carousel pre-renders
  // all pages), so multiple instances were all calling preloadAll() and fetchTracks() concurrently,
  // fighting over the _isAnyInstancePlaying singleton lock.
  // Now gated on isOpen so only the active instance initialises audio.
  const hasPreloadedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) return;
    if (hasPreloadedRef.current) return;
    hasPreloadedRef.current = true;
    breathingCues.preloadAll();
    vocalGuidance.preloadSnippets();
    // Pre-fetch track list so random selection works even if SettingsPage was never opened
    void backgroundMusic.fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // runs once when modal first opens

  // Background music lifecycle:
  // - On 'countdown': pre-load the track (setTrack only, no play) so it's ready when 'active' starts.
  // - On 'active': call play() — track is already loaded, plays immediately with fade-in.
  // SMART sessions are handled separately (startSmartSession calls triggerMusicForSession in gesture).
  useEffect(() => {
    const isSmartSession = sessionTypeRef.current === 'smart';
    if (isSmartSession) return; // SMART handled by startSmartSession()

    const musicEnabled = backgroundMusicEnabled;
    const randomEnabled = backgroundMusicRandomEnabled;
    const fixedSlug = selectedTrackSlug;

    if (!musicEnabled) return;

    const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };
    const userLevel = TIER_LEVEL[userTier] ?? 0;

    const pickSlug = (): string | null => {
      if (randomEnabled && backgroundMusic.tracks.length > 0) {
        const accessible = backgroundMusic.tracks.filter(
          t => (TIER_LEVEL[t.required_tier] ?? 0) <= userLevel && !t.smart_only
        );
        if (accessible.length > 0) {
          return accessible[Math.floor(Math.random() * accessible.length)].slug;
        }
      }
      return fixedSlug ?? null;
    };

    if (sessionState === 'countdown') {
      // Pre-load track during countdown (no play) — ensures audio is ready at session start
      const slug = pickSlug();
      if (slug) void backgroundMusic.setTrack(slug);
      return;
    }

    if (sessionState === 'active') {
      // Track should already be loaded from countdown pre-load.
      // play() will use pendingPlayRef or call playInternal() directly.
      if (backgroundMusic.state === 'playing') return; // already playing — nothing to do
      void backgroundMusic.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, backgroundMusicEnabled]); // backgroundMusic deliberately excluded

  // Pre-load SMART music track as soon as prep screen appears so it's ready at session start.
  // This eliminates the "music starts late without fade-in" issue caused by lazy audio loading.
  useEffect(() => {
    if (sessionState !== 'smart-prep') return;
    const isSmartSession = sessionTypeRef.current === 'smart';
    if (!isSmartSession || !smartMusicEnabled) return;

    const randomEnabled = smartMusicRandomEnabled;
    const fixedSlug = smartMusicSlug;

    if (randomEnabled && backgroundMusic.tracks.length > 0) {
      const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };
      const userLevel = TIER_LEVEL[userTier] ?? 0;
      const accessible = backgroundMusic.tracks.filter(
        t => (TIER_LEVEL[t.required_tier] ?? 0) <= userLevel
      );
      if (accessible.length > 0) {
        const random = accessible[Math.floor(Math.random() * accessible.length)];
        void backgroundMusic.setTrack(random.slug); // pre-load only, don't play yet
      }
    } else if (fixedSlug) {
      void backgroundMusic.setTrack(fixedSlug); // pre-load only, don't play yet
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState]); // only react to smart-prep state entry
  
  // ✅ NEW: Walking mode display dimming
  useEffect(() => {
    if (sessionState === 'active' && walkingModeEnabled) {
      // Dim display to minimum brightness
      document.body.style.filter = 'brightness(0.1)';
    } else {
      document.body.style.filter = '';
    }
    
    return () => {
      document.body.style.filter = '';
    };
  }, [sessionState, walkingModeEnabled]);
  
  // =====================================================
  // SESSION FLOW: State Machine
  // =====================================================
  
  // Start session (idle → countdown for exercises with embedded mood)
  const startSession = useCallback((mood: MoodType | null = null) => {
    unlockAudio(); // Unlock Web Audio API on user gesture
    setMoodBefore(mood);
    startCountdown();
  }, [unlockAudio]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Start countdown after mood selection (or skip)
  // ─── Music trigger helper ───────────────────────────────────────────────
  // Called synchronously from user gesture handlers (startCountdown, startSmartSession)
  // so that audio.play() is invoked within the gesture call chain → Safari autoplay passes.
  const triggerMusicForSession = useCallback(() => {
    const isSmartSession = sessionTypeRef.current === 'smart';
    const musicEnabled = isSmartSession ? smartMusicEnabled : backgroundMusicEnabled;
    if (!musicEnabled) return;

    const randomEnabled = isSmartSession ? smartMusicRandomEnabled : backgroundMusicRandomEnabled;
    const fixedSlug = isSmartSession ? smartMusicSlug : selectedTrackSlug;

    const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };
    const userLevel = TIER_LEVEL[userTier] ?? 0;

    if (randomEnabled && backgroundMusic.tracks.length > 0) {
      const accessible = backgroundMusic.tracks.filter(
        t => (TIER_LEVEL[t.required_tier] ?? 0) <= userLevel
          && (isSmartSession || !t.smart_only)
      );
      if (accessible.length > 0) {
        const random = accessible[Math.floor(Math.random() * accessible.length)];
        // setTrack().then(play) — play() is a microtask within the gesture chain → Safari OK
        void backgroundMusic.setTrack(random.slug).then(() => backgroundMusic.play());
        return;
      }
    }

    if (fixedSlug) {
      void backgroundMusic.setTrack(fixedSlug).then(() => backgroundMusic.play());
      return;
    }

    // Fallback: play without setTrack (uses whatever track was preloaded)
    void backgroundMusic.play();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [smartMusicEnabled, backgroundMusicEnabled, smartMusicRandomEnabled, backgroundMusicRandomEnabled, smartMusicSlug, selectedTrackSlug, userTier]);

  const startCountdown = useCallback(() => {
    unlockAudio();

    setSessionState('countdown');
    setCountdownNumber(5);

    // NOTE: Music is NOT started here. For normal sessions (protocols, exercises),
    // music starts when sessionState transitions to 'active' (see useEffect below).
    // Starting music during countdown caused it to play before the first inhale,
    // which is incorrect UX. SMART sessions use startSmartSession() which calls
    // triggerMusicForSession() directly because they have no countdown screen.

    let count = 5;

    const countdownInterval = window.setInterval(() => {
      count--;
      setCountdownNumber(count);

      if (count === 2) {
        // First bell at 33% — play regardless of isReady; playBell has built-in fallback
        breathingCues.playBell('start', 0.33).catch(() => null);
      } else if (count === 1) {
        // Second bell at 66%
        breathingCues.playBell('start', 0.66).catch(() => null);
      } else if (count === 0) {
        // Session starts — NO bell here, first inhale cue takes over immediately
        window.clearInterval(countdownInterval);
        setSessionProgress(0); // explicit reset — prevents stale progress from previous session
        setSessionState('active');
        setSessionStartTime(new Date());
        setCurrentPhaseIndex(0);
        intensityControl.notifySessionStart();
      }
    }, 1000);
  }, [breathingCues, playBell, unlockAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // SMART: skip countdown entirely — bells are played inside SmartPrepState at 2s/1s
  const startSmartSession = useCallback(() => {
    unlockAudio();
    // Bells already fired in SmartPrepState — go straight to active
    setSessionProgress(0);
    setSessionState('active');
    setSessionStartTime(new Date());
    setCurrentPhaseIndex(0);
    intensityControl.notifySessionStart();

    // Trigger music synchronously within the gesture so Safari grants autoplay token.
    triggerMusicForSession();
  }, [unlockAudio, intensityControl, triggerMusicForSession]);  
  
  // Complete exercise
  const completeExercise = useCallback(() => {
    setSessionState('completed');
    
    // Play end bell (use new breathingCues or fallback to legacy)
    breathingCues.playBell('end').catch(() => playBell());
    
    // Stop all animations
    cleanupAnimation();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    // Stop background music
    backgroundMusic.stop();

    // Update streak — fire-and-forget
    if (user?.id) {
      updateStreakOnActivity(user.id);
    }
  }, [breathingCues, playBell, cleanupAnimation, backgroundMusic, user]);
  
  // Calculate session progress
  useEffect(() => {
    if (sessionState === 'active' && currentPhase) {
      const totalDuration = exercise.breathing_pattern.phases.reduce(
        (sum, phase) => sum + phase.duration_seconds,
        0
      );
      const elapsed = exercise.breathing_pattern.phases
        .slice(0, currentPhaseIndex)
        .reduce((sum, phase) => sum + phase.duration_seconds, 0)
        + (currentPhase.duration_seconds - phaseTimeRemaining);
      
      const progress = (elapsed / totalDuration) * 100;
      setSessionProgress(Math.min(Math.max(progress, 0), 100));
    }
  }, [sessionState, currentPhaseIndex, phaseTimeRemaining, currentPhase, exercise]);

  // Notify breathingCues when session is ending — progressive fade out based on progress.
  // Thresholds: 85% → 3 cycles remaining, 90% → 2, 95% → 1, 100% → 0 (silent)
  // Each threshold fires ONCE (guard: only call notifySessionEnding with decreasing values).
  const endingPhaseRef = useRef<number>(99); // tracks last notified remaining value (99 = not started)
  useEffect(() => {
    if (sessionState !== 'active') {
      endingPhaseRef.current = 99; // reset for next session
      return;
    }

    let cyclesRemaining: number | null = null;
    if (sessionProgress >= 95)      cyclesRemaining = 1;
    else if (sessionProgress >= 90) cyclesRemaining = 2;
    else if (sessionProgress >= 85) cyclesRemaining = 3;

    // Only notify if we have a new, lower value (never go back up)
    if (cyclesRemaining !== null && cyclesRemaining < endingPhaseRef.current) {
      endingPhaseRef.current = cyclesRemaining;
      breathingCues.notifySessionEnding(cyclesRemaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, sessionProgress]);

  // Trigger background music fade OUT so it ends exactly at the start of the final silence phase.
  //
  // WHY dynamic calculation:
  //   SMART cvičení always ends with a 'silence' phase (Ticho, default ~30s = 5% of total).
  //   We want music to end precisely when Ticho begins — not 9s before the very end.
  //   All values are read at runtime so changes to FADE_OUT_DURATION_MS, MIN_SILENCE,
  //   or the phase profile propagate automatically without touching this code.
  //
  // Formula:
  //   fadeOutAt = sessionStart + totalDuration - silenceSec - (FADE_OUT_DURATION_MS / 1000)
  //   → music reaches vol=0 exactly when silence phase starts
  const bgFadeOutStartedRef = useRef(false);
  const bgFadeOutTimerRef   = useRef<number | null>(null);
  useEffect(() => {
    // Clear any previous timer when session state changes
    if (bgFadeOutTimerRef.current) {
      window.clearTimeout(bgFadeOutTimerRef.current);
      bgFadeOutTimerRef.current = null;
    }

    // Use the correct toggle: SMART sessions use smartMusicEnabled, regular use backgroundMusicEnabled
    const isMusicEnabled = smartConfigAdjusted ? smartMusicEnabled : backgroundMusicEnabled;
    if (sessionState !== 'active' || !isMusicEnabled || !sessionStartTime) return;

    // Reset flag for new session
    bgFadeOutStartedRef.current = false;

    // For SMART sessions use the adjusted SMART duration (may differ from the exercise template).
    // exercise.breathing_pattern.phases reflects the DB template, not the actual SMART length.
    const totalDuration = smartConfigAdjusted?.totalDurationSeconds
      ?? exercise.breathing_pattern.phases.reduce(
        (sum, phase) => sum + phase.duration_seconds,
        0
      );

    // Read silence phase duration dynamically — last phase is always 'silence' in SMART.
    // If the last phase type ever changes, silenceSec gracefully falls to 0 (old behaviour).
    const phases      = exercise.breathing_pattern.phases;
    const lastPhase   = phases[phases.length - 1];
    const silenceSec  = lastPhase?.type === 'silence' ? lastPhase.duration_seconds : 0;
    const fadeOutSec  = FADE_OUT_DURATION_MS / 1000;

    // Fade OUT fires so that music volume reaches 0 exactly when silence phase begins.
    // Minimum delay 1s guards against negative values on edge-case timing glitches.
    const sessionEndMs = sessionStartTime.getTime() + totalDuration * 1000;
    const fadeOutAtMs  = sessionEndMs - (silenceSec * 1000) - (fadeOutSec * 1000);
    const delayMs      = Math.max(1000, fadeOutAtMs - Date.now());

    bgFadeOutTimerRef.current = window.setTimeout(() => {
      if (!bgFadeOutStartedRef.current) {
        bgFadeOutStartedRef.current = true;
        backgroundMusic.startFadeOut();
      }
    }, delayMs);

    return () => {
      if (bgFadeOutTimerRef.current) {
        window.clearTimeout(bgFadeOutTimerRef.current);
        bgFadeOutTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, smartMusicEnabled, backgroundMusicEnabled, sessionStartTime]);

  // Run current phase
  useEffect(() => {
    if (sessionState !== 'active' || !currentPhase) {
      return;
    }
    
    
    setPhaseTimeRemaining(currentPhase.duration_seconds);
    
    
    let breathingIntervalId: number | null = null;
    let currentCyclePosition = 0;
    let isWaitingForCycleEnd = false;
    let cycleEndWaitStartTime = 0;
    // Shared between breathing interval and phase timer (updated each 100ms tick)
    let effectiveEndOfExhalePos = 0;
    
    // Set instruction based on phase type
    if (currentPhase.type === 'silence') {
      setCurrentInstruction('DOZNĚNÍ');
    }
    
    // Start breathing animation if breathing phase
    if (currentPhase.type === 'breathing' && currentPhase.pattern) {
      const { inhale_seconds, hold_after_inhale_seconds, exhale_seconds, hold_after_exhale_seconds } = currentPhase.pattern;

      // Cycle tracking: apply multiplier at cycle boundaries (not mid-cycle)
      // This avoids jarring rhythm changes while preserving smooth animation.
      let cycleStartTime = Date.now();
      let localMultiplier = intensityControl.pendingMultiplierRef.current;
      
      let lastInstruction = '';
      // Track which cues have already been pre-fired to avoid double-play
      let cueFiredForInstruction = '';
      // How many ms before the visual phase change to fire the audio cue.
      // Must be > setInterval tick (100ms) so the lookahead window is never missed.
      // 120ms gives one full tick of margin.
      const CUE_LEAD_MS = 120;

      // Fire inhale cue immediately at session/phase start — before the first 100ms tick.
      // Without this, the first cue is missed: the lookahead window (0..CUE_LEAD_MS)
      // closes before the interval fires its first tick (~100ms after start).
      try {
        breathingCues.playCue('inhale');
        haptics.trigger('inhale');
      } catch { /* ignore */ }
      cueFiredForInstruction = 'NÁDECH-pre';
      
      const updateBreathingState = () => {
        // Apply multiplier to this cycle's pattern
        const effInhale = inhale_seconds * localMultiplier;
        const effHoldIn = hold_after_inhale_seconds * localMultiplier;
        const effExhale = exhale_seconds * localMultiplier;
        const effHoldOut = hold_after_exhale_seconds * localMultiplier;
        const effCycle = effInhale + effHoldIn + effExhale + effHoldOut;

        const elapsed = (Date.now() - cycleStartTime) / 1000;
        const elapsedMs = elapsed * 1000;
        currentCyclePosition = elapsed;
        effectiveEndOfExhalePos = effInhale + effHoldIn + effExhale;

        // ── Lookahead cue pre-fire ────────────────────────────────────────
        // Fire audio cue CUE_LEAD_MS before the visual phase transition so
        // sound and animation appear simultaneous on mobile.
        const holdInStartMs  = effInhale * 1000;
        const exhaleStartMs  = (effInhale + effHoldIn) * 1000;
        const holdOutStartMs = (effInhale + effHoldIn + effExhale) * 1000;

        const timeToHoldIn  = holdInStartMs  - elapsedMs;
        const timeToExhale  = exhaleStartMs  - elapsedMs;
        const timeToHoldOut = holdOutStartMs - elapsedMs;

        // Pre-fire inhale cue: only at cycle START (elapsed close to 0) 
        if (elapsedMs >= -CUE_LEAD_MS && elapsedMs < CUE_LEAD_MS && cueFiredForInstruction !== 'NÁDECH-pre') {
          cueFiredForInstruction = 'NÁDECH-pre';
          try { breathingCues.playCue('inhale'); haptics.trigger('inhale'); } catch { /* ignore */ }
        }
        // Pre-fire hold-in cue
        if (effHoldIn > 0 && timeToHoldIn >= -CUE_LEAD_MS && timeToHoldIn < CUE_LEAD_MS && cueFiredForInstruction !== 'ZADRŽ-pre') {
          cueFiredForInstruction = 'ZADRŽ-pre';
          try { breathingCues.playCue('hold'); haptics.trigger('hold'); } catch { /* ignore */ }
        }
        // Pre-fire exhale cue
        if (timeToExhale >= -CUE_LEAD_MS && timeToExhale < CUE_LEAD_MS && cueFiredForInstruction !== 'VÝDECH-pre') {
          cueFiredForInstruction = 'VÝDECH-pre';
          try { breathingCues.playCue('exhale'); haptics.trigger('exhale'); } catch { /* ignore */ }
        }
        // Pre-fire hold-out cue
        if (effHoldOut > 0 && timeToHoldOut >= -CUE_LEAD_MS && timeToHoldOut < CUE_LEAD_MS && cueFiredForInstruction !== 'ZADRŽ2-pre') {
          cueFiredForInstruction = 'ZADRŽ2-pre';
          try { breathingCues.playCue('hold'); haptics.trigger('hold'); } catch { /* ignore */ }
        }

        // Cycle boundary: promote pending multiplier and reset cycle clock
        if (elapsed >= effCycle) {
          cycleStartTime = Date.now();
          localMultiplier = intensityControl.pendingMultiplierRef.current;
          intensityControl.multiplierRef.current = localMultiplier;
          currentCyclePosition = 0;
          lastInstruction = '';       // reset so visual block re-fires on new cycle
          cueFiredForInstruction = ''; // reset so lookahead pre-fires on new cycle

          // Fire inhale cue immediately at cycle boundary — same as at phase start.
          // The lookahead window (0..CUE_LEAD_MS) would be missed if the next tick
          // arrives at ~100ms (past the window). Firing here guarantees every cycle.
          try {
            breathingCues.playCue('inhale');
            haptics.trigger('inhale');
          } catch { /* ignore */ }
          cueFiredForInstruction = 'NÁDECH-pre';

          // If phase timer already expired and we were waiting for the natural breath end,
          // advance NOW — 100ms precision vs relying on 1s timer hitting a 0.5s window.
          if (isWaitingForCycleEnd) {
            isWaitingForCycleEnd = false;
            setCurrentInstruction('');
            const nextIndex = currentPhaseRef.current + 1;
            if (nextIndex < totalPhases) {
              setCurrentPhaseIndex(nextIndex);
              vocalGuidance.triggerPhaseStart(nextIndex);
              playBell();
            } else {
              completeExercise();
            }
          }

          return; // Skip rendering this tick — fresh cycle starts on next tick
        }

        let newInstruction = '';

        if (elapsed < effInhale) {
          newInstruction = 'NÁDECH';
          if (lastInstruction !== 'NÁDECH') {
            // Audio/haptics pre-fired via lookahead above — only visual changes here
            animateBreathingCircle('inhale', effInhale * 1000);

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--exhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--inhale');
            }
            lastInstruction = 'NÁDECH';
            cueFiredForInstruction = 'NÁDECH-pre'; // mark as handled
          }
        } else if (elapsed < effInhale + effHoldIn) {
          newInstruction = effHoldIn > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && effHoldIn > 0) {
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
            }
            lastInstruction = 'ZADRŽ';
            cueFiredForInstruction = 'ZADRŽ-pre';
          }
        } else if (elapsed < effectiveEndOfExhalePos) {
          newInstruction = 'VÝDECH';
          if (lastInstruction !== 'VÝDECH') {
            animateBreathingCircle('exhale', effExhale * 1000);

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--exhale');
            }
            lastInstruction = 'VÝDECH';
            cueFiredForInstruction = 'VÝDECH-pre';
          }
        } else {
          newInstruction = effHoldOut > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && effHoldOut > 0) {
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
            }
            lastInstruction = 'ZADRŽ';
            cueFiredForInstruction = 'ZADRŽ2-pre';
          }
        }

        setCurrentInstruction(newInstruction);
      };
      
      breathingIntervalId = window.setInterval(updateBreathingState, 100);
    }
    
    
    // Countdown timer
    timerRef.current = window.setInterval(() => {
      
      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          
          if (currentPhase.type === 'breathing' && currentPhase.pattern) {
            // effectiveEndOfExhalePos is updated every 100ms by updateBreathingState.
            // Fallback to raw pattern if breathing loop hasn't started yet (edge case).
            const endOfExhalePosition = effectiveEndOfExhalePos > 0
              ? effectiveEndOfExhalePos
              : currentPhase.pattern.inhale_seconds
                + currentPhase.pattern.hold_after_inhale_seconds
                + currentPhase.pattern.exhale_seconds;

            if (currentCyclePosition > 0.5 && currentCyclePosition < endOfExhalePosition && !isWaitingForCycleEnd) {
              isWaitingForCycleEnd = true;
              cycleEndWaitStartTime = Date.now();
              return 0;
            }
            
            if (isWaitingForCycleEnd) {
              // Primary advancement is handled by updateBreathingState at the exact cycle boundary.
              // This 1s timer block is a safety net for two edge cases:
              // 1. iOS Safari background throttling: breathing interval paused, currentCyclePosition stuck
              // 2. Rare race where cycle boundary fires between timer ticks
              const maxWaitSeconds = (effectiveEndOfExhalePos > 0 ? effectiveEndOfExhalePos : 15) + 2;
              const timedOut = cycleEndWaitStartTime > 0 && (Date.now() - cycleEndWaitStartTime) / 1000 > maxWaitSeconds;
              if (timedOut || currentCyclePosition < 0.5) {
                isWaitingForCycleEnd = false;
                setCurrentInstruction('');
                const nextIndex = currentPhaseRef.current + 1;
                if (nextIndex < totalPhases) {
                  setCurrentPhaseIndex(nextIndex);
                  playBell();
                } else {
                  completeExercise();
                }
              }
              return 0;
            }
          }
          
          setCurrentInstruction('');
          const nextIndex = currentPhaseRef.current + 1;
          
          if (nextIndex < totalPhases) {
            setCurrentPhaseIndex(nextIndex);
            playBell();
          } else {
            completeExercise();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (breathingIntervalId) window.clearInterval(breathingIntervalId);
      cleanupAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, currentPhaseIndex, totalPhases]); // FIXED: Only primitive values - functions are stable via useCallback
  
  // Handle modal close
  const handleClose = useCallback(() => {
    if (sessionState === 'active') {
      setShowCloseConfirm(true);
      return;
    }
    
    cleanupAnimation();
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    setSessionState('idle');
    setCurrentPhaseIndex(0);
    setMoodBefore(null);
    setMoodAfter(null);
    intensityControl.reset();
    
    onClose();
  }, [sessionState, onClose, cleanupAnimation, intensityControl]);
  
  // Confirm close during active session (abandoned session — discard intensity events)
  const confirmClose = useCallback(() => {
    cleanupAnimation();
    if (timerRef.current) window.clearInterval(timerRef.current);

    backgroundMusic.pause(); // fade OUT on manual close
    setSessionState('idle');
    setCurrentPhaseIndex(0);
    setMoodBefore(null);
    setMoodAfter(null);
    intensityControl.reset();

    onClose();
  }, [onClose, cleanupAnimation, intensityControl, backgroundMusic]);
  
  // Share completed exercise - ODSTRANĚNO (přidáme později s visual presets)
  // TODO: Implementovat share feature s custom vizuálním presetem
  
  // Save session to history
  const saveSession = useCallback(async () => {
    // Guard against rapid double-tap (iOS touchscreen fires multiple click events)
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    // Fallback: if sessionStartTime somehow null (e.g. session abandoned mid-flow), use now
    const startTime = sessionStartTime ?? new Date();

    try {
      // Map difficulty (1-3) to quality_rating (1-5) for DB storage
      // 1 (Snadné) → 5 (vysoká kvalita), 2 (Akorát) → 3 (střední), 3 (Náročné) → 1 (nízká)
      const qualityRating = difficultyRating 
        ? (4 - difficultyRating) + 1  // 1→5, 2→3, 3→1
        : undefined;

      // Smart sessions use null exercise_id (ephemeral, no DB row in exercises table)
      const exerciseId = sessionTypeRef.current === 'smart' ? null : exercise.id;

      // Build smart_context snapshot for SMART sessions
      const smartContextPayload = smartConfigAdjusted
        ? buildSmartContextSnapshot(smartConfigAdjusted, null, exercise)
        : undefined;
      
      const session = await completeSession.mutateAsync({
        exercise_id: exerciseId,
        started_at: startTime,
        completed_at: new Date(),
        was_completed: sessionState === 'completed',
        mood_before: moodBefore || undefined,
        mood_after: moodAfter || undefined,
        quality_rating: qualityRating,
        notes: notes.trim() || undefined,
        final_intensity_multiplier: intensityControl.multiplierRef.current,
        session_type: sessionTypeRef.current,
        smart_context: smartContextPayload,
      });

      // Flush intensity events after session_id is available (fire-and-forget)
      if (session?.id) {
        void intensityControl.flushEvents(session.id);
      }

      // Invalidate SMART recommendation cache so next BIE run gets fresh data
      if (sessionTypeRef.current === 'smart' && user?.id) {
        // Increment session_count_smart and apply level change if BIE computed one.
        // Level is only applied here (after session), never during computeAndBuild().
        await incrementSmartCount.mutateAsync({
          wasCompleted: sessionState === 'completed',
          newLevel: smartConfigAdjusted?.level,
          recommendedInhale: smartConfigAdjusted?.basePattern.inhale_seconds,
          recommendedExhale: smartConfigAdjusted?.basePattern.exhale_seconds,
        });
        await queryClient.invalidateQueries({ queryKey: smartKeys.history(user.id) });
        await queryClient.invalidateQueries({ queryKey: smartKeys.recommendation(user.id) });
      }

      intensityControl.reset();
      onClose();
    } catch (error) {
      console.error('[SessionEngineModal] Error saving session:', error);
      // Use non-blocking error — alert() blocks iOS WebView event loop
      setShowSaveError(true);
      // Release guard so user can retry after fixing the error
      isSavingRef.current = false;
    }
  }, [exercise, sessionStartTime, sessionState, moodBefore, moodAfter, difficultyRating, notes, completeSession, incrementSmartCount, onClose, smartConfigAdjusted, user?.id, queryClient, intensityControl]);
  
  // =====================================================
  // RENDER: Safety Questionnaire (first-time)
  // =====================================================
  
  if (isOpen && safetyFlags && !safetyFlags.questionnaire_completed) {
    return createPortal(
      <SafetyQuestionnaire
        isOpen={isOpen}
        onClose={onClose}
        onComplete={() => {
          setSessionState('idle');
        }}
      />,
      document.body
    );
  }
  
  if (!isOpen) return null;
  
  // =====================================================
  // RENDER: Session States
  // =====================================================
  
  return createPortal(
    <div className="session-engine-modal" role="dialog" aria-modal="true">
      <div className="session-engine-modal__overlay" onClick={handleClose} />
      
      <div 
        className={`session-engine-modal__content ${
          sessionState === 'completed' ? 'session-engine-modal__content--completion' : ''
        }`}
      >
        {/* SMART-PREP: Smart exercise preparation screen (replaces idle/start for SMART sessions) */}
        {sessionState === 'smart-prep' && (
          <SmartPrepState
            smartConfig={smartConfigAdjusted ?? null}
            hasNoKP={hasNoKP}
            onStart={() => {
              startSmartSession();
            }}
            onScheduleBells={(delay1Sec, delay2Sec) => {
              // Called synchronously at SmartPrepState mount — AudioContext is 'running'
              // because unlockSharedAudioContext() was called from the SMART button gesture.
              // scheduleBells() creates AudioNodes NOW and fires them at the given offsets
              // — no gesture token required at playback time. Fixes bells on Safari.
              return breathingCues.scheduleBells(delay1Sec, delay2Sec);
            }}
            onUnlockAudio={unlockAudio}
            onAdjustDuration={(delta) => {
              setSmartDurationAdjust((prev) => prev + delta);
            }}
            onClose={handleClose}
          />
        )}

        {/* IDLE: Combined start + mood screen — shown for all exercises when skipFlow=false.
            Protocols from Dnes view use skipFlow=true (direct countdown), protocols from
            Cvičit view use skipFlow=false and correctly land here for mood collection. */}
        {sessionState === 'idle' && !skipFlow && (
          <>
            <FullscreenModal.TopBar>
              <FullscreenModal.Title>{exercise.name}</FullscreenModal.Title>
              <FullscreenModal.CloseButton onClick={handleClose} />
            </FullscreenModal.TopBar>
            
            <FullscreenModal.ContentZone className="session-start-wrapper">
              <SessionStartScreen
                exercise={exercise}
                mood={moodBefore}
                onMoodChange={setMoodBefore}
                onStart={startSession}
              />
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              <div /> {/* Empty - button moved to ContentZone */}
            </FullscreenModal.BottomBar>
          </>
        )}
        
        {/* MOOD BEFORE: TopBar/ContentZone/BottomBar pattern */}
        {sessionState === 'mood-before' && (
          <>
            <FullscreenModal.TopBar>
              <FullscreenModal.Title>Jak se teď cítíš?</FullscreenModal.Title>
              <FullscreenModal.CloseButton onClick={handleClose} />
            </FullscreenModal.TopBar>
            
            <FullscreenModal.ContentZone>
              <MoodBeforePick
                value={moodBefore}
                onChange={(mood) => {
                  setMoodBefore(mood);
                  startCountdown(); // Automaticky pokračovat na countdown
                }}
              />
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              <button
                onClick={startCountdown}
                className="mood-before-skip-link"
              >
                Nebo přeskoč a začni cvičit
              </button>
            </FullscreenModal.BottomBar>
          </>
        )}
        
        {/* COUNTDOWN: FullscreenModal pattern */}
        {sessionState === 'countdown' && (
          <>
            <FullscreenModal.TopBar>
              <FullscreenModal.Title>{exercise.name}</FullscreenModal.Title>
              <FullscreenModal.CloseButton onClick={handleClose} />
            </FullscreenModal.TopBar>
            
            <FullscreenModal.ContentZone>
              <SessionCountdown
                exercise={exercise}
                countdownNumber={countdownNumber}
              />
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              {/* Empty for all - MiniTip moved to ContentZone for exercises */}
              <div />
            </FullscreenModal.BottomBar>
          </>
        )}
        
        {/* ACTIVE: FullscreenModal pattern */}
        {sessionState === 'active' && currentPhase && (
          <>
            <FullscreenModal.TopBar>
              {/* Exercise/protocol name stays in title, phase counter in badge */}
              <FullscreenModal.Title>{exercise.name}</FullscreenModal.Title>
              {totalPhases > 1 && (
                <FullscreenModal.Badge>
                  {currentPhaseIndex + 1}/{totalPhases}
                </FullscreenModal.Badge>
              )}
              <FullscreenModal.CloseButton onClick={handleClose} />
            </FullscreenModal.TopBar>
            
            <FullscreenModal.ContentZone>
              <SessionActive
                exercise={exercise}
                currentPhase={currentPhase}
                currentPhaseIndex={currentPhaseIndex}
                totalPhases={totalPhases}
                currentInstruction={currentInstruction}
                circleRef={circleRef as React.RefObject<HTMLDivElement>}
                {...(!isProtocol(exercise) && {
                  intensityStep: intensityControl.intensityStep,
                  canIncrease: intensityControl.canIncrease,
                  canDecrease: intensityControl.canDecrease,
                  onIncrease: () => {
                    intensityControl.handleIncrease();
                    vocalGuidance.triggerIntensityChange('up');
                  },
                  onDecrease: () => {
                    intensityControl.handleDecrease();
                    vocalGuidance.triggerIntensityChange('down');
                  },
                })}
              />
              
              {/* ✅ NEW: Floating "Další:" preview at bottom of ContentZone (Option A) */}
              {phaseTimeRemaining <= 5 && currentPhaseIndex < totalPhases - 1 && (
                <div className="session-active__next-floating">
                  Další: {exercise.breathing_pattern.phases[currentPhaseIndex + 1].name}
                </div>
              )}
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar className="session-active-bottom-bar">
              {/* Phase countdown — right-aligned above progress bar (desktop)
                  or inline at end of progress bar (mobile — saves height) */}
              <div className="session-bottom-timer">
                <span className="session-bottom-timer__value">{phaseTimeRemaining} s</span>
              </div>
              <div className="fullscreen-modal__progress">
                <div 
                  className="fullscreen-modal__progress-fill" 
                  style={{ width: `${sessionProgress}%` }}
                />
              </div>
            </FullscreenModal.BottomBar>
          </>
        )}
        
        {/* COMPLETED: FullscreenModal pattern */}
        {sessionState === 'completed' && (
          <>
            <FullscreenModal.TopBar>
              <FullscreenModal.Title>
                <span className="completion-celebration">Skvělá práce!</span>
              </FullscreenModal.Title>
              {/* No close button - pouze "Uložit & Zavřít" exit (méně je více) */}
            </FullscreenModal.TopBar>
            
            <FullscreenModal.ContentZone className="completion-content">
              {showSaveError && (
                <div className="session-save-error" role="alert">
                  Nepodařilo se uložit. Zkontroluj připojení a zkus znovu.
                </div>
              )}
              <SessionCompleted
                difficultyRating={difficultyRating}
                onDifficultyChange={setDifficultyRating}
                moodAfter={moodAfter}
                onMoodChange={setMoodAfter}
                notes={notes}
                onNotesChange={setNotes}
              />
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              {/* CTA button in BottomBar — frees ContentZone, consistent with active session pattern */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={saveSession}
                loading={completeSession.isPending}
              >
                Uložit & Zavřít
              </Button>
            </FullscreenModal.BottomBar>
          </>
        )}
        
        {/* Confirm modal for closing during active session */}
        <ConfirmModal
          isOpen={showCloseConfirm}
          onClose={() => setShowCloseConfirm(false)}
          onConfirm={confirmClose}
          title="Opravdu ukončit cvičení?"
          message={
            sessionTypeRef.current === 'smart' && smartConfigAdjusted && smartConfigAdjusted.isCalibrating
              ? 'Probíhá kalibrace SMART CVIČENÍ. Nedokončené cvičení se do kalibrace nepočítá.'
              : 'Progres nebude uložen.'
          }
          confirmText="Odejít"
          cancelText="Pokračovat"
          variant="warning"
        />
      </div>
    </div>,
    document.body
  );
}
