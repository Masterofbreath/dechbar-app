/**
 * SessionCountdown - 5-4-3-2-1 countdown screen
 * 
 * Preparation phase with breathing tip
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import type { Exercise } from '../../../types/exercises';

interface SessionCountdownProps {
  exercise: Exercise;
  countdownNumber: number;
  isActive: boolean;
}

export function SessionCountdown({ exercise, countdownNumber, isActive }: SessionCountdownProps) {
  return (
    <div className={`session-countdown ${isActive ? 'active' : 'exiting'}`}>
      {/* Header se jménem cvičení */}
      <div className="session-header">
        <h3 className="session-exercise-name">{exercise.name}</h3>
        <p className="session-instruction">Připrav se na první nádech</p>
      </div>
      
      {/* Container - stejná velikost jako breathing-circle-container */}
      <div className="countdown-circle-container">
        <div className="countdown-circle">
          <span className="countdown-number">{countdownNumber}</span>
        </div>
      </div>
    </div>
  );
}
