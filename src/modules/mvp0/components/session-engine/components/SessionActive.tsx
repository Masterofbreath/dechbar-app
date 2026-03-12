import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { Exercise, ExercisePhase } from '../../../types/exercises';
import { IntensityDots } from './IntensityDots';

interface SessionActiveProps {
  exercise: Exercise;
  currentPhase: ExercisePhase;
  currentPhaseIndex: number;
  totalPhases: number;
  currentInstruction: string;
  circleRef: React.RefObject<HTMLDivElement>;
  /** Intensity control — undefined means controls are hidden (protocols) */
  intensityStep?: number;
  canIncrease?: boolean;
  canDecrease?: boolean;
  onIncrease?: () => void;
  onDecrease?: () => void;
}

export function SessionActive({
  exercise,
  currentPhase,
  currentInstruction,
  circleRef,
  intensityStep,
  canIncrease,
  canDecrease,
  onIncrease,
  onDecrease,
}: SessionActiveProps) {
  const showIntensityControls = intensityStep !== undefined;
  // Map instruction text to circle state for color transitions
  const getCircleState = (instruction: string): 'inhale' | 'exhale' | 'hold' => {
    if (instruction === 'NÁDECH') return 'inhale';
    if (instruction === 'VÝDECH') return 'exhale';
    if (instruction === 'ZADRŽ') return 'hold';
    return 'hold'; // Default
  };

  // Detect special phases
  // 'Doznění' in SMART sessions is still a guided breathing phase (not free-flow).
  // Only the 'Ticho' silence phase should be treated as final/free-flow.
  const isSilencePhase = currentPhase.type === 'silence';
  const isFinalPhase = 
    isSilencePhase ||
    currentPhase.name === 'Ticho' || 
    currentPhase.name.toLowerCase() === 'ticho';
  const isBuzzingPhase = 
    currentPhase.name === 'Nosní bzučení' || 
    currentPhase.name === 'Bzučení';
  const isDozneniFase =
    currentPhase.name === 'Doznění' ||
    currentPhase.name.toLowerCase().includes('doznění');

  return (
    <div className={`session-active${showIntensityControls ? ' session-active--with-intensity' : ''}`}>
      {/* Protocol: Instructions OR Phase name ABOVE circle */}
      {isProtocol(exercise) && currentPhase && (
        <>
          {currentPhase.instructions && !isFinalPhase && !isBuzzingPhase ? (
            <p className="session-active__instruction-text">
              {currentPhase.instructions}
            </p>
          ) : (
            <p className="session-active__phase-name">
              {currentPhase.name}
            </p>
          )}
          {isFinalPhase && (
            <p className="session-active__final-instruction">
              Dýchej volně ve svém rytmu
            </p>
          )}
          {isBuzzingPhase && (
            <p className="session-active__buzzing-hint">
              Při výdechu jemně bzuč
            </p>
          )}
        </>
      )}

      {/* SMART / custom exercise: phase name + special instructions above circle */}
      {!isProtocol(exercise) && currentPhase && (
        <>
          {/* Trůn sessions mají jednu fázi — název fáze je zbytečný, jen matoucí */}
          {!exercise.tags?.includes('tron') && (
            <p className="session-active__phase-name">
              {currentPhase.name}
            </p>
          )}
          {isBuzzingPhase && (
            <p className="session-active__buzzing-hint">
              Při výdechu jemně bzuč
            </p>
          )}
          {isFinalPhase && (
            <p className="session-active__final-instruction">
              Dýchej volně ve svém rytmu
            </p>
          )}
          {isDozneniFase && !isFinalPhase && (
            <p className="session-active__phase-hint">
              Návrat k základnímu rytmu
            </p>
          )}
          {currentPhase.instructions && !isBuzzingPhase && !isFinalPhase && !isDozneniFase && (
            <p className="session-active__phase-hint">
              {currentPhase.instructions}
            </p>
          )}
        </>
      )}

      {/*
        intensity-circle-zone wraps [−][circle][+] as one unit.
        Desktop: flex row — buttons are in-flow left/right of the circle.
        Mobile: display:contents — buttons escape to ContentZone positioning context
                (ContentZone is position:relative, buttons become position:absolute to it).
        This ensures IntensityDots NEVER affects the circle's centered position.
      */}
      <div className={showIntensityControls ? 'intensity-circle-zone' : undefined}>
        {/* Intensity: − button */}
        {showIntensityControls && (
          <button
            className="intensity-control__button intensity-control__button--decrease"
            onClick={onDecrease}
            disabled={!canDecrease}
            aria-label="Snížit intenzitu"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Breathing circle */}
        <BreathingCircle
          variant="animated"
          size={280}
          state={getCircleState(currentInstruction)}
          circleRef={circleRef}
        >
          {currentInstruction && (
            <div className="breathing-instruction">
              <span className="breathing-instruction__text">
                {isFinalPhase ? 'VOLNĚ' : currentInstruction}
              </span>
              {isBuzzingPhase && currentInstruction === 'VÝDECH' && (
                <span className="breathing-hint">(bzzz)</span>
              )}
            </div>
          )}
        </BreathingCircle>

        {/* Intensity: + button */}
        {showIntensityControls && (
          <button
            className="intensity-control__button intensity-control__button--increase"
            onClick={onIncrease}
            disabled={!canIncrease}
            aria-label="Zvýšit intenzitu"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Intensity indicator: dots + hint label (below circle, above timer) */}
      {showIntensityControls && (
        <div className="intensity-indicator">
          <IntensityDots step={intensityStep} />
          <span className="intensity-indicator__label">Intenzita</span>
        </div>
      )}

    </div>
  );
}
