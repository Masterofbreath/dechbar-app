/**
 * ExerciseCard - Breathing Exercise Display Card
 * 
 * Displays exercise information with tier-based lock state.
 * Dark-first design with teal/gold accents per Brand Book 2.0.
 * 
 * Features:
 * - Click to start exercise
 * - Edit/Delete buttons for custom exercises
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { NavIcon } from '@/platform/components';
import { useNavigation } from '@/platform/hooks';
import type { Exercise } from '../types/exercises';

// Category benefits mapping (subcategory → benefit label)
const CATEGORY_BENEFITS: Record<string, string> = {
  focus: 'Čistá mysl',      // Box Breathing - mental clarity
  stress: 'Klid',           // Uklidnění - emotional calm
  morning: 'Energie',       // RÁNO
  evening: 'Odpočinek',     // NOC
  energy: 'Aktivace',
  sleep: 'Spánek',
  hrv: 'Kreativita',        // Srdeční koherence - HRV / flow state
};

export interface ExerciseCardProps {
  exercise: Exercise;
  isLocked?: boolean;
  onStart: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onDuplicate?: (exercise: Exercise) => void;
}

/**
 * ExerciseCard - Clickable card for breathing exercises
 * 
 * @example
 * <ExerciseCard
 *   exercise={exerciseData}
 *   onStart={handleStart}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
export function ExerciseCard({
  exercise,
  isLocked = false,
  onStart,
  onEdit,
  onDelete,
  onDuplicate,
}: ExerciseCardProps) {
  const { openDeleteConfirm } = useNavigation();
  const durationMinutes = Math.round(exercise.total_duration_seconds / 60);
  const isCustom = exercise.category === 'custom';
  const benefitLabel = !isCustom && exercise.subcategory
    ? CATEGORY_BENEFITS[exercise.subcategory] ?? null
    : null;
  
  function handleClick() {
    if (isLocked) return;
    onStart(exercise);
  }
  
  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    if (onEdit) onEdit(exercise);
  }
  
  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    
    if (!onDelete) return;
    
    // Open global delete confirmation dialog
    openDeleteConfirm({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      onConfirm: () => onDelete(exercise),
    });
  }
  
  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    if (onDuplicate) onDuplicate(exercise);
  }
  
  return (
    <div className="exercise-card-wrapper">
      <div
        className={`exercise-card ${isLocked ? 'exercise-card--locked' : ''} ${isCustom ? 'exercise-card--custom' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label={`${exercise.name} - ${durationMinutes} minut`}
        style={isCustom && exercise.card_color ? {
          '--custom-color': exercise.card_color,
        } as React.CSSProperties : undefined}
      >
        {/* Content - full width (no icon) */}
      <div className="exercise-card__content">
        {/* Header: title vlevo, benefit badge vpravo */}
        <div className="exercise-card__header">
          <h3 className="exercise-card__title">
            {exercise.name}
            {isLocked && (
              <span className="exercise-card__lock-icon">
                <NavIcon name="lock" size={16} />
              </span>
            )}
          </h3>
          {benefitLabel && (
            <div className="exercise-card__header-badges">
              <span className="badge badge--benefit badge--sm">
                {benefitLabel}
              </span>
            </div>
          )}
        </div>

        {exercise.description && (
          <p className="exercise-card__description">{exercise.description}</p>
        )}
        
        {/* Meta: duration + pattern/phase count */}
        <div className="exercise-card__meta">
          <span 
            className={`badge badge--duration ${!isCustom && onDuplicate ? 'badge--duration-customizable' : ''}`}
            onClick={!isCustom && onDuplicate ? handleDuplicate : undefined}
            role={!isCustom && onDuplicate ? 'button' : undefined}
            title={!isCustom && onDuplicate ? 'Upravit délku cvičení' : undefined}
          >
            <NavIcon name="clock" size={16} />
            {durationMinutes} min
          </span>
          {exercise.phase_count === 1 ? (
            exercise.breathing_pattern.phases[0].pattern && (
              <span className="badge badge--pattern">
                {exercise.breathing_pattern.phases[0].pattern.inhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.hold_after_inhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.exhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.hold_after_exhale_seconds}
              </span>
            )
          ) : (
            <span className="badge badge--phases">
              {exercise.phase_count === 2 || exercise.phase_count === 3 || exercise.phase_count === 4 ? `${exercise.phase_count} fáze` : `${exercise.phase_count} fází`}
            </span>
          )}
        </div>
      </div>
      
      {/* Actions (for custom exercises) */}
      {isCustom && !isLocked && (onEdit || onDelete) && (
        <div className="exercise-card__actions">
          {onEdit && (
            <button
              className="icon-button"
              onClick={handleEdit}
              aria-label="Upravit cvičení"
              type="button"
            >
              <NavIcon name="edit" size={20} />
            </button>
          )}
          
          {onDelete && (
            <button
              className="icon-button icon-button--danger"
              onClick={handleDelete}
              aria-label="Smazat cvičení"
              type="button"
            >
              <NavIcon name="trash" size={20} />
            </button>
          )}
        </div>
      )}
      
      {/* Lock overlay for premium content */}
      {isLocked && (
        <div className="exercise-card__lock-overlay">
          <div className="lock-content">
            <NavIcon name="lock" size={32} />
            <p className="lock-text">Upgraduj na SMART</p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
