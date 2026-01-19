/**
 * SessionEngineModal - Breathing Exercise Session Engine
 * 
 * Guides user through multi-phase breathing exercise with:
 * - JS+RAF circle animation (cubic-bezier easing)
 * - Phase countdown timer
 * - Phase indicator (3/7)
 * - Bell audio cues on phase transitions
 * - NO PAUSE (uninterrupted flow for focus)
 * - Safety questionnaire (first-time users)
 * - Completion tracking with mood check
 * 
 * Design: Dark-first, teal breathing circle, gold completion
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { NavIcon, Button } from '@/platform/components';
import { useScrollLock } from '@/platform/hooks';
import { SafetyQuestionnaire } from './SafetyQuestionnaire';
import { useSafetyFlags, useCompleteSession } from '../api/exercises';
import type { Exercise, SessionState, MoodType } from '../types/exercises';

export interface SessionEngineModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * SessionEngineModal - Complete session engine
 */
export function SessionEngineModal({
  exercise,
  isOpen,
  onClose,
}: SessionEngineModalProps) {
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [moodBefore, setMoodBefore] = useState<MoodType | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodType | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  const circleRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: safetyFlags } = useSafetyFlags();
  const completeSession = useCompleteSession();
  
  useScrollLock(isOpen);
  
  const currentPhase = exercise.breathing_pattern.phases[currentPhaseIndex];
  const totalPhases = exercise.breathing_pattern.phases.length;
  
  // =====================================================
  // AUDIO: Bell Cue
  // =====================================================
  
  useEffect(() => {
    // Preload bell sound (Web Audio API ready for MVP2)
    // For MVP1: Using simple HTML5 Audio
    bellAudioRef.current = new Audio('/sounds/bell.mp3');
    bellAudioRef.current.volume = 0.5;
    
    return () => {
      if (bellAudioRef.current) {
        bellAudioRef.current.pause();
        bellAudioRef.current = null;
      }
    };
  }, []);
  
  const playBell = useCallback(() => {
    if (bellAudioRef.current) {
      bellAudioRef.current.currentTime = 0;
      bellAudioRef.current.play().catch(err => {
        console.warn('Bell audio play failed:', err);
      });
    }
  }, []);
  
  // =====================================================
  // ANIMATION: Breathing Circle (JS+RAF)
  // =====================================================
  
  const animateBreathingCircle = useCallback((
    type: 'inhale' | 'exhale',
    durationMs: number
  ) => {
    if (!circleRef.current) return;
    
    const startTime = performance.now();
    const startScale = type === 'inhale' ? 1.0 : 1.5;
    const endScale = type === 'inhale' ? 1.5 : 1.0;
    
    // Cubic-bezier easing (same as CSS ease-in-out)
    const easeInOutCubic = (t: number): number => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };
    
    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeInOutCubic(progress);
      const scale = startScale + (endScale - startScale) * easedProgress;
      
      if (circleRef.current) {
        circleRef.current.style.transform = `scale(${scale})`;
      }
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);
  
  // =====================================================
  // SESSION FLOW: State Machine
  // =====================================================
  
  // Start countdown (3-2-1)
  const startCountdown = useCallback(() => {
    setSessionState('countdown');
    playBell();
    
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        playBell();
      } else {
        clearInterval(countdownInterval);
        startSession();
      }
    }, 1000);
  }, [playBell]);
  
  // Start active session
  const startSession = useCallback(() => {
    setSessionState('active');
    setSessionStartTime(new Date());
    setCurrentPhaseIndex(0);
    playBell();
  }, [playBell]);
  
  // Run current phase
  useEffect(() => {
    if (sessionState !== 'active' || !currentPhase) return;
    
    // Set initial time remaining
    setPhaseTimeRemaining(currentPhase.duration_seconds);
    
    // Start breathing animation if breathing phase
    if (currentPhase.type === 'breathing' && currentPhase.pattern) {
      const { inhale_seconds, exhale_seconds } = currentPhase.pattern;
      const cycleMs = (inhale_seconds + exhale_seconds) * 1000;
      const phaseDurationMs = currentPhase.duration_seconds * 1000;
      const cyclesNeeded = Math.ceil(phaseDurationMs / cycleMs);
      
      let currentCycle = 0;
      
      const runBreathingCycle = () => {
        if (currentCycle >= cyclesNeeded) return;
        
        // Inhale
        animateBreathingCircle('inhale', inhale_seconds * 1000);
        
        setTimeout(() => {
          // Exhale
          animateBreathingCircle('exhale', exhale_seconds * 1000);
          
          currentCycle++;
          
          setTimeout(() => {
            if (currentCycle < cyclesNeeded && sessionState === 'active') {
              runBreathingCycle();
            }
          }, exhale_seconds * 1000);
        }, inhale_seconds * 1000);
      };
      
      runBreathingCycle();
    }
    
    // Countdown timer
    timerRef.current = window.setInterval(() => {
      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Phase complete, move to next
          if (currentPhaseIndex < totalPhases - 1) {
            setCurrentPhaseIndex((i) => i + 1);
            playBell();
          } else {
            // All phases complete
            completeExercise();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [sessionState, currentPhaseIndex, currentPhase, totalPhases, animateBreathingCircle, playBell]);
  
  // Complete exercise
  const completeExercise = useCallback(() => {
    setSessionState('completed');
    playBell();
    
    // Stop all animations
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
  }, [playBell]);
  
  // Handle modal close
  const handleClose = useCallback(() => {
    if (sessionState === 'active') {
      // Confirm before closing active session
      if (!confirm('Opravdu ukončit cvičení? Progres nebude uložen.')) {
        return;
      }
      setSessionState('abandoned');
    }
    
    // Cleanup
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    // Reset state
    setSessionState('idle');
    setCurrentPhaseIndex(0);
    setMoodBefore(null);
    setMoodAfter(null);
    
    onClose();
  }, [sessionState, onClose]);
  
  // Save session to history
  const saveSession = useCallback(async () => {
    if (!sessionStartTime) return;
    
    try {
      await completeSession.mutateAsync({
        exercise_id: exercise.id,
        started_at: sessionStartTime,
        completed_at: new Date(),
        was_completed: sessionState === 'completed',
        mood_before: moodBefore || undefined,
        mood_after: moodAfter || undefined,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Nepodařilo se uložit session. Zkus to znovu.');
    }
  }, [exercise.id, sessionStartTime, sessionState, moodBefore, moodAfter, completeSession, onClose]);
  
  // =====================================================
  // RENDER: Safety Questionnaire (first-time)
  // =====================================================
  
  if (isOpen && safetyFlags && !safetyFlags.questionnaire_completed) {
    return (
      <SafetyQuestionnaire
        isOpen={isOpen}
        onClose={onClose}
        onComplete={() => {
          // After questionnaire, show exercise start screen
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
          <div className="session-start">
            <button
              className="session-start__close"
              onClick={handleClose}
              aria-label="Zavřít"
              type="button"
            >
              <NavIcon name="x" size={24} />
            </button>
            
            <div className="session-start__icon">
              <NavIcon name={currentPhase?.type === 'breathing' ? 'wind' : 'moon'} size={48} />
            </div>
            
            <h2 className="session-start__title">{exercise.name}</h2>
            <p className="session-start__description">{exercise.description}</p>
            
            <div className="session-start__meta">
              <div className="meta-item">
                <NavIcon name="clock" size={20} />
                <span>{Math.round(exercise.total_duration_seconds / 60)} minut</span>
              </div>
              
              <div className="meta-item">
                <NavIcon name="layers" size={20} />
                <span>{totalPhases} fází</span>
              </div>
              
              {exercise.difficulty && (
                <div className="meta-item">
                  <NavIcon name="bar-chart" size={20} />
                  <span>
                    {exercise.difficulty === 'beginner' && 'Začátečník'}
                    {exercise.difficulty === 'intermediate' && 'Pokročilý'}
                    {exercise.difficulty === 'advanced' && 'Expert'}
                  </span>
                </div>
              )}
            </div>
            
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={startCountdown}
              className="session-start__button"
            >
              Začít cvičení
            </Button>
          </div>
        )}
        
        {/* COUNTDOWN: 3-2-1 */}
        {sessionState === 'countdown' && (
          <div className="session-countdown">
            <div className="countdown-circle">
              {/* Animated countdown number */}
              <span className="countdown-number">Připrav se...</span>
            </div>
          </div>
        )}
        
        {/* ACTIVE: Breathing session */}
        {sessionState === 'active' && currentPhase && (
          <div className="session-active">
            {/* Close button (with confirm) */}
            <button
              className="session-active__close"
              onClick={handleClose}
              aria-label="Ukončit cvičení"
              type="button"
            >
              <NavIcon name="x" size={24} />
            </button>
            
            {/* Phase indicator */}
            <div className="session-active__header">
              <span className="phase-indicator">
                Fáze {currentPhaseIndex + 1}/{totalPhases}
              </span>
              <h3 className="phase-name">{currentPhase.name}</h3>
              {currentPhase.description && (
                <p className="phase-description">{currentPhase.description}</p>
              )}
            </div>
            
            {/* Breathing circle */}
            <div className="breathing-circle-container">
              <div
                ref={circleRef}
                className="breathing-circle"
                aria-label="Dechový pacer"
              />
              
              {/* Timer overlay */}
              <div className="breathing-circle__timer">
                <span className="timer-seconds">{phaseTimeRemaining}</span>
                <span className="timer-label">sekund</span>
              </div>
            </div>
            
            {/* Instructions (if present) */}
            {currentPhase.instructions && (
              <div className="session-active__instructions">
                <NavIcon name="info" size={16} />
                <span>{currentPhase.instructions}</span>
              </div>
            )}
            
            {/* Next phase preview */}
            {currentPhaseIndex < totalPhases - 1 && (
              <div className="session-active__next">
                <span className="next-label">Další:</span>
                <span className="next-name">
                  {exercise.breathing_pattern.phases[currentPhaseIndex + 1].name}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* COMPLETED: Celebration & mood check */}
        {sessionState === 'completed' && (
          <div className="session-completed">
            <div className="celebration">
              <div className="celebration__icon">🎉</div>
              <h2 className="celebration__title">Gratulujeme!</h2>
              <p className="celebration__message">
                Dokončil jsi {exercise.name}
              </p>
              
              <div className="celebration__meta">
                <NavIcon name="clock" size={20} />
                <span>{Math.round(exercise.total_duration_seconds / 60)} minut</span>
              </div>
            </div>
            
            {/* Mood check */}
            <div className="mood-check">
              <h3 className="mood-check__title">Jak se teď cítíš?</h3>
              <div className="mood-options">
                {(['energized', 'calm', 'tired', 'stressed'] as MoodType[]).map((mood) => (
                  <button
                    key={mood}
                    className={`mood-button ${moodAfter === mood ? 'mood-button--active' : ''}`}
                    onClick={() => setMoodAfter(mood)}
                    type="button"
                  >
                    {mood === 'energized' && '⚡ Energický'}
                    {mood === 'calm' && '😌 Klidný'}
                    {mood === 'tired' && '😴 Unavený'}
                    {mood === 'stressed' && '😰 Stresovaný'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="session-completed__actions">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={saveSession}
                loading={completeSession.isPending}
              >
                Uložit & Zavřít
              </Button>
              
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => {
                  setSessionState('idle');
                  setCurrentPhaseIndex(0);
                  setMoodAfter(null);
                }}
              >
                🔁 Opakovat cvičení
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
