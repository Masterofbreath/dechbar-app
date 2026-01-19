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
import type { Exercise } from '../types/exercises';

/**
 * CvicitPage - Exercise library with session engine
 */
export function CvicitPage() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  
  function handleStartExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setIsSessionOpen(true);
  }
  
  function handleCreateCustom() {
    setIsCreatorOpen(true);
  }
  
  function handleEditExercise(exercise: Exercise) {
    // TODO: Open exercise editor (MVP2)
    console.log('Edit exercise:', exercise.id);
    alert('Editace cvičení bude dostupná brzy.');
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
      
      {/* Exercise Creator Modal (TODO: MVP2) */}
      {isCreatorOpen && (
        <div className="modal-overlay" onClick={() => setIsCreatorOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Vytvořit nové cvičení</h2>
            <p>Exercise Creator Wizard bude dostupný v MVP2.</p>
            <button onClick={() => setIsCreatorOpen(false)}>Zavřít</button>
          </div>
        </div>
      )}
    </div>
  );
}
