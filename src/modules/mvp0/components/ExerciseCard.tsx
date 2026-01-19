/**
 * ExerciseCard - Breathing Exercise Display Card
 * 
 * Displays exercise information with tier-based lock state.
 * Dark-first design with teal/gold accents per Brand Book 2.0.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { NavIcon } from '@/platform/components';
import type { Exercise } from '../types/exercises';

export interface ExerciseCardProps {
  exercise: Exercise;
  isLocked?: boolean;
  onStart: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
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
}: ExerciseCardProps) {
  const durationMinutes = Math.round(exercise.total_duration_seconds / 60);
  const isCustom = exercise.category === 'custom';
  
  // Icon mapping for subcategories
  const subcategoryIcons: Record<string, string> = {
    morning: 'sun',
    evening: 'moon',
    stress: 'refresh',
    sleep: 'moon',
    focus: 'target',
    energy: 'zap',
  };
  
  const icon = exercise.subcategory
    ? subcategoryIcons[exercise.subcategory]
    : 'circle';
  
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
    if (onDelete) onDelete(exercise);
  }
  
  return (
    <div
      className={`exercise-card ${isLocked ? 'exercise-card--locked' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${exercise.name} - ${durationMinutes} minut`}
    >
      {/* Icon */}
      <div className="exercise-card__icon">
        <NavIcon name={icon as any} size={32} />
      </div>
      
      {/* Content */}
      <div className="exercise-card__content">
        <h3 className="exercise-card__title">
          {exercise.name}
          {isLocked && (
            <span className="exercise-card__lock-icon">
              <NavIcon name="lock" size={16} />
            </span>
          )}
        </h3>
        
        {exercise.description && (
          <p className="exercise-card__description">{exercise.description}</p>
        )}
        
        {/* Metadata badges */}
        <div className="exercise-card__meta">
          <span className="badge badge--duration">
            <NavIcon name="clock" size={16} />
            {durationMinutes} min
          </span>
          
          {exercise.phase_count > 1 && (
            <span className="badge badge--phases">
              {exercise.phase_count} fází
            </span>
          )}
          
          {exercise.difficulty && (
            <span className={`badge badge--difficulty badge--${exercise.difficulty}`}>
              {exercise.difficulty === 'beginner' && 'Začátečník'}
              {exercise.difficulty === 'intermediate' && 'Pokročilý'}
              {exercise.difficulty === 'advanced' && 'Expert'}
            </span>
          )}
        </div>
        
        {/* Tags */}
        {exercise.tags.length > 0 && (
          <div className="exercise-card__tags">
            {exercise.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
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
  );
}
