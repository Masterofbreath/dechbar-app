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
import { Button, LoadingSkeleton, EmptyState, NavIcon, Tooltip, EnergeticIcon, CalmIcon, TiredIcon, StressedIcon } from '@/platform/components';
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
import { useAudioSessions } from '../api/useAudioSessions';
import type { AudioSessionRow } from '../api/useAudioSessions';
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
type HistoryFilter = 'all' | 'audio' | 'protocols' | 'exercises';

/**
 * Vrátí délku cvičení v minutách (z nastavení cvičení).
 * Zobrazujeme plánovanou délku — skutečná délka se liší o countdown/přípravu.
 */
function getExerciseDurationLabel(exercise?: { total_duration_seconds: number } | null): string {
  if (!exercise?.total_duration_seconds) return '? min';
  const mins = Math.round(exercise.total_duration_seconds / 60);
  return `${mins} min`;
}

/**
 * Vypočítá % dokončení cvičení z timestamp rozdílu vs. total_duration.
 * Používáme jen pro nedokončená cvičení kde was_completed = false.
 * Výsledek je konzervativní odhad (countdown není zahrnut v total_duration).
 */
function getCompletionPercent(session: {
  started_at: string;
  completed_at?: string | null;
  exercise?: { total_duration_seconds: number } | null;
}): number | null {
  if (!session.completed_at || !session.exercise?.total_duration_seconds) return null;
  const diffSeconds = Math.round(
    (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000
  );
  if (diffSeconds <= 0) return null;
  return Math.min(99, Math.round((diffSeconds / session.exercise.total_duration_seconds) * 100));
}

/** Inline AudioSessionCard — teal variant with headphone badge */
function AudioSessionCard({ session }: { session: AudioSessionRow }) {
  const minutes = Math.round((session.unique_listen_seconds ?? 0) / 60);
  const pct = Math.round(Number(session.completion_percent ?? 0));
  const isDone = pct >= 80;

  return (
    <div className="session-card session-card--audio">
      <div className="session-card__header">
        <h4 className="session-card__title">{session.lesson_title ?? 'Audio'}</h4>
        <span className="session-card__date">
          {new Date(session.started_at).toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="session-card__meta">
        <span className="badge">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          {minutes > 0 ? `${minutes} min` : '< 1 min'}
        </span>

        <span className={`badge${isDone ? ' badge--success' : ''}`}>
          {isDone ? 'Dokončeno' : `${pct} % dokončeno`}
        </span>
      </div>
    </div>
  );
}

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
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
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
  const { data: audioSessions, isLoading: audioLoading } = useAudioSessions();
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
                    // Protokoly (RÁNO, KLID, VEČER…) nemají duplicate/edit —
                    // spravují se přes admin panel a DB, ne uživatelsky.
                    onDuplicate={isProtocol(exercise) ? undefined : handleDuplicate}
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

            {/* History filter: Vše / Audio / Protokoly / Cvičení */}
            <div className="exercise-list__filter" role="group" aria-label="Filtrovat historii">
              {(['all', 'audio', 'protocols', 'exercises'] as HistoryFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`exercise-list__filter-btn${historyFilter === f ? ' exercise-list__filter-btn--active' : ''}`}
                  onClick={() => setHistoryFilter(f)}
                >
                  {f === 'all' ? 'Vše' : f === 'audio' ? 'Audio' : f === 'protocols' ? 'Protokoly' : 'Cvičení'}
                </button>
              ))}
            </div>

            {(sessionsLoading || audioLoading) ? (
              <div className="session-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <LoadingSkeleton key={i} variant="card" height="80px" />
                ))}
              </div>
            ) : (
              (() => {
                // Build filtered list
                const exerciseSessions = sessions ?? [];
                const audioList = audioSessions ?? [];

                const filteredExercises = exerciseSessions.filter((session) => {
                  if (historyFilter === 'all') return true;
                  if (historyFilter === 'audio') return false;
                  if (historyFilter === 'protocols') return isProtocol(session.exercise);
                  if (historyFilter === 'exercises') return !isProtocol(session.exercise);
                  return true;
                });

                const filteredAudio = historyFilter === 'all' || historyFilter === 'audio'
                  ? audioList
                  : [];

                const hasAny = filteredExercises.length > 0 || filteredAudio.length > 0;

                if (!hasAny) {
                  return (
                    <EmptyState
                      icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="40" height="40">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      }
                      title="Žádná historie"
                      message="Začni cvičit a tvoje výsledky se zde zobrazí."
                    />
                  );
                }

                // Merge and sort by date descending
                type ExerciseItem = { type: 'exercise'; date: string; session: typeof exerciseSessions[0] };
                type AudioItem = { type: 'audio'; date: string; session: AudioSessionRow };
                type MergedItem = ExerciseItem | AudioItem;

                const merged: MergedItem[] = [
                  ...filteredExercises.map((s) => ({
                    type: 'exercise' as const,
                    date: s.started_at,
                    session: s,
                  })),
                  ...filteredAudio.map((s) => ({
                    type: 'audio' as const,
                    date: s.started_at,
                    session: s,
                  })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return (
                  <div className="session-list">
                    {merged.map((item) => {
                      if (item.type === 'audio') {
                        return (
                          <AudioSessionCard
                            key={`audio-${item.session.session_id}`}
                            session={item.session}
                          />
                        );
                      }

                      const session = item.session;
                      return (
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
                              {getExerciseDurationLabel(session.exercise)}
                            </span>

                            {session.was_completed ? (
                              <span className="badge badge--success">
                                <NavIcon name="check" size={14} />
                                Dokončeno
                              </span>
                            ) : (
                              (() => {
                                const pct = getCompletionPercent(session);
                                return (
                                  <span className="badge badge--abandoned">
                                    {pct !== null ? `${pct} % dokončeno` : 'Nedokončeno'}
                                  </span>
                                );
                              })()
                            )}

                            {/* Difficulty badge */}
                            {session.difficulty_rating && (
                              <span className="badge badge--difficulty">
                                {difficultyLabels[session.difficulty_rating]}
                              </span>
                            )}

                            {/* Custom exercise badge */}
                            {session.exercise?.category === 'custom' && (
                              <span className="badge badge--custom">
                                <NavIcon name="edit" size={12} />
                                Vlastní
                              </span>
                            )}

                            {/* SMART badge for smart session type */}
                            {(session as { session_type?: string }).session_type === 'smart' && (
                              <span className="badge badge--smart">SMART</span>
                            )}

                            {/* Notes badge with Tooltip component */}
                            {session.notes && (
                              <Tooltip content={session.notes} position="top">
                                <span className="badge badge--notes">
                                  <NavIcon name="file-text" size={12} />
                                  Poznámka
                                </span>
                              </Tooltip>
                            )}

                            {/* Pocit po tréninku — vpravo v meta řádku, pevná pozice pod datem */}
                            {session.mood_after && (
                              <span className="session-card__mood-inline">
                                <span className="session-card__mood-label">Pocit po tréninku:</span>
                                {(() => {
                                  const Icon = MoodIconComponent[session.mood_after as MoodType];
                                  return Icon ? <Icon size={11} /> : null;
                                })()}
                                <span>{moodLabels[session.mood_after as MoodType] || session.mood_after}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
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
