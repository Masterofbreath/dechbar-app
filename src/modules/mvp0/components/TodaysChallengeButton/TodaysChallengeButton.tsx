/**
 * TodaysChallengeButton - Daily Challenge CTA
 * 
 * Displays challenge progress button for active challenge participants.
 * 
 * Visibility rules:
 * - Always visible for admin/CEO roles
 * - Visible for users with active challenge (1.3. - 21.3.2026)
 * - Hidden for users without active challenge
 * 
 * Design: Apple Premium style with gold→teal gradient, glassmorphism
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.3.0
 */

import { useActiveChallenge } from '../../hooks/useActiveChallenge';
import { NavIcon } from '@/platform/components';
import './TodaysChallengeButton.css';

export interface TodaysChallengeButtonProps {
  /**
   * Click handler - called with current day number
   */
  onClick?: (currentDay: number) => void;
  
  /**
   * Optional CSS class override
   */
  className?: string;
}

/**
 * TodaysChallengeButton - Challenge progress CTA
 * 
 * @example
 * <TodaysChallengeButton 
 *   onClick={(day) => console.log('Starting day', day)} 
 * />
 */
export function TodaysChallengeButton({ 
  onClick, 
  className 
}: TodaysChallengeButtonProps) {
  const { 
    isVisible, 
    isActive,
    currentDay, 
    completedDays,
    isLoading, 
    error 
  } = useActiveChallenge();
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`todays-challenge-button todays-challenge-button--loading ${className || ''}`}>
        <div className="todays-challenge-button__skeleton">
          <div className="todays-challenge-button__skeleton-title" />
          <div className="todays-challenge-button__skeleton-subtitle" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={`todays-challenge-button todays-challenge-button--error ${className || ''}`}>
        <p className="todays-challenge-button__error-text">
          {error}
        </p>
      </div>
    );
  }
  
  // Challenge not active (before 1.3. or after 21.3.)
  if (!isActive && currentDay === 0) {
    return (
      <div className={`todays-challenge-button todays-challenge-button--inactive ${className || ''}`}>
        <div className="todays-challenge-button__icon">
          <NavIcon name="calendar" size={24} />
        </div>
        <div className="todays-challenge-button__content">
          <h3 className="todays-challenge-button__title">
            Březnová výzva
          </h3>
          <p className="todays-challenge-button__subtitle">
            Začíná 1. března 2026
          </p>
        </div>
      </div>
    );
  }
  
  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(currentDay);
  }
  
  return (
    <button
      className={`todays-challenge-button todays-challenge-button--active ${className || ''}`}
      onClick={handleClick}
      type="button"
    >
      <div className="todays-challenge-button__icon">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="todays-challenge-button__flame"
        >
          <path 
            d="M12 2C9.5 4.5 8 7 8 10C8 13.31 10.69 16 14 16C14.35 16 14.69 15.97 15.03 15.92C14.43 17.2 13.16 18 12 18C9.79 18 8 16.21 8 14C8 13.45 8.09 12.92 8.26 12.42C7.5 13.5 7 14.7 7 16C7 19.31 9.69 22 13 22C16.31 22 19 19.31 19 16C19 12 16.5 9 14.5 6.5C13.5 8 13 9.5 13 11C13 11.55 13.45 12 14 12C14.55 12 15 11.55 15 11C15 9.89 15.89 9 17 9C17 6.5 14.5 4.5 12 2Z" 
            fill="currentColor"
          />
        </svg>
      </div>
      
      <div className="todays-challenge-button__content">
        <h3 className="todays-challenge-button__title">
          DNEŠNÍ DÝCHAČKA
        </h3>
        <p className="todays-challenge-button__subtitle">
          Den {currentDay} z 21 · {completedDays}/21 dokončeno
        </p>
      </div>
      
      <div className="todays-challenge-button__cta">
        <NavIcon name="play" size={20} />
        <span>Začít</span>
      </div>
    </button>
  );
}
