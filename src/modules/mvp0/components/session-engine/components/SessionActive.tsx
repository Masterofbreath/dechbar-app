import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { isProtocol } from '@/utils/exerciseHelpers';
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
  exercise,
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
      {/* Protocol: Instructions OR Phase name ABOVE circle */}
      {isProtocol(exercise) && currentPhase && (
        currentPhase.instructions && !isFinalPhase && !isBuzzingPhase ? (
          <p className="session-active__instruction-text">
            {currentPhase.instructions}
          </p>
        ) : (
          <p className="session-active__phase-name">
            {currentPhase.name}
          </p>
        )
      )}
      
      {/* Buzzing phase: Instruction above circle */}
      {isBuzzingPhase && (
        <p className="session-active__buzzing-hint">
          Při výdechu jemně bzuč
        </p>
      )}
      
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
                {currentInstruction === 'VÝDECH' && (
                  <span className="breathing-hint">(bzzz)</span>
                )}
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
    </>
  );
}
