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
import type { TabType } from '../components/ExerciseList';
import { useNavigation } from '@/platform/hooks';
import { useCustomExerciseCount } from '../api/exercises';
import type { Exercise } from '../types/exercises';

/**
 * CvicitPage - Exercise library with session engine
 */
export function CvicitPage() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('presets');

  const { openExerciseCreator } = useNavigation();
  const { data: customCount } = useCustomExerciseCount();
  
  function handleStartExercise(exercise: Exercise) {
    setSelectedExercise(exercise);
    setIsSessionOpen(true);
  }
  
  function handleCreateCustom() {
    openExerciseCreator();
  }
  
  function handleEditExercise(exercise: Exercise) {
    openExerciseCreator({ 
      mode: 'edit', 
      exerciseId: exercise.id 
    });
  }
  
  return (
    <div className="cvicit-page">
      {/* Page header */}
      <div className="cvicit-page__header">
        <h1 className="cvicit-page__title">Cvičit</h1>
      </div>

      {/* Tab bar — mimo content, jako samostatný prvek (stejný pattern jako PokrokPage) */}
      <div className="exercise-list__tabs" role="tablist">
        <button
          className={`tab ${activeTab === 'presets' ? 'tab--active' : ''}`}
          onClick={(e) => { setActiveTab('presets'); e.currentTarget.blur(); }}
          role="tab"
          aria-selected={activeTab === 'presets'}
          type="button"
        >
          Doporučené
        </button>
        <button
          className={`tab ${activeTab === 'custom' ? 'tab--active' : ''}`}
          onClick={(e) => { setActiveTab('custom'); e.currentTarget.blur(); }}
          role="tab"
          aria-selected={activeTab === 'custom'}
          type="button"
        >
          Vlastní
          {customCount !== undefined && customCount > 0 && (
            <span className="tab__badge">{customCount}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
          onClick={(e) => { setActiveTab('history'); e.currentTarget.blur(); }}
          role="tab"
          aria-selected={activeTab === 'history'}
          type="button"
        >
          Historie
        </button>
      </div>

      {/* Content — tabs jsou controlled, ExerciseList tabs bar se nezobrazuje */}
      <div className="cvicit-page__content">
        <ExerciseList
          onStartExercise={handleStartExercise}
          onCreateCustom={handleCreateCustom}
          onEditExercise={handleEditExercise}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
      
      {/* Session Engine Modal
          skipFlow=false pro všechna cvičení včetně protokolů → zobrazí start screen s
          "Jak se teď cítíš?" před startem (sběr dat o náladě).
          Protokoly na view Dnes mají skipFlow=true (přímý start, 1 klik). */}
      {selectedExercise && (
        <SessionEngineModal
          exercise={selectedExercise}
          isOpen={isSessionOpen}
          skipFlow={false}
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
