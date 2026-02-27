/**
 * SessionCompleted - Completion screen wrapper
 * 
 * Survey components for post-session feedback
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

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
}

export function SessionCompleted({
  difficultyRating,
  onDifficultyChange,
  moodAfter,
  onMoodChange,
  notes,
  onNotesChange,
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
    </div>
  );
}
