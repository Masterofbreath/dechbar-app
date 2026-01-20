/**
 * SessionActive - Active breathing session screen
 * 
 * Real-time breathing guidance with circle animation
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { NavIcon } from '@/platform/components';
import { CloseButton } from '@/components/shared';
import type { Exercise, ExercisePhase } from '../../../types/exercises';

interface SessionActiveProps {
  exercise: Exercise;
  currentPhase: ExercisePhase;
  currentPhaseIndex: number;
  totalPhases: number;
  phaseTimeRemaining: number;
  currentInstruction: string;
  sessionProgress: number;
  circleRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export function SessionActive({
  exercise,
  currentPhase,
  currentPhaseIndex,
  totalPhases,
  phaseTimeRemaining,
  currentInstruction,
  sessionProgress,
  circleRef,
  onClose,
}: SessionActiveProps) {
  return (
    <>
      {/* Close button & phase indicator */}
      <CloseButton onClick={onClose} className="session-engine-modal__close" ariaLabel="Zavřít" />
      {totalPhases > 1 && (
        <span className="phase-indicator">
          FÁZE {currentPhaseIndex + 1}/{totalPhases}
        </span>
      )}
      
      {/* Přímo session-active bez wrapperu */}
      <div className="session-active active">
        {/* Header se jménem cvičení */}
        <div className="session-header">
          <h3 className="session-exercise-name">{exercise.name}</h3>
          {currentPhase.name && (
            <p className="session-instruction">{currentPhase.name}</p>
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
      
      {/* Progress bar zůstává mimo session-active */}
      <div className="session-progress">
        <div 
          className="session-progress__fill" 
          style={{ width: `${sessionProgress}%` }}
        />
      </div>
    </>
  );
}
