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
import { useNavigation } from '@/platform/hooks';
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
  const { openDeleteConfirm } = useNavigation();
  const durationMinutes = Math.round(exercise.total_duration_seconds / 60);
  const isCustom = exercise.category === 'custom';
  
  // Filter out difficulty tags (they're already shown in badge)
  const difficultyTags = ['začátečník', 'mírně-pokročilý', 'pokročilý', 'expert'];
  const displayTags = exercise.tags.filter(tag => !difficultyTags.includes(tag));
  
  // Exercise-specific icon overrides (priority over subcategory)
  const exerciseSpecificIcons: Record<string, string> = {
    'Box Breathing': 'square',
    'Uklidnění': 'meditation',
    'Srdeční koherence': 'heart',
    'KLID': 'wind',
  };
  
  // Icon mapping for subcategories (fallback)
  const subcategoryIcons: Record<string, string> = {
    morning: 'sun',
    evening: 'moon',
    stress: 'refresh',
    sleep: 'moon',
    focus: 'target',
    energy: 'zap',
  };
  
  // Use specific icon if defined, otherwise fall back to subcategory
  const icon = exerciseSpecificIcons[exercise.name] 
    || (exercise.subcategory ? subcategoryIcons[exercise.subcategory] : 'circle');
  
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
  
  return (
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
      {/* Icon - only for non-custom exercises (premium "less is more" design) */}
      {!isCustom && (
        <div className="exercise-card__icon">
          <NavIcon name={icon as any} size={32} />
        </div>
      )}
      
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
          
          {exercise.phase_count === 1 ? (
            // Show breathing pattern for simple exercises
            exercise.breathing_pattern.phases[0].pattern && (
              <span className="badge badge--pattern">
                {exercise.breathing_pattern.phases[0].pattern.inhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.hold_after_inhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.exhale_seconds}|
                {exercise.breathing_pattern.phases[0].pattern.hold_after_exhale_seconds}
              </span>
            )
          ) : (
            // Show phase count for multi-phase exercises
            <span className="badge badge--phases">
              {exercise.phase_count === 2 || exercise.phase_count === 3 || exercise.phase_count === 4 ? `${exercise.phase_count} fáze` : `${exercise.phase_count} fází`}
            </span>
          )}
          
          {!isCustom && exercise.difficulty && (
            <span className={`badge badge--difficulty badge--${exercise.difficulty}`}>
              {exercise.difficulty === 'beginner' && 'Začátečník'}
              {exercise.difficulty === 'intermediate' && 'Pokročilý'}
              {exercise.difficulty === 'advanced' && 'Expert'}
            </span>
          )}
        </div>
        
        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="exercise-card__tags">
            {displayTags.slice(0, 3).map((tag) => (
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
