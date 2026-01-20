/**
 * SessionStartScreen - Exercise start screen (idle state)
 * 
 * Shows exercise metadata and primary CTA
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { NavIcon, Button } from '@/platform/components';
import { CloseButton } from '@/components/shared';
import type { Exercise } from '../../../types/exercises';

interface SessionStartScreenProps {
  exercise: Exercise;
  onStart: () => void;
  onClose: () => void;
}

export function SessionStartScreen({ exercise, onStart, onClose }: SessionStartScreenProps) {
  const totalPhases = exercise.breathing_pattern.phases.length;
  const currentPhase = exercise.breathing_pattern.phases[0];
  
  return (
    <div className="session-start">
      <CloseButton onClick={onClose} className="session-start__close" />
      
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
        onClick={onStart}
        className="session-start__button"
      >
        Začít cvičení
      </Button>
    </div>
  );
}
