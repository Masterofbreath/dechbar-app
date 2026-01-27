/**
 * SessionActive - Active breathing session screen
 * 
 * Real-time breathing guidance with circle animation
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { NavIcon } from '@/platform/components';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
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
}: SessionActiveProps) {
  // Map instruction text to circle state for color transitions
  const getCircleState = (instruction: string): 'inhale' | 'exhale' | 'hold' => {
    if (instruction === 'NÁDECH') return 'inhale';
    if (instruction === 'VÝDECH') return 'exhale';
    if (instruction === 'ZADRŽ') return 'hold';
    return 'hold'; // Default
  };

  // Detect special phases
  const isFinalPhase = 
    currentPhase.name === 'Doznění' || 
    currentPhase.name.toLowerCase().includes('doznění');
  const isBuzzingPhase = 
    currentPhase.name === 'Nosní bzučení' || 
    currentPhase.name === 'Bzučení';

  return (
    <>
      {/* Přímo session-active bez wrapperu */}
      <div className="session-active active">
        {/* Exercise name - FIXED top-left (via fullscreen-modal-mobile.css) */}
        <h3 className="session-exercise-name">{exercise.name}</h3>
        
        {/* Hidden header wrapper - pouze pro instruction text (shown as fixed below circle) */}
        <div className="session-header">
          {currentPhase.name && (
            <p className="session-instruction">
              {/* ✅ Dynamický text pro speciální fáze */}
              {isFinalPhase 
                ? 'Doznění – dýchej podle sebe'
                : isBuzzingPhase
                  ? 'Bzučení – při výdechu jemně bzuč.'
                  : currentPhase.name
              }
            </p>
          )}
        </div>
      
        {/* Breathing circle with instruction inside */}
        <BreathingCircle
          variant="animated"
          size={280}
          state={getCircleState(currentInstruction)}
          circleRef={circleRef}
        >
          {/* Breathing instruction inside circle */}
          {currentInstruction && (
            <div className="breathing-instruction">
              {/* ✅ Dynamický obsah kruhu pro speciální fáze */}
              {isFinalPhase ? (
                'VOLNĚ'
              ) : isBuzzingPhase ? (
                <>
                  {currentInstruction}
                  <span className="breathing-hint">(bzzz)</span>
                </>
              ) : (
                currentInstruction
              )}
            </div>
          )}
        </BreathingCircle>
      
      {/* Timer below circle */}
      <div className="session-timer">
        <span className="timer-seconds">{phaseTimeRemaining} s</span>
      </div>
      
        {/* Instructions - SKRYTO pro poslední fázi a bzučení fázi ✅ */}
        {currentPhase.instructions && !isFinalPhase && !isBuzzingPhase && (
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
