import { useEffect } from 'react';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { Exercise } from '../../../types/exercises';

interface SessionCountdownProps {
  exercise: Exercise;
  countdownNumber: number;
  currentPhaseIndex?: number; // For phase name display
}

// Rotating tips for exercises
const BREATHING_TIPS = [
  'Najdi klidné místo a soustřeď se na dech',
  'Dýchej nosem, výdech pusť ústy',
  'Nech ramena uvolněná a hrudník otevřený',
  'Soustřeď se pouze na přítomný okamžik',
];

function getRotatingTip(): string {
  const tipIndex = Math.floor(Date.now() / 10000) % BREATHING_TIPS.length;
  return BREATHING_TIPS[tipIndex];
}

export function SessionCountdown({ 
  exercise, 
  countdownNumber,
  currentPhaseIndex = 0 
}: SessionCountdownProps) {
  // Increment session count on mount (for tracking)
  useEffect(() => {
    try {
      const currentCount = parseInt(localStorage.getItem('dechbar_session_count') || '0', 10);
      localStorage.setItem('dechbar_session_count', String(currentCount + 1));
    } catch {
      // Silent fail - not critical
    }
  }, []);
  
  const currentPhase = exercise.breathing_pattern.phases[currentPhaseIndex];
  
  return (
    <>
      {/* Protocol: Phase name ABOVE circle */}
      {isProtocol(exercise) && currentPhase && (
        <p className="session-countdown__phase-name">
          {currentPhase.name}
        </p>
      )}
      
      {/* Countdown circle using shared component */}
      <BreathingCircle variant="static" size={280}>
        <span className="countdown-number">{countdownNumber}</span>
      </BreathingCircle>
      
      {/* Protocol: Description BELOW circle */}
      {isProtocol(exercise) && (
        <p className="session-countdown__description">
          {exercise.description}
        </p>
      )}
      
      {/* Exercise: MiniTip BELOW circle */}
      {!isProtocol(exercise) && (
        <p className="session-countdown__tip">
          💡 {getRotatingTip()}
        </p>
      )}
    </>
  );
}
