import { NavIcon, Button } from '@/platform/components';
import { MoodBeforePick } from './MoodBeforePick';
import type { Exercise, MoodType } from '../../../types/exercises';

interface SessionStartScreenProps {
  exercise: Exercise;
  mood: MoodType | null;
  onMoodChange: (mood: MoodType) => void;
  onStart: (mood: MoodType | null) => void;
}

export function SessionStartScreen({ 
  exercise, 
  mood,
  onMoodChange,
  onStart
}: SessionStartScreenProps) {
  // Icon based on exercise type (square icon not in NavIcon library)
  const iconName = exercise.breathing_pattern.phases[0]?.type === 'breathing' 
    ? 'wind' 
    : 'moon';
  
  // Detect Box Breathing for visual customization
  const isBoxBreathing = exercise.name.toLowerCase().includes('box breathing');
  
  return (
    <div className="session-start">
      {/* Icon - square styling for Box Breathing */}
      <div className={`session-start__icon ${isBoxBreathing ? 'session-start__icon--square' : ''}`}>
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
      
      {/* Button in ContentZone bottom */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => onStart(mood)}
        className="session-start__button"
      >
        Začít cvičení
      </Button>
    </div>
  );
}
