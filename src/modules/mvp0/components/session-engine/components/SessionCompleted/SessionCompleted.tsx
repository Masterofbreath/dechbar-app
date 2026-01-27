/**
 * SessionCompleted - Completion screen wrapper
 * 
 * Survey components for post-session feedback
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { Button } from '@/platform/components';
import { DifficultyCheck } from './DifficultyCheck';
import { MoodSlider } from './MoodSlider';
import { NotesField } from './NotesField';
import type { MoodType } from '../../../../types/exercises';

interface SessionCompletedProps {
  difficultyRating: number | null;
  onDifficultyChange: (rating: number) => void;
  moodAfter: MoodType | null;
  onMoodChange: (mood: MoodType) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SessionCompleted({
  difficultyRating,
  onDifficultyChange,
  moodAfter,
  onMoodChange,
  notes,
  onNotesChange,
  onSave,
  isSaving,
}: SessionCompletedProps) {
  return (
    <div className="session-completed">
      {/* Difficulty rating */}
      <DifficultyCheck 
        value={difficultyRating} 
        onChange={onDifficultyChange} 
      />
      
      {/* Mood slider */}
      <MoodSlider 
        value={moodAfter} 
        onChange={onMoodChange} 
      />
      
      {/* Notes field */}
      <NotesField 
        value={notes} 
        onChange={onNotesChange} 
      />
      
      {/* Save button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={onSave}
        loading={isSaving}
      >
        Uložit & Zavřít
      </Button>
    </div>
  );
}
