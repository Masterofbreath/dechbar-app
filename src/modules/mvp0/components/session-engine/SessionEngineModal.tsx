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

import { useState, useEffect, useRef, useCallback } from 'react';
import { useScrollLock } from '@/platform/hooks';
import { ConfirmModal } from '@/components/shared';
import { useBreathingAnimation } from '@/components/shared/BreathingCircle';
import { SafetyQuestionnaire } from '../SafetyQuestionnaire';
import { useSafetyFlags, useCompleteSession } from '../../api/exercises';
import { useAudioCues } from './hooks/useAudioCues';
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
}

/**
 * SessionEngineModal - Complete session engine
 */
export function SessionEngineModal({
  exercise,
  isOpen = true,
  onClose,
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
  const { playBell } = useAudioCues();
  const { circleRef, animateBreathingCircle, cleanup: cleanupAnimation } = useBreathingAnimation();
  
  useScrollLock(isOpen);
  
  const currentPhase = exercise.breathing_pattern.phases[currentPhaseIndex];
  const totalPhases = exercise.breathing_pattern.phases.length;
  
  // Update ref when phase index changes
  useEffect(() => {
    currentPhaseRef.current = currentPhaseIndex;
  }, [currentPhaseIndex]);
  
  // Hide nav on mobile (immersive mode)
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      document.body.classList.add('session-active');
    }
    return () => {
      document.body.classList.remove('session-active');
    };
  }, [isOpen]);
  
  // =====================================================
  // SESSION FLOW: State Machine
  // =====================================================
  
  // Start session (idle → mood-before → countdown → active)
  const startSession = useCallback(() => {
    setSessionState('mood-before');
  }, []);
  
  // Start countdown after mood selection (or skip)
  const startCountdown = useCallback(() => {
    setSessionState('countdown');
    setCountdownNumber(5);
    playBell();
    
    let count = 5;
    const countdownInterval = window.setInterval(() => {
      count--;
      setCountdownNumber(count);
      
      if (count > 0) {
        playBell();
      } else {
        window.clearInterval(countdownInterval);
        setSessionState('active');
        setSessionStartTime(new Date());
        setCurrentPhaseIndex(0);
        playBell();
      }
    }, 1000);
  }, [playBell]);
  
  // Complete exercise
  const completeExercise = useCallback(() => {
    setSessionState('completed');
    playBell();
    
    // Stop all animations
    cleanupAnimation();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
  }, [playBell, cleanupAnimation]);
  
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
    if (sessionState !== 'active' || !currentPhase) return;
    
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
            animateBreathingCircle('inhale', inhale_seconds * 1000);
            
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--exhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--inhale');
              
              // Gold pulse removed - Calm by Default
            }
            lastInstruction = 'NÁDECH';
          }
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds) {
          newInstruction = hold_after_inhale_seconds > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && hold_after_inhale_seconds > 0) {
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
              
              // Gold pulse removed - Calm by Default
            }
            lastInstruction = 'ZADRŽ';
          }
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds + exhale_seconds) {
          newInstruction = 'VÝDECH';
          if (lastInstruction !== 'VÝDECH') {
            animateBreathingCircle('exhale', exhale_seconds * 1000);
            
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--hold');
              circleRef.current.classList.add('breathing-circle--exhale');
              
              // Gold pulse removed - Calm by Default
            }
            lastInstruction = 'VÝDECH';
          }
        } else {
          newInstruction = hold_after_exhale_seconds > 0 ? 'ZADRŽ' : '';
          if (lastInstruction !== 'ZADRŽ' && hold_after_exhale_seconds > 0) {
            if (circleRef.current) {
              circleRef.current.classList.remove('breathing-circle--inhale', 'breathing-circle--exhale');
              circleRef.current.classList.add('breathing-circle--hold');
              
              // Gold pulse removed - Calm by Default
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
  }, [sessionState, currentPhase, totalPhases, animateBreathingCircle, playBell, completeExercise, cleanupAnimation, circleRef]);
  
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
      
      <div className="session-engine-modal__content">
        {/* IDLE: Start screen */}
        {sessionState === 'idle' && (
          <SessionStartScreen
            exercise={exercise}
            onStart={startSession}
            onClose={handleClose}
          />
        )}
        
        {/* MOOD BEFORE: Quick emoji pick */}
        {sessionState === 'mood-before' && (
          <MoodBeforePick
            value={moodBefore}
            onChange={(mood) => {
              setMoodBefore(mood);
              startCountdown(); // Automaticky pokračovat na countdown
            }}
            onSkip={startCountdown} // Přeskočit a jít rovnou na countdown
          />
        )}
        
        {/* COUNTDOWN + ACTIVE: With wrapper for absolute positioning */}
        {(sessionState === 'countdown' || sessionState === 'active') && (
          <div className="session-states-wrapper">
            {/* COUNTDOWN: 5-4-3-2-1 */}
            {sessionState === 'countdown' && (
              <SessionCountdown
                exercise={exercise}
                countdownNumber={countdownNumber}
                isActive={true}
              />
            )}
            
            {/* ACTIVE: Breathing session */}
            {sessionState === 'active' && currentPhase && (
              <SessionActive
                exercise={exercise}
                currentPhase={currentPhase}
                currentPhaseIndex={currentPhaseIndex}
                totalPhases={totalPhases}
                phaseTimeRemaining={phaseTimeRemaining}
                currentInstruction={currentInstruction}
                sessionProgress={sessionProgress}
                circleRef={circleRef as React.RefObject<HTMLDivElement>}
                onClose={handleClose}
              />
            )}
          </div>
        )}
        
        {/* COMPLETED: Celebration & survey */}
        {sessionState === 'completed' && (
          <SessionCompleted
            exercise={exercise}
            difficultyRating={difficultyRating}
            onDifficultyChange={setDifficultyRating}
            moodAfter={moodAfter}
            onMoodChange={setMoodAfter}
            notes={notes}
            onNotesChange={setNotes}
            onSave={saveSession}
            onRepeat={() => {
              setSessionState('idle');
              setCurrentPhaseIndex(0);
              setMoodAfter(null);
            }}
            isSaving={completeSession.isPending}
          />
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
