/**
 * CvicitPage - Exercise Library
 * 
 * Complete exercise library with:
 * - Tab: Preset exercises (6 protocols: BOX, Calm, Coherence, RÁNO, RESET, NOC)
 * - Tab: Custom exercises (tier-aware: 3 for ZDARMA, unlimited for SMART)
 * - Tab: History (tier-aware: 7 days for ZDARMA, 90 days for SMART)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.2.0
 */

import { useState } from 'react';
import { ExerciseList, SessionEngineModal } from '../components';
import { useNavigation } from '@/platform/hooks';
import type { Exercise } from '../types/exercises';

/**
 * CvicitPage - Exercise library with session engine
 */
export function CvicitPage() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  
  // Use global navigation for Exercise Creator
  const { openExerciseCreator } = useNavigation();
  
  function handleStartExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setIsSessionOpen(true);
  }
  
  function handleCreateCustom() {
    // Open Exercise Creator via global state
    openExerciseCreator();
  }
  
  function handleEditExercise(exercise: Exercise) {
    // Open Exercise Creator in edit mode
    openExerciseCreator({ 
      mode: 'edit', 
      exerciseId: exercise.id 
    });
  }
  
  return (
    <div className="cvicit-page">
      <div className="cvicit-page__header">
        <h1 className="cvicit-page__title">Cvičit</h1>
        <p className="cvicit-page__subtitle">
          Všechna tvoje dechová cvičení na jednom místě
        </p>
      </div>
      
      <ExerciseList
        onStartExercise={handleStartExercise}
        onCreateCustom={handleCreateCustom}
        onEditExercise={handleEditExercise}
      />
      
      {/* Session Engine Modal */}
      {selectedExercise && (
        <SessionEngineModal
          exercise={selectedExercise}
          isOpen={isSessionOpen}
          onClose={() => {
            setIsSessionOpen(false);
            setSelectedExercise(null);
          }}
        />
      )}
      
      {/* Exercise Creator Modal moved to GlobalModals (App.tsx) */}
    </div>
  );
}
