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
import { CloseButton } from '@/components/shared';
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
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [countdownNumber, setCountdownNumber] = useState(5);
  const [moodBefore, setMoodBefore] = useState<MoodType | null>(null);
  const [moodAfter, setMoodAfter] = useState<MoodType | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
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
  
  // Start countdown (5-4-3-2-1)
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
  
  // Run current phase
  useEffect(() => {
    if (sessionState !== 'active' || !currentPhase) return;
    
    // Set initial time remaining
    setPhaseTimeRemaining(currentPhase.duration_seconds);
    
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
      let breathingIntervalId: number | null = null;
      
      const updateBreathingState = () => {
        const elapsedTime = (Date.now() - phaseStartTime) / 1000;
        const cyclePosition = elapsedTime % cycleTime;
        
        // Determine current instruction based on cycle position
        let newInstruction = '';
        
        if (cyclePosition < inhale_seconds) {
          newInstruction = 'NÁDECH';
          // Trigger animation only on instruction change
          if (lastInstruction !== 'NÁDECH') {
            animateBreathingCircle('inhale', inhale_seconds * 1000);
          }
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds) {
          newInstruction = hold_after_inhale_seconds > 0 ? 'ZADRŽ' : '';
        } else if (cyclePosition < inhale_seconds + hold_after_inhale_seconds + exhale_seconds) {
          newInstruction = 'VÝDECH';
          // Trigger animation only on instruction change
          if (lastInstruction !== 'VÝDECH') {
            animateBreathingCircle('exhale', exhale_seconds * 1000);
          }
        } else {
          newInstruction = hold_after_exhale_seconds > 0 ? 'ZADRŽ' : '';
        }
        
        if (newInstruction !== lastInstruction) {
          setCurrentInstruction(newInstruction);
          lastInstruction = newInstruction;
        }
      };
      
      // Run breathing cycle update every 100ms (smooth instruction changes)
      breathingIntervalId = window.setInterval(updateBreathingState, 100);
      
      // Cleanup function
      return () => {
        if (breathingIntervalId !== null) {
          window.clearInterval(breathingIntervalId);
        }
      };
    }
    
    // Countdown timer (controls phase transitions)
    timerRef.current = window.setInterval(() => {
      setPhaseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Phase complete, move to next
          setCurrentInstruction('');
          
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
  }, [sessionState, currentPhaseIndex, currentPhase, totalPhases, currentInstruction, animateBreathingCircle, playBell, completeExercise]);
  
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
        difficulty_rating: difficultyRating || undefined,
        notes: notes.trim() || undefined,
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
            <CloseButton onClick={handleClose} className="session-start__close" />
            
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
                <span>
                  {totalPhases === 1 && '1 fáze'}
                  {(totalPhases === 2 || totalPhases === 3 || totalPhases === 4) && `${totalPhases} fáze`}
                  {totalPhases > 4 && `${totalPhases} fází`}
                </span>
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
        
        {/* COUNTDOWN: 5-4-3-2-1 */}
        {sessionState === 'countdown' && (
          <div className="session-countdown">
            <p className="countdown-instruction">Připrav se na první nádech</p>
            <div className="countdown-circle">
              <span className="countdown-number">{countdownNumber}</span>
            </div>
          </div>
        )}
        
        {/* ACTIVE: Breathing session */}
        {sessionState === 'active' && currentPhase && (
          <div className="session-active">
            {/* Close button (with confirm) */}
            <CloseButton onClick={handleClose} className="session-active__close" />
            
            {/* Phase indicator */}
            <div className="session-active__header">
              {totalPhases > 1 && (
                <span className="phase-indicator">
                  Fáze {currentPhaseIndex + 1}/{totalPhases}
                </span>
              )}
              <h3 className="phase-name">{currentPhase.name}</h3>
              {currentPhase.description && (
                <p className="phase-description">{currentPhase.description}</p>
              )}
            </div>
            
            {/* Breathing circle with instruction inside */}
            <div className="breathing-circle-container">
              <div
                ref={circleRef}
                className="breathing-circle"
                aria-label="Dechový pacer"
              >
                {/* Breathing instruction inside circle */}
                {currentInstruction && (
                  <div className="breathing-instruction">
                    {currentInstruction}
                  </div>
                )}
              </div>
            </div>
            
            {/* Timer below circle */}
            <div className="session-timer">
              <span className="timer-seconds">{phaseTimeRemaining}</span>
              <span className="timer-label">sekund</span>
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
              <h2 className="celebration__title">Bomba! Máš dodýcháno!</h2>
              <p className="celebration__message">
                Právě jsi rozdýchal {exercise.name}
              </p>
              
              <div className="celebration__meta">
                <NavIcon name="clock" size={20} />
                <span>{Math.round(exercise.total_duration_seconds / 60)} minut</span>
              </div>
            </div>
            
            {/* Difficulty rating */}
            <div className="difficulty-check">
              <h3 className="difficulty-check__title">Jak se ti dýchalo?</h3>
              <div className="difficulty-options">
                <button
                  className={`difficulty-button ${difficultyRating === 1 ? 'difficulty-button--active' : ''}`}
                  onClick={() => setDifficultyRating(1)}
                  type="button"
                >
                  ⭐ Snadné
                </button>
                <button
                  className={`difficulty-button ${difficultyRating === 2 ? 'difficulty-button--active' : ''}`}
                  onClick={() => setDifficultyRating(2)}
                  type="button"
                >
                  ⭐⭐ Tak akorát
                </button>
                <button
                  className={`difficulty-button ${difficultyRating === 3 ? 'difficulty-button--active' : ''}`}
                  onClick={() => setDifficultyRating(3)}
                  type="button"
                >
                  ⭐⭐⭐ Náročné
                </button>
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
            
            {/* Notes field */}
            <div className="session-notes">
              <label htmlFor="session-notes-input" className="session-notes__label">
                Poznámka (volitelné)
              </label>
              <textarea
                id="session-notes-input"
                className="session-notes__input"
                placeholder="Jak ti to šlo? Nějaké postřehy..."
                maxLength={150}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <div className="session-notes__counter">
                {notes.length}/150
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
