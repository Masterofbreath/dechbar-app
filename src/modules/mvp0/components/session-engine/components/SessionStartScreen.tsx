/**
 * SessionStartScreen - Exercise start screen (idle state)
 * 
 * Combined modal: Icon + Description + Embedded Mood Pick
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { NavIcon } from '@/platform/components';
import { MoodBeforePick } from './MoodBeforePick';
import type { Exercise, MoodType } from '../../../types/exercises';

interface SessionStartScreenProps {
  exercise: Exercise;
  mood: MoodType | null;
  onMoodChange: (mood: MoodType) => void;
}

export function SessionStartScreen({ 
  exercise, 
  mood,
  onMoodChange 
}: SessionStartScreenProps) {
  // Icon based on exercise type
  const iconName = exercise.breathing_pattern.phases[0]?.type === 'breathing' 
    ? 'wind' 
    : 'moon';
  
  return (
    <div className="session-start">
      {/* Icon */}
      <div className="session-start__icon">
        <NavIcon name={iconName} size={48} />
      </div>
      
      {/* Description */}
      <p className="session-start__description">
        {exercise.description}
      </p>
      
      {/* Divider */}
      <div className="session-start__divider" />
      
      {/* Embedded Mood Pick */}
      <div className="session-start__mood">
        <h4 className="session-start__mood-title">Jak se teď cítíš?</h4>
        <MoodBeforePick 
          value={mood} 
          onChange={onMoodChange}
        />
        <p className="session-start__mood-hint">
          (volitelné)
        </p>
      </div>
    </div>
  );
}
