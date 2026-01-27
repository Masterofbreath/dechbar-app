/**
 * SessionCountdown - 5-4-3-2-1 countdown screen
 * 
 * Protocols: Display exercise description (contextual info)
 * Exercises: Display rotating breathing tips (educational value)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useState, useEffect } from 'react';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { MiniTip } from '@/platform/components/shared/MiniTip';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { Exercise } from '../../../types/exercises';

interface SessionCountdownProps {
  exercise: Exercise;
  countdownNumber: number;
  isActive: boolean;
}

/**
 * Breathing tips for countdown screen (regular exercises)
 * Each tip is readable in ~4 seconds and provides real value
 */
const BREATHING_TIPS = [
  'Pro nejpřesnější výsledky měř KP ráno hned po probuzení.',
  'Vždy dýchej nosem – kyslík se vstřebává efektivněji a tělo se zklidňuje.',
  'Dýchej břichem, ne hrudí – aktivuješ bránici a zklidníš nervový systém.',
  'Delší výdech než nádech aktivuje parasympatikus a uklidňuje mysl.',
  'Pravidelné dechové cvičení je účinnější než občasné intenzivní sezení.',
] as const;

/**
 * Get rotating tip based on session history
 * Uses localStorage to track session count for deterministic rotation
 */
function getRotatingTip(): string {
  try {
    const sessionCount = parseInt(localStorage.getItem('dechbar_session_count') || '0', 10);
    const tipIndex = sessionCount % BREATHING_TIPS.length;
    return BREATHING_TIPS[tipIndex];
  } catch {
    // Fallback to first tip if localStorage fails
    return BREATHING_TIPS[0];
  }
}

export function SessionCountdown({ exercise, countdownNumber, isActive }: SessionCountdownProps) {
  const [currentTip] = useState(() => getRotatingTip());
  
  // Increment session count on mount (for next session)
  useEffect(() => {
    try {
      const currentCount = parseInt(localStorage.getItem('dechbar_session_count') || '0', 10);
      localStorage.setItem('dechbar_session_count', String(currentCount + 1));
    } catch {
      // Silent fail - not critical
    }
  }, []);
  
  return (
    <div className={`session-countdown ${isActive ? 'active' : 'exiting'}`}>
      {/* Exercise name - FIXED top-left (via fullscreen-modal-mobile.css) */}
      <h3 className="session-exercise-name">{exercise.name}</h3>
      
      {/* Hidden header wrapper - pouze pro instruction text (shown as fixed below circle) */}
      <div className="session-header">
        <p className="session-instruction">Připrav se na první nádech</p>
      </div>
      
      {/* Countdown circle using shared component */}
      <BreathingCircle variant="static" size={280}>
        <span className="countdown-number">{countdownNumber}</span>
      </BreathingCircle>
      
      {/* Conditional content: Protocol description vs Exercise tips */}
      {isProtocol(exercise) ? (
        // PROTOCOLS: Show contextual description
        <p className="session-countdown__description">
          {exercise.description}
        </p>
      ) : (
        // EXERCISES: Show rotating breathing tips
        <MiniTip variant="static" className="session-countdown__tip">
          <strong>Tip:</strong> {currentTip}
        </MiniTip>
      )}
    </div>
  );
}
