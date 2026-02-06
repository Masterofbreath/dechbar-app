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
import { LockedFeatureModal } from './LockedFeatureModal';
import { Button, LoadingSkeleton, EmptyState, NavIcon, EnergeticIcon, CalmIcon, TiredIcon, StressedIcon } from '@/platform/components';
import { useMembership } from '@/platform/membership';
import { useNavigation } from '@/platform/hooks';
import { isProtocol } from '@/utils/exerciseHelpers';
import type { MoodType } from '../types/exercises';
import {
  useExercises,
  useCustomExerciseCount,
  useExerciseSessions,
  useDeleteExercise,
} from '../api/exercises';
import type { Exercise } from '../types/exercises';

// Difficulty labels
const difficultyLabels: Record<number, string> = {
  3: 'Snadné',
  2: 'Tak akorát',
  1: 'Náročné',
};

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
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan } = useMembership();
  const { openExerciseCreator } = useNavigation();
  
  // Mood labels Czech mapping
  const moodLabels: Record<MoodType, string> = {
    energized: 'Energický',
    calm: 'Klidný',
    tired: 'Unavený',
    stressed: 'Stresovaný',
    neutral: 'Neutrální',
  };
  
  // Mood icons mapping
  const MoodIconComponent: Record<MoodType, typeof EnergeticIcon> = {
    energized: EnergeticIcon,
    calm: CalmIcon,
    tired: TiredIcon,
    stressed: StressedIcon,
    neutral: CalmIcon, // Default to calm for neutral
  };
  
  const { data: exercises, isLoading: exercisesLoading } = useExercises();
  const { data: customCount } = useCustomExerciseCount();
  const { data: sessions, isLoading: sessionsLoading } = useExerciseSessions();
  const deleteExercise = useDeleteExercise();
  
  // Filter exercises by category
  // Note: Protocols (RÁNO, KLID, VEČER) are shown only on Dnes view (quick access)
  // Cvičit shows exercises (Box Breathing, Uklidnění, Srdeční koherence + future additions)
  const presetExercises = exercises?.filter(ex => 
    ex.category === 'preset' && 
    !isProtocol(ex) // Hide all protocols (RÁNO, KLID, VEČER)
  ) || [];
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
    // Confirmation už proběhla v custom modal (openDeleteConfirm)
    // Browser confirm() dialog zde způsoboval duplicate dialog
    
    try {
      await deleteExercise.mutateAsync(exercise.id);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Nepodařilo se smazat cvičení. Zkus to znovu.');
    }
  }
  
  function handleDuplicate(exercise: Exercise) {
    // Open Exercise Creator in duplicate mode
    openExerciseCreator({ 
      mode: 'duplicate', 
      exerciseId: exercise.id,
      sourceExercise: exercise,
    });
  }
  
  return (
    <div className="exercise-list">
      {/* Tabs */}
      <div className="exercise-list__tabs" role="tablist">
        <button
          className={`tab ${activeTab === 'presets' ? 'tab--active' : ''}`}
          onClick={(e) => {
            setActiveTab('presets');
            e.currentTarget.blur(); // Force remove :active state on mobile
          }}
          role="tab"
          aria-selected={activeTab === 'presets'}
          type="button"
        >
          Doporučené
        </button>
        
        <button
          className={`tab ${activeTab === 'custom' ? 'tab--active' : ''}`}
          onClick={(e) => {
            setActiveTab('custom');
            e.currentTarget.blur();
          }}
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
          onClick={(e) => {
            setActiveTab('history');
            e.currentTarget.blur(); // Force remove :active state on mobile
          }}
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
                    onDuplicate={handleDuplicate}
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
            {/* Tier info banner - POUZE pro FREE uživatele */}
            {plan === 'ZDARMA' && (
              <div className="tier-info">
                <p className="tier-info__text">
                  Máš {customCount}/3 cvičení.{' '}
                  {!canCreateMore && (
                    <strong>Upgraduj na SMART pro neomezený počet.</strong>
                  )}
                </p>
              </div>
            )}
            
            {/* Exercise Grid OR Empty State */}
            {exercisesLoading ? (
              <div className="exercise-grid">
                {Array.from({ length: 3 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" height="120px" />
                ))}
              </div>
            ) : customExercises.length > 0 ? (
              <>
                {/* Exercise Grid */}
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
                  
                  {/* Upgrade card as last grid item (when limit reached) */}
                  {!canCreateMore && (
                    <div 
                      className="exercise-card exercise-card--upgrade"
                      onClick={() => setShowUpgradeModal(true)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="exercise-card__upgrade-icon-wrapper">
                        <NavIcon name="lock" size={32} />
                      </div>
                      <div className="exercise-card__upgrade-text">
                        <h3 className="exercise-card__upgrade-title">
                          Upgraduj na SMART
                        </h3>
                        <p className="exercise-card__upgrade-subtitle">
                          Neomezený počet cvičení
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Create button POD gridem (only if can create more) */}
                {canCreateMore && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onCreateCustom}
                    className="exercise-list__create-button exercise-list__create-button--below-grid"
                  >
                    + Vytvořit cvičení
                  </Button>
                )}
              </>
            ) : (
              /* Empty state when no custom exercises */
              <div className="empty-custom-state">
                <div className="empty-custom-state__icon">✨</div>
                <h3 className="empty-custom-state__title">
                  Vytvoř si vlastní cvičení
                </h3>
                <p className="empty-custom-state__description">
                  Nastav si dechové fáze přesně podle sebe.
                  {plan === 'ZDARMA' && ' Máš 3 sloty zdarma.'}
                </p>
                {canCreateMore && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={onCreateCustom}
                  >
                    + Vytvořit první cvičení
                  </Button>
                )}
              </div>
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
                {sessions.map((session) => (
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
                        <span className="badge badge--mood">
                          {(() => {
                            const Icon = MoodIconComponent[session.mood_after as MoodType];
                            return Icon ? <Icon size={14} /> : null;
                          })()}
                          {moodLabels[session.mood_after as MoodType] || session.mood_after}
                        </span>
                      )}
                      
                      {/* NEW: Difficulty badge */}
                      {session.difficulty_rating && (
                        <span className="badge badge--difficulty">
                          {difficultyLabels[session.difficulty_rating]}
                        </span>
                      )}
                      
                      {/* NEW: Custom exercise badge - označení vlastních cvičení */}
                      {session.exercise?.category === 'custom' && (
                        <span className="badge badge--custom">
                          <NavIcon name="edit" size={12} />
                          Vlastní
                        </span>
                      )}
                      
                      {/* NEW: Notes badge (clickable with tooltip) */}
                      {session.notes && (
                        <button
                          className="badge badge--notes"
                          onClick={() => setSelectedNoteId(
                            selectedNoteId === session.id ? null : session.id
                          )}
                          title="Zobrazit poznámku"
                        >
                          <NavIcon name="file-text" size={12} />
                          Poznámka
                        </button>
                      )}
                    </div>
                    
                    {/* Tooltip for notes */}
                    {selectedNoteId === session.id && session.notes && (
                      <div className="note-tooltip">
                        <p>{session.notes}</p>
                        <button 
                          className="note-tooltip__close"
                          onClick={() => setSelectedNoteId(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
      
      {/* Upgrade Modal */}
      <LockedFeatureModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="NEOMEZENÝ POČET"
        tierRequired="SMART"
      />
    </div>
  );
}
