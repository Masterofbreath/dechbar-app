/**
 * ExerciseList - Tabbed Exercise Library
 * 
 * Shows exercises in 3 tabs:
 * 1. Presets - Admin-created protocols
 * 2. Custom - User-created exercises (tier-aware)
 * 3. History - Past sessions (tier-aware: 7/90/unlimited days)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState } from 'react';
import { ExerciseCard } from './ExerciseCard';
import { Button, LoadingSkeleton, EmptyState, NavIcon } from '@/platform/components';
import { useMembership } from '@/platform/membership';
import {
  useExercises,
  useCustomExerciseCount,
  useExerciseSessions,
  useDeleteExercise,
} from '../api/exercises';
import type { Exercise } from '../types/exercises';

export interface ExerciseListProps {
  onStartExercise: (exercise: Exercise) => void;
  onCreateCustom: () => void;
  onEditExercise?: (exercise: Exercise) => void;
}

type TabType = 'presets' | 'custom' | 'history';

/**
 * ExerciseList - Main exercise library with tabs
 */
export function ExerciseList({
  onStartExercise,
  onCreateCustom,
  onEditExercise,
}: ExerciseListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const { plan } = useMembership();
  
  const { data: exercises, isLoading: exercisesLoading } = useExercises();
  const { data: customCount } = useCustomExerciseCount();
  const { data: sessions, isLoading: sessionsLoading } = useExerciseSessions();
  const deleteExercise = useDeleteExercise();
  
  // Filter exercises by category
  const presetExercises = exercises?.filter(ex => ex.category === 'preset') || [];
  const customExercises = exercises?.filter(ex => ex.category === 'custom') || [];
  
  // Tier limits
  const customLimits = {
    ZDARMA: 3,
    SMART: 100,
    AI_COACH: 100,
  };
  const maxCustom = customLimits[plan as keyof typeof customLimits] || 3;
  const canCreateMore = (customCount || 0) < maxCustom;
  
  // History tier limits
  const historyDaysLimit = plan === 'ZDARMA' ? 7 : plan === 'SMART' ? 90 : null;
  
  async function handleDelete(exercise: Exercise) {
    if (!confirm(`Opravdu smazat cvičení "${exercise.name}"?`)) return;
    
    try {
      await deleteExercise.mutateAsync(exercise.id);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Nepodařilo se smazat cvičení. Zkus to znovu.');
    }
  }
  
  return (
    <div className="exercise-list">
      {/* Tabs */}
      <div className="exercise-list__tabs" role="tablist">
        <button
          className={`tab ${activeTab === 'presets' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('presets')}
          role="tab"
          aria-selected={activeTab === 'presets'}
          type="button"
        >
          Presety
        </button>
        
        <button
          className={`tab ${activeTab === 'custom' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('custom')}
          role="tab"
          aria-selected={activeTab === 'custom'}
          type="button"
        >
          Vlastní
          {customCount !== undefined && (
            <span className="tab__badge">{customCount}</span>
          )}
        </button>
        
        <button
          className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
          role="tab"
          aria-selected={activeTab === 'history'}
          type="button"
        >
          Historie
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="exercise-list__content">
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="tab-content" role="tabpanel">
            {exercisesLoading ? (
              <div className="exercise-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" height="120px" />
                ))}
              </div>
            ) : presetExercises.length > 0 ? (
              <div className="exercise-grid">
                {presetExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onStart={onStartExercise}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🫁"
                title="Žádné presety"
                message="Preset cvičení budou brzy dostupná."
              />
            )}
          </div>
        )}
        
        {/* CUSTOM TAB */}
        {activeTab === 'custom' && (
          <div className="tab-content" role="tabpanel">
            {/* Tier info banner */}
            <div className="tier-info">
              <p className="tier-info__text">
                {plan === 'ZDARMA' && (
                  <>
                    Máš {customCount}/3 vlastní cvičení.{' '}
                    {!canCreateMore && (
                      <strong>Upgraduj na SMART pro unlimited.</strong>
                    )}
                  </>
                )}
                {plan === 'SMART' && (
                  <>Máš {customCount} vlastních cvičení (unlimited).</>
                )}
                {plan === 'AI_COACH' && (
                  <>Máš {customCount} vlastních cvičení (unlimited + AI optimalizace).</>
                )}
              </p>
            </div>
            
            {exercisesLoading ? (
              <div className="exercise-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" height="120px" />
                ))}
              </div>
            ) : (
              <>
                {customExercises.length > 0 ? (
                  <div className="exercise-grid">
                    {customExercises.map((exercise) => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onStart={onStartExercise}
                        onEdit={onEditExercise}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="✨"
                    title="Žádná vlastní cvičení"
                    message="Vytvoř si vlastní dechové cvičení na míru."
                  />
                )}
                
                {/* Create button */}
                {canCreateMore ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={onCreateCustom}
                    className="exercise-list__create-button"
                  >
                    + Vytvořit nové cvičení
                  </Button>
                ) : (
                  <div className="upgrade-prompt">
                    <p>Dosáhl jsi limit {maxCustom} cvičení</p>
                    <Button variant="primary" size="md">
                      Upgraduj na SMART
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="tab-content" role="tabpanel">
            {/* Tier info */}
            <div className="tier-info">
              <p className="tier-info__text">
                {historyDaysLimit
                  ? `Zobrazuji posledních ${historyDaysLimit} dní.`
                  : 'Zobrazuji celou historii.'}
                {plan === 'ZDARMA' && (
                  <> Upgraduj na SMART pro 90 dní historie.</>
                )}
              </p>
            </div>
            
            {sessionsLoading ? (
              <div className="session-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" height="80px" />
                ))}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="session-list">
                {sessions.map((session: any) => (
                  <div key={session.id} className="session-card">
                    <div className="session-card__header">
                      <h4 className="session-card__title">
                        {session.exercise?.name || 'Smazané cvičení'}
                      </h4>
                      <span className="session-card__date">
                        {new Date(session.started_at).toLocaleDateString('cs-CZ', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    <div className="session-card__meta">
                      <span className="badge">
                        <NavIcon name="clock" size={14} />
                        {session.exercise
                          ? Math.round(session.exercise.total_duration_seconds / 60)
                          : '?'}{' '}
                        min
                      </span>
                      
                      {session.was_completed && (
                        <span className="badge badge--success">
                          <NavIcon name="check" size={14} />
                          Dokončeno
                        </span>
                      )}
                      
                      {session.mood_after && (
                        <span className="badge">
                          {session.mood_after === 'energized' && '⚡'}
                          {session.mood_after === 'calm' && '😌'}
                          {session.mood_after === 'tired' && '😴'}
                          {session.mood_after === 'stressed' && '😰'}
                          {session.mood_after}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="📊"
                title="Žádná historie"
                message="Začni cvičit a tvoje progress se zde zobrazí."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
