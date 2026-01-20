/**
 * SessionCompleted - Completion screen wrapper
 * 
 * Gold celebration header + survey components
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { Button } from '@/platform/components';
import { DifficultyCheck } from './DifficultyCheck';
import { MoodSlider } from './MoodSlider';
import { NotesField } from './NotesField';
import type { Exercise, MoodType } from '../../../../types/exercises';

interface SessionCompletedProps {
  exercise: Exercise;
  difficultyRating: number | null;
  onDifficultyChange: (rating: number) => void;
  moodAfter: MoodType | null;
  onMoodChange: (mood: MoodType) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onRepeat: () => void;
  isSaving: boolean;
}

export function SessionCompleted({
  exercise,
  difficultyRating,
  onDifficultyChange,
  moodAfter,
  onMoodChange,
  notes,
  onNotesChange,
  onSave,
  onRepeat,
  isSaving,
}: SessionCompletedProps) {
  return (
    <div className="session-completed">
      {/* Gold celebration header */}
      <div className="completion-header">
        <h2 className="completion-title">Skvělá práce!</h2>
        <p className="completion-subtitle">
          {exercise.name} • {Math.floor(exercise.total_duration_seconds / 60)} minut
        </p>
      </div>
      
      {/* Difficulty rating - text only, no emoji */}
      <DifficultyCheck 
        value={difficultyRating} 
        onChange={onDifficultyChange} 
      />
      
      {/* Mood slider - horizontal gradient */}
      <MoodSlider 
        value={moodAfter} 
        onChange={onMoodChange} 
      />
      
      {/* Notes field - collapsible */}
      <NotesField 
        value={notes} 
        onChange={onNotesChange} 
      />
      
      {/* Action buttons */}
      <div className="session-completed__actions">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onSave}
          loading={isSaving}
        >
          Uložit & Zavřít
        </Button>
        
        {/* Share button ODSTRANĚNO - přidáme později */}
        
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={onRepeat}
        >
          Opakovat cvičení
        </Button>
      </div>
    </div>
  );
}
