/**
 * SessionCountdown - 5-4-3-2-1 countdown screen
 * 
 * Protocols: Display exercise description (contextual info)
 * Exercises: MiniTip moved to BottomBar
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useEffect } from 'react';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { Exercise } from '../../../types/exercises';

interface SessionCountdownProps {
  exercise: Exercise;
  countdownNumber: number;
}

export function SessionCountdown({ exercise, countdownNumber }: SessionCountdownProps) {
  // Increment session count on mount (for tracking)
  useEffect(() => {
    try {
      const currentCount = parseInt(localStorage.getItem('dechbar_session_count') || '0', 10);
      localStorage.setItem('dechbar_session_count', String(currentCount + 1));
    } catch {
      // Silent fail - not critical
    }
  }, []);
  
  return (
    <>
      {/* Protocol description ABOVE circle */}
      {isProtocol(exercise) && (
        <p className="session-countdown__description">
          {exercise.description}
        </p>
      )}
      
      {/* Countdown circle using shared component */}
      <BreathingCircle variant="static" size={280}>
        <span className="countdown-number">{countdownNumber}</span>
      </BreathingCircle>
      
      {/* MiniTip moved to BottomBar - removed from here */}
    </>
  );
}
