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
  circleRef: React.RefObject<HTMLDivElement>;
}

export function SessionActive({
  currentPhase,
  phaseTimeRemaining,
  currentInstruction,
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
    </>
  );
}
