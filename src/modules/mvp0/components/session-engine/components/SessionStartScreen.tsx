/**
 * SessionStartScreen - Exercise start screen (idle state)
 * 
 * Shows exercise metadata and primary CTA
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { Button } from '@/platform/components';
import type { Exercise } from '../../../types/exercises';

interface SessionStartScreenProps {
  exercise: Exercise;
  onStart: () => void;
}

export function SessionStartScreen({ exercise, onStart }: SessionStartScreenProps) {
  return (
    <div className="session-start">
      <p className="session-start__description">{exercise.description}</p>
      
      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        className="session-start__button"
      >
        Začít cvičení
      </Button>
    </div>
  );
}
