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
import { useAuthStore } from '@/platform/auth';
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
type PresetFilter = 'all' | 'protocols' | 'exercises';

/**
 * ExerciseList - Main exercise library with tabs
 */
export function ExerciseList({
  onStartExercise,
  onCreateCustom,
  onEditExercise,
}: ExerciseListProps) {
  const [activeTab, setActiveTab] = useState<TabType>('presets');
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { plan } = useMembership();
  const { openExerciseCreator } = useNavigation();
  const userCreatedAt = useAuthStore((s) => s.user?.created_at);
  
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
  
  // All presets (protocols + exercises) — filter applied per user selection
  const allPresets = exercises?.filter((ex) => ex.category === 'preset') ?? [];
  const protocolPresets = allPresets.filter((ex) => isProtocol(ex));
  const exercisePresets = allPresets.filter((ex) => !isProtocol(ex));
  const presetExercises =
    presetFilter === 'protocols' ? protocolPresets
    : presetFilter === 'exercises' ? exercisePresets
    : allPresets;
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

  // Zobraz upsell pouze uživatelům registrovaným déle než 7 dní (mají potenciálně skrytá data)
  const hasHiddenHistory =
    plan === 'ZDARMA' &&
    !!userCreatedAt &&
    new Date().getTime() - new Date(userCreatedAt).getTime() > 7 * 24 * 60 * 60 * 1000;
  
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
            {/* Filter: VŠE / PROTOKOLY / CVIČENÍ */}
            <div className="exercise-list__filter" role="group" aria-label="Filtrovat cvičení">
              {([
                { key: 'all',       label: 'Vše' },
                { key: 'protocols', label: 'Protokoly' },
                { key: 'exercises', label: 'Cvičení' },
              ] as { key: PresetFilter; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`exercise-list__filter-btn${presetFilter === key ? ' exercise-list__filter-btn--active' : ''}`}
                  onClick={() => setPresetFilter(key)}
                  aria-pressed={presetFilter === key}
                >
                  {label}
                  {key === 'protocols' && protocolPresets.length > 0 && (
                    <span className="exercise-list__filter-count">{protocolPresets.length}</span>
                  )}
                  {key === 'exercises' && exercisePresets.length > 0 && (
                    <span className="exercise-list__filter-count">{exercisePresets.length}</span>
                  )}
                </button>
              ))}
            </div>
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
                <div className="empty-custom-state__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="40" height="40">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
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
                {hasHiddenHistory && (
                  <> Celá historie se ti zobrazí s tarifem SMART.</>
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
                icon={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="40" height="40">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                }
                title="Žádná historie"
                message="Začni cvičit a tvoje výsledky se zde zobrazí."
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
