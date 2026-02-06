/**
 * ExerciseCard - Breathing Exercise Display Card
 * 
 * Displays exercise information with tier-based lock state.
 * Dark-first design with teal/gold accents per Brand Book 2.0.
 * 
 * Features:
 * - Swipe gestures on mobile (swipe left = delete, swipe right = edit)
 * - Click to start exercise
 * - Edit/Delete buttons for custom exercises
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState, useRef, useEffect } from 'react';
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
};

// Exercise-specific benefit overrides (priority over category)
const EXERCISE_SPECIFIC_BENEFITS: Record<string, string> = {
  'Srdeční koherence': 'Kreativita',  // HRV exercise - creativity/flow
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
    ? (EXERCISE_SPECIFIC_BENEFITS[exercise.name] || CATEGORY_BENEFITS[exercise.subcategory])
    : null;
  
  // Swipe gesture state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<'edit' | 'delete' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isSwiping = useRef(false);
  
  // Swipe thresholds
  const SWIPE_THRESHOLD = 80; // pixels to trigger action
  const MAX_SWIPE = 120; // max swipe distance
  
  // Detect if mobile device
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  function handleClick() {
    if (isLocked || swipeOffset !== 0) return;
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
  
  // Touch handlers for swipe gestures (mobile only, custom exercises only)
  function handleTouchStart(e: React.TouchEvent) {
    if (!isMobile || !isCustom || isLocked) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }
  
  function handleTouchMove(e: React.TouchEvent) {
    if (!isMobile || !isCustom || isLocked) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = touchY - touchStartY.current;
    
    // Determine if horizontal swipe (prevent vertical scroll interference)
    if (!isSwiping.current && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
      e.preventDefault(); // Prevent scroll
    }
    
    if (isSwiping.current) {
      // Clamp swipe offset
      const clampedOffset = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, deltaX));
      setSwipeOffset(clampedOffset);
      
      // Determine action based on direction
      if (clampedOffset < -SWIPE_THRESHOLD && onDelete) {
        setSwipeAction('delete');
      } else if (clampedOffset > SWIPE_THRESHOLD && onEdit) {
        setSwipeAction('edit');
      } else {
        setSwipeAction(null);
      }
    }
  }
  
  function handleTouchEnd() {
    if (!isMobile || !isCustom || isLocked) return;
    
    if (isSwiping.current) {
      // Trigger action if threshold reached
      if (swipeAction === 'delete' && onDelete) {
        openDeleteConfirm({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          onConfirm: () => onDelete(exercise),
        });
      } else if (swipeAction === 'edit' && onEdit) {
        onEdit(exercise);
      }
      
      // Reset swipe state
      setSwipeOffset(0);
      setSwipeAction(null);
      isSwiping.current = false;
    }
  }
  
  return (
    <div className="exercise-card-wrapper">
      {/* Swipe action indicators (FIXED background - revealed during swipe) */}
      {isMobile && isCustom && (
        <>
          {/* Edit indicator (left side, revealed when swiping RIGHT) */}
          <div className={`exercise-card__swipe-bg exercise-card__swipe-bg--edit ${swipeAction === 'edit' ? 'exercise-card__swipe-bg--active' : ''}`}>
            <NavIcon name="edit" size={24} />
          </div>
          
          {/* Delete indicator (right side, revealed when swiping LEFT) */}
          <div className={`exercise-card__swipe-bg exercise-card__swipe-bg--delete ${swipeAction === 'delete' ? 'exercise-card__swipe-bg--active' : ''}`}>
            <NavIcon name="trash" size={24} />
          </div>
        </>
      )}
      
      {/* Main card (moves on top of background) */}
      <div
        ref={cardRef}
        className={`exercise-card ${isLocked ? 'exercise-card--locked' : ''} ${isCustom ? 'exercise-card--custom' : ''}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-label={`${exercise.name} - ${durationMinutes} minut`}
        style={{
          ...(isCustom && exercise.card_color ? {
            '--custom-color': exercise.card_color,
          } : {}),
          transform: isMobile && isCustom ? `translateX(${swipeOffset}px)` : undefined,
          transition: 'transform 0.3s ease',
        } as React.CSSProperties}
      >
        {/* Content - full width (no icon) */}
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
        
        {/* Metadata badges - duration + pattern/phases + benefit (preset only) */}
        <div className="exercise-card__meta">
          {/* 1. Duration (always first) - with customize icon for presets */}
          <span 
            className={`badge badge--duration ${!isCustom && onDuplicate ? 'badge--duration-customizable' : ''}`}
            onClick={!isCustom && onDuplicate ? handleDuplicate : undefined}
            role={!isCustom && onDuplicate ? 'button' : undefined}
            title={!isCustom && onDuplicate ? 'Upravit délku cvičení' : undefined}
          >
            <NavIcon name="clock" size={16} />
            {durationMinutes} min
            {!isCustom && onDuplicate && (
              <NavIcon name="settings" size={14} className="badge__customize-icon" />
            )}
          </span>
          
          {/* 2. Pattern/Phase count (always for all exercises) */}
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
          
          {/* 3. Benefit badge (only for preset exercises, last) */}
          {benefitLabel && (
            <span className="badge badge--benefit">
              <NavIcon name="heart" size={16} />
              {benefitLabel}
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
