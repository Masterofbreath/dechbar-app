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
import { useSafetyFlags, useCompleteSession } from '../../api/exercises';
import { useAudioCues } from './hooks/useAudioCues';
import { useIntensityControl } from './hooks/useIntensityControl';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useHaptics } from '../../hooks/useHaptics';
import { useBreathingCues } from '../../hooks/useBreathingCues';
import { unlockSharedAudioContext } from '../../utils/sharedAudioContext';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
import { useVocalGuidance } from '../../hooks/useVocalGuidance';
import { useSessionSettings } from '../../stores/sessionSettingsStore';
import { isProtocol } from '@/utils/exerciseHelpers';
import {
  SessionStartScreen,
  SessionCountdown,
  SessionActive,
  SessionCompleted,
  MoodBeforePick,
} from './components';
import type { Exercise, MoodType } from '../../types/exercises';
import type { SessionState } from './types';

export interface SessionEngineModalProps {
  exercise: Exercise;
  isOpen?: boolean;
  onClose: () => void;
  skipFlow?: boolean; // NEW: Skip SessionStartScreen + MoodBeforePick
}

/**
 * SessionEngineModal - Complete session engine
 */
export function SessionEngineModal({
  exercise,
  isOpen = true,
  onClose,
  skipFlow = false, // NEW: Default false (preserve existing behavior)
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
  
  const timerRef = useRef<number | null>(null);
  const currentPhaseRef = useRef(currentPhaseIndex);
  
  const { user } = useAuth();
  const { data: safetyFlags } = useSafetyFlags();
  const completeSession = useCompleteSession();
  const intensityControl = useIntensityControl({ userId: user?.id });
  const { plan: userTier } = useMembership();
  
  // Custom hooks
  const { playBell } = useAudioCues(); // Legacy bell sound (fallback)
  const { circleRef, animateBreathingCircle, cleanup: cleanupAnimation } = useBreathingAnimation();
  const wakeLock = useWakeLock();
  
  // NEW: Audio & Haptics system
  const haptics = useHaptics();
  const breathingCues = useBreathingCues();
  const backgroundMusic = useBackgroundMusic();

  /**
   * Unlock audio pipeline on user gesture — must be called synchronously in every
   * button handler that leads to audio playback.
   *
   * Handles both Web Audio API (Safari AudioContext suspended state) and
   * HTMLAudioElement autoplay policy (plays a silent 0-volume audio element).
   * After this call, all subsequent async audio.play() calls will succeed on Safari/iOS.
   */
  const unlockAudio = useCallback(() => {
    unlockSharedAudioContext();
  }, []);
  const { walkingModeEnabled, backgroundMusicEnabled, keepScreenOn, vocalGuidanceEnabled, selectedVoicePackId, vocalVolume, backgroundMusicRandomEnabled } = useSessionSettings();

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
  
  // Auto-start countdown for direct protocol start (skipFlow).
  // Note: skipFlow sessions are initiated by a user tap in the parent component,
  // so audio is typically already unlocked. We call unlockAudio() here as safety net.
  useEffect(() => {
    if (skipFlow && sessionState === 'idle') {
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
  }, [sessionState, keepScreenOn]); // FIXED: Removed wakeLock from deps
  
  // Preload breathing cues + vocal snippets immediately on mount.
  // Previously conditioned on sessionState === 'idle' but that delayed bells
  // when skipFlow=true (modal opens directly in countdown).
  // Running once on mount ensures cueDataRef is populated before any bell plays.
  useEffect(() => {
    breathingCues.preloadAll();
    vocalGuidance.preloadSnippets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentional empty deps — run once on mount only

  // Background music lifecycle:
  // ONLY react to 'active' — don't pause on 'countdown' or 'idle' (music isn't playing yet anyway).
  // pause() now guards itself (only acts when state='playing'), so this is safe.
  // stop() is called explicitly in completeExercise().
  useEffect(() => {
    if (!backgroundMusicEnabled) return;

    if (sessionState === 'active') {
      // If random mode is on, pick a random accessible track before playing
      if (backgroundMusicRandomEnabled && backgroundMusic.tracks.length > 0) {
        const TIER_LEVEL: Record<string, number> = { ZDARMA: 0, SMART: 1, AI_COACH: 2 };
        const userLevel = TIER_LEVEL[userTier] ?? 0;
        const accessible = backgroundMusic.tracks.filter(
          t => (TIER_LEVEL[t.required_tier] ?? 0) <= userLevel
        );
        if (accessible.length > 0) {
          const random = accessible[Math.floor(Math.random() * accessible.length)];
          void backgroundMusic.setTrack(random.slug).then(() => backgroundMusic.play());
          return;
        }
      }
      backgroundMusic.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, backgroundMusicEnabled]); // backgroundMusic deliberately excluded
  
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
  const startCountdown = useCallback(() => {
    unlockAudio();

    setSessionState('countdown');
    setCountdownNumber(5);

    let count = 5;

    const countdownInterval = window.setInterval(() => {
      count--;
      setCountdownNumber(count);

      if (count === 2) {
        // First bell at 33% — gentle warning
        breathingCues.playBell('start', 0.33).catch(() => null);
      } else if (count === 1) {
        // Second bell at 66% — building up
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
  }, [breathingCues, playBell, cleanupAnimation, backgroundMusic]);
  
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

  // Trigger background music fade OUT exactly 9s before session ends.
  // Uses a real-time interval based on sessionStartTime + totalDuration — not sessionProgress
  // (sessionProgress is derived from phase rendering and can be unreliable at session boundaries).
  const bgFadeOutStartedRef = useRef(false);
  const bgFadeOutTimerRef   = useRef<number | null>(null);
  useEffect(() => {
    // Clear any previous timer when session state changes
    if (bgFadeOutTimerRef.current) {
      window.clearTimeout(bgFadeOutTimerRef.current);
      bgFadeOutTimerRef.current = null;
    }

    if (sessionState !== 'active' || !backgroundMusicEnabled || !sessionStartTime) return;

    // Reset flag for new session
    bgFadeOutStartedRef.current = false;

    const totalDuration = exercise.breathing_pattern.phases.reduce(
      (sum, phase) => sum + phase.duration_seconds,
      0
    );

    // Calculate exact ms until fade OUT should start (9s before end)
    const sessionEndMs  = sessionStartTime.getTime() + totalDuration * 1000;
    const fadeOutAtMs   = sessionEndMs - 9000;
    const delayMs       = Math.max(0, fadeOutAtMs - Date.now());

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
  }, [sessionState, backgroundMusicEnabled, sessionStartTime]);

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
      
      const updateBreathingState = () => {
        // Apply multiplier to this cycle's pattern
        const effInhale = inhale_seconds * localMultiplier;
        const effHoldIn = hold_after_inhale_seconds * localMultiplier;
        const effExhale = exhale_seconds * localMultiplier;
        const effHoldOut = hold_after_exhale_seconds * localMultiplier;
        const effCycle = effInhale + effHoldIn + effExhale + effHoldOut;

        const elapsed = (Date.now() - cycleStartTime) / 1000;
        currentCyclePosition = elapsed;
        effectiveEndOfExhalePos = effInhale + effHoldIn + effExhale;

        // Cycle boundary: promote pending multiplier and reset cycle clock
        if (elapsed >= effCycle) {
          cycleStartTime = Date.now();
          localMultiplier = intensityControl.pendingMultiplierRef.current;
          intensityControl.multiplierRef.current = localMultiplier;
          currentCyclePosition = 0;

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
            try {
              haptics.trigger('inhale');
              breathingCues.playCue('inhale');
            } catch { /* ignore audio/haptics errors during breathing */ }

            animateBreathingCircle('inhale', effInhale * 1000);

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--exhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--inhale');
            }
            lastInstruction = 'NÁDECH';
          }
        } else if (elapsed < effInhale + effHoldIn) {
          newInstruction = effHoldIn > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && effHoldIn > 0) {
            haptics.trigger('hold');
            breathingCues.playCue('hold');

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
            }
            lastInstruction = 'ZADRŽ';
          }
        } else if (elapsed < effectiveEndOfExhalePos) {
          newInstruction = 'VÝDECH';
          if (lastInstruction !== 'VÝDECH') {
            haptics.trigger('exhale');
            breathingCues.playCue('exhale');

            animateBreathingCircle('exhale', effExhale * 1000);

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--exhale');
            }
            lastInstruction = 'VÝDECH';
          }
        } else {
          newInstruction = effHoldOut > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && effHoldOut > 0) {
            haptics.trigger('hold');
            breathingCues.playCue('hold');

            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
            }
            lastInstruction = 'ZADRŽ';
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
    if (!sessionStartTime) return;
    
    try {
      // Map difficulty (1-3) to quality_rating (1-5) for DB storage
      // 1 (Snadné) → 5 (vysoká kvalita), 2 (Akorát) → 3 (střední), 3 (Náročné) → 1 (nízká)
      const qualityRating = difficultyRating 
        ? (4 - difficultyRating) + 1  // 1→5, 2→3, 3→1
        : undefined;
      
      const session = await completeSession.mutateAsync({
        exercise_id: exercise.id,
        started_at: sessionStartTime,
        completed_at: new Date(),
        was_completed: sessionState === 'completed',
        mood_before: moodBefore || undefined,
        mood_after: moodAfter || undefined,
        quality_rating: qualityRating, // DB field (mapped from difficulty)
        notes: notes.trim() || undefined,
        final_intensity_multiplier: intensityControl.multiplierRef.current,
      });

      // Flush intensity events after session_id is available (fire-and-forget)
      if (session?.id) {
        void intensityControl.flushEvents(session.id);
      }

      intensityControl.reset();
      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Nepodařilo se uložit session. Zkus to znovu.');
    }
  }, [exercise.id, sessionStartTime, sessionState, moodBefore, moodAfter, difficultyRating, notes, completeSession, onClose]);
  
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
              <FullscreenModal.Title>{exercise.name}</FullscreenModal.Title>
              {totalPhases > 1 && (
                <FullscreenModal.Badge>
                  FÁZE {currentPhaseIndex + 1}/{totalPhases}
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
          message="Progres nebude uložen."
          confirmText="Ukončit"
          cancelText="Pokračovat"
          variant="warning"
        />
      </div>
    </div>,
    document.body
  );
}
