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
import { useScrollLock } from '@/platform/hooks';
import { ConfirmModal, FullscreenModal } from '@/components/shared';
import { useBreathingAnimation } from '@/components/shared/BreathingCircle';
import { SafetyQuestionnaire } from '../SafetyQuestionnaire';
import { useSafetyFlags, useCompleteSession } from '../../api/exercises';
import { useAudioCues } from './hooks/useAudioCues';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useHaptics } from '../../hooks/useHaptics';
import { useBreathingCues } from '../../hooks/useBreathingCues';
import { useBackgroundMusic } from '../../hooks/useBackgroundMusic';
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
  
  const { data: safetyFlags } = useSafetyFlags();
  const completeSession = useCompleteSession();
  
  // Custom hooks
  const { playBell } = useAudioCues(); // Legacy bell sound (fallback)
  const { circleRef, animateBreathingCircle, cleanup: cleanupAnimation } = useBreathingAnimation();
  const wakeLock = useWakeLock();
  
  // NEW: Audio & Haptics system
  const haptics = useHaptics();
  const breathingCues = useBreathingCues();
  const backgroundMusic = useBackgroundMusic();
  const { walkingModeEnabled, backgroundMusicEnabled } = useSessionSettings();
  
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
  
  // Auto-start countdown for direct protocol start (skipFlow)
  useEffect(() => {
    if (skipFlow && sessionState === 'idle') {
      startCountdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipFlow, sessionState]);
  
  // ✅ Wake Lock - Keep screen on during active session
  useEffect(() => {
    if (sessionState === 'active') {
      wakeLock.request();
    } else {
      wakeLock.release();
    }
  }, [sessionState]); // FIXED: Removed wakeLock from deps
  
  // ✅ NEW: Preload audio during countdown
  useEffect(() => {
    if (sessionState === 'countdown') {
      breathingCues.preloadAll();
    }
  }, [sessionState]); // FIXED: Removed breathingCues from deps
  
  // ✅ NEW: Background music lifecycle
  useEffect(() => {
    if (!backgroundMusicEnabled) {
      // Music is disabled - don't call pause/play (prevents mounting loop)
      return;
    }
    
    if (sessionState === 'active') {
      backgroundMusic.play();
    } else {
      backgroundMusic.pause();
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
    setMoodBefore(mood);
    startCountdown(); // Skip mood-before state (merged into idle)
  }, []);
  
  // Start countdown after mood selection (or skip)
  const startCountdown = useCallback(() => {
    
    setSessionState('countdown');
    setCountdownNumber(5);
    
    
    // Play start bell (use new breathingCues or fallback to legacy)
    breathingCues.playBell('start').catch(() => {
      playBell();
    });
    
    let count = 5;
    
    const countdownInterval = window.setInterval(() => {
      count--;
      setCountdownNumber(count);
      
      if (count > 0) {
        breathingCues.playBell('start').catch(() => playBell());
      } else {
        window.clearInterval(countdownInterval);
        setSessionState('active');
        setSessionStartTime(new Date());
        setCurrentPhaseIndex(0);
        breathingCues.playBell('start').catch(() => playBell());
      }
    }, 1000);
  }, [breathingCues, playBell]);
  
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

  // Run current phase
  useEffect(() => {
    
    if (sessionState !== 'active' || !currentPhase) {
      return;
    }
    
    
    setPhaseTimeRemaining(currentPhase.duration_seconds);
    
    
    let breathingIntervalId: number | null = null;
    let currentCyclePosition = 0;
    let isWaitingForCycleEnd = false;
    
    // Set instruction based on phase type
    if (currentPhase.type === 'silence') {
      setCurrentInstruction('DOZNĚNÍ');
    }
    
    // Start breathing animation if breathing phase
    if (currentPhase.type === 'breathing' && currentPhase.pattern) {
      const { inhale_seconds, hold_after_inhale_seconds, exhale_seconds, hold_after_exhale_seconds } = currentPhase.pattern;
      const cycleTime = inhale_seconds + hold_after_inhale_seconds + exhale_seconds + hold_after_exhale_seconds;
      
      const phaseStartTime = Date.now();
      let lastInstruction = '';
      
      const updateBreathingState = () => {
        const elapsedTime = (Date.now() - phaseStartTime) / 1000;
        const cyclePosition = elapsedTime % cycleTime;
        currentCyclePosition = cyclePosition;
        
        
        let newInstruction = '';
        
        if (cyclePosition < inhale_seconds) {
          newInstruction = 'NÁDECH';
          if (lastInstruction !== 'NÁDECH') {
            
            // ✅ NEW: Trigger haptics + audio cues
            try {
              haptics.trigger('inhale');
              breathingCues.playCue('inhale');
            } catch { /* ignore audio/haptics errors during breathing */ }
            
            animateBreathingCircle('inhale', inhale_seconds * 1000);
            
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--exhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--inhale');
            }
            lastInstruction = 'NÁDECH';
          }
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds) {
          newInstruction = hold_after_inhale_seconds > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && hold_after_inhale_seconds > 0) {
            // ✅ NEW: Trigger haptics + audio cues
            haptics.trigger('hold');
            breathingCues.playCue('hold');
            
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
            }
            lastInstruction = 'ZADRŽ';
          }
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds + exhale_seconds) {
          newInstruction = 'VÝDECH';
          if (lastInstruction !== 'VÝDECH') {
            // ✅ NEW: Trigger haptics + audio cues
            haptics.trigger('exhale');
            breathingCues.playCue('exhale');
            
            animateBreathingCircle('exhale', exhale_seconds * 1000);
            
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--exhale');
            }
            lastInstruction = 'VÝDECH';
          }
        } else {
          newInstruction = hold_after_exhale_seconds > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && hold_after_exhale_seconds > 0) {
            // ✅ NEW: Trigger haptics + audio cues (second hold)
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
            const { inhale_seconds, hold_after_inhale_seconds, exhale_seconds } = currentPhase.pattern;
            const endOfExhalePosition = inhale_seconds + hold_after_inhale_seconds + exhale_seconds;
            
            if (currentCyclePosition > 0.5 && currentCyclePosition < endOfExhalePosition && !isWaitingForCycleEnd) {
              isWaitingForCycleEnd = true;
              return 0;
            }
            
            if (isWaitingForCycleEnd && currentCyclePosition < 0.5) {
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
            
            if (isWaitingForCycleEnd) {
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
    
    onClose();
  }, [sessionState, onClose, cleanupAnimation]);
  
  // Confirm close during active session
  const confirmClose = useCallback(() => {
    cleanupAnimation();
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    setSessionState('idle');
    setCurrentPhaseIndex(0);
    setMoodBefore(null);
    setMoodAfter(null);
    
    onClose();
  }, [onClose, cleanupAnimation]);
  
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
      
      await completeSession.mutateAsync({
        exercise_id: exercise.id,
        started_at: sessionStartTime,
        completed_at: new Date(),
        was_completed: sessionState === 'completed',
        mood_before: moodBefore || undefined,
        mood_after: moodAfter || undefined,
        quality_rating: qualityRating, // DB field (mapped from difficulty)
        notes: notes.trim() || undefined,
      });
      
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
    return (
      <SafetyQuestionnaire
        isOpen={isOpen}
        onClose={onClose}
        onComplete={() => {
          setSessionState('idle');
        }}
      />
    );
  }
  
  if (!isOpen) return null;
  
  // =====================================================
  // RENDER: Session States
  // =====================================================
  
  return (
    <div className="session-engine-modal" role="dialog" aria-modal="true">
      <div className="session-engine-modal__overlay" onClick={handleClose} />
      
      <div 
        className={`session-engine-modal__content ${
          sessionState === 'completed' ? 'session-engine-modal__content--completion' : ''
        }`}
      >
        {/* IDLE: Combined start + mood screen (exercises only) */}
        {sessionState === 'idle' && !isProtocol(exercise) && (
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
                phaseTimeRemaining={phaseTimeRemaining}
                currentInstruction={currentInstruction}
                circleRef={circleRef as React.RefObject<HTMLDivElement>}
              />
              
              {/* ✅ NEW: Floating "Další:" preview at bottom of ContentZone (Option A) */}
              {phaseTimeRemaining <= 5 && currentPhaseIndex < totalPhases - 1 && (
                <div className="session-active__next-floating">
                  Další: {exercise.breathing_pattern.phases[currentPhaseIndex + 1].name}
                </div>
              )}
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              {/* ✅ ONLY progress bar - clean, predictable, always visible */}
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
                onSave={saveSession}
                isSaving={completeSession.isPending}
              />
            </FullscreenModal.ContentZone>
            
            <FullscreenModal.BottomBar>
              {/* ✅ "Opakovat cvičení" removed - Less is More principle */}
              {/* User can restart via back + start again (3 taps vs 1 tap = acceptable trade-off) */}
              <div />
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
    </div>
  );
}
