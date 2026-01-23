/**
 * DemoCvicitView - Demo "Cvičit" Exercise Library
 * 
 * Displays exercises with tabs using REAL components:
 * - Doporučené: ExerciseCard grid (real component)
 * - Vlastní: EmptyState + Button (real components)
 * - Historie: Session cards with badges (real structure)
 * 
 * Design: 100% reuses real app components + CSS (zero custom styles)
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { useState } from 'react';
import { ExerciseCard } from '@/modules/mvp0/components/ExerciseCard';
import { EmptyState, Button, NavIcon, CalmIcon, EnergeticIcon } from '@/platform/components';
import { DEMO_CVICIT_EXERCISES, DEMO_HISTORY_SESSIONS } from '../data/demoExercises';
import type { Exercise } from '@/shared/exercises/types';

export interface DemoCvicitViewProps {
  onExerciseClick: (exercise: Exercise) => void;
}

type CvicitTab = 'doporucene' | 'vlastni' | 'historie';

/**
 * DemoCvicitView - Exercise library with tabs for demo
 * 
 * @example
 * <DemoCvicitView onExerciseClick={handleClick} />
 */
export function DemoCvicitView({ onExerciseClick }: DemoCvicitViewProps) {
  const [activeTab, setActiveTab] = useState<CvicitTab>('doporucene');
  
  // Mood icon mapping (matches real app)
  const moodIconMap = {
    calm: CalmIcon,
    energized: EnergeticIcon,
  };
  
  return (
    <div className="cvicit-page">
      {/* Header */}
      <div className="cvicit-page__header">
        <h1 className="cvicit-page__title">Cvičit</h1>
        <p className="cvicit-page__subtitle">
          Všechna tvoje dechová cvičení na jednom místě
        </p>
      </div>
      
      {/* Exercise List Container (wraps tabs + content) */}
      <div className="exercise-list">
        {/* Tabs Navigation - REAL STRUCTURE */}
        <div className="exercise-list__tabs" role="tablist">
          <button 
            className={`tab ${activeTab === 'doporucene' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('doporucene')}
            role="tab"
            aria-selected={activeTab === 'doporucene'}
            type="button"
          >
            Doporučené
          </button>
          
          <button 
            className={`tab ${activeTab === 'vlastni' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('vlastni')}
            role="tab"
            aria-selected={activeTab === 'vlastni'}
            type="button"
          >
            Vlastní <span className="tab__badge">0</span>
          </button>
          
          <button 
            className={`tab ${activeTab === 'historie' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('historie')}
            role="tab"
            aria-selected={activeTab === 'historie'}
            type="button"
          >
            Historie
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="exercise-list__content">
          {/* DOPORUČENÉ TAB - Real ExerciseCard grid */}
          {activeTab === 'doporucene' && (
            <div className="tab-content" role="tabpanel">
              <div className="exercise-grid">
                {DEMO_CVICIT_EXERCISES.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise as Exercise}
                    onStart={() => onExerciseClick(exercise)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* VLASTNÍ TAB - Real EmptyState + Button */}
          {activeTab === 'vlastni' && (
            <div className="tab-content" role="tabpanel">
              {/* Tier info banner (real styling) */}
              <div className="tier-info">
                <p className="tier-info__text">
                  💡 Vlastní cvičení můžeš vytvářet po registraci. 
                  Máš <strong>0/3</strong> vlastní cvičení.
                </p>
              </div>
              
              {/* Empty state (real component - NO emoji icon) */}
              <EmptyState
                icon=""
                title="Zatím tu není ani dech"
                message="Vytvoř si první vlastní cvičení po registraci!"
              />
              
              {/* Create button (real component, disabled - NO emoji) */}
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => {
                  alert('Vlastní cvičení si můžeš vytvořit po registraci. Začni dnes.');
                }}
                disabled
                className="exercise-list__create-button"
              >
                + Vytvořit nové cvičení
              </Button>
            </div>
          )}
          
          {/* HISTORIE TAB - Real session cards */}
          {activeTab === 'historie' && (
            <div className="tab-content" role="tabpanel">
              {/* Tier info banner */}
              <div className="tier-info">
                <p className="tier-info__text">
                  💡 Tvoje cvičení se automaticky ukládají po registraci. Uvidíš zde pokrok.
                </p>
              </div>
              
              {/* Session list (real structure) */}
              <div className="session-list">
                {DEMO_HISTORY_SESSIONS.map((session) => {
                  const MoodIcon = moodIconMap[session.mood_after];
                  
                  return (
                    <div key={session.id} className="session-card">
                      <div className="session-card__header">
                        <h4 className="session-card__title">
                          {session.exercise_name}
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
                        {/* Duration badge */}
                        <span className="badge">
                          <NavIcon name="clock" size={14} />
                          {session.duration_min} min
                        </span>
                        
                        {/* Completion badge */}
                        {session.was_completed && (
                          <span className="badge badge--success">
                            <NavIcon name="check" size={14} />
                            Dokončeno
                          </span>
                        )}
                        
                        {/* Mood badge */}
                        {session.mood_after && MoodIcon && (
                          <span className="badge badge--mood">
                            <MoodIcon size={14} />
                            {session.mood_label}
                          </span>
                        )}
                        
                        {/* Notes badge - NEW! (visual only with easter egg tooltip) */}
                        {session.notes && (
                          <span 
                            className="badge badge--notes"
                            title="💎 Easter egg pro zvědavé! Poznámky ti pomůžou sledovat pokrok a pocity po cvičení."
                          >
                            <NavIcon name="file-text" size={12} />
                            Poznámka
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
