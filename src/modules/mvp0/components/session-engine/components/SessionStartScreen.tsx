import { NavIcon, Button } from '@/platform/components';
import { MoodBeforePick } from './MoodBeforePick';
import type { Exercise, MoodType } from '../../../types/exercises';

interface SessionStartScreenProps {
  exercise: Exercise;
  mood: MoodType | null;
  onMoodChange: (mood: MoodType) => void;
  onStart: (mood: MoodType | null) => void;
}

// Default preset icon for all preset exercises (unified wind symbol)
const DEFAULT_PRESET_ICON = 'wind';

export function SessionStartScreen({ 
  exercise, 
  mood,
  onMoodChange,
  onStart
}: SessionStartScreenProps) {
  // Ultra simplified: custom = edit, all presets = wind
  const iconName = exercise.category === 'custom' ? 'edit' : DEFAULT_PRESET_ICON;
  
  return (
    <div className="session-start">
      {/* Icon - Apple Premium Style (teal icon, no background) */}
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
