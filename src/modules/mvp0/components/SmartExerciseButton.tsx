/**
 * SmartExerciseButton - AI-Powered Exercise Recommendation
 * 
 * Tier-gated feature:
 * - FREE: Locked (shows paywall modal)
 * - SMART/AI_COACH: Unlocked (shows recommendation)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { useState } from 'react';
import { LockedFeatureModal } from './LockedFeatureModal';

export interface SmartExerciseButtonProps {
  /**
   * Is feature locked for current user?
   */
  locked: boolean;
  
  /**
   * Click handler (when unlocked)
   */
  onClick?: () => void;
}

/**
 * SmartExerciseButton - SMART tier feature button
 * 
 * @example
 * const { plan } = useMembership();
 * const locked = plan === 'ZDARMA';
 * <SmartExerciseButton locked={locked} />
 */
export function SmartExerciseButton({ locked, onClick }: SmartExerciseButtonProps) {
  const [showModal, setShowModal] = useState(false);
  
  function handleClick() {
    if (locked) {
      setShowModal(true);
    } else {
      onClick?.();
    }
  }
  
  return (
    <>
      <button 
        className="smart-exercise-button"
        onClick={handleClick}
        type="button"
      >
        <div className="smart-exercise-button__header">
          <span className="smart-exercise-button__badge">
            SMART CVIČENÍ
          </span>
          {locked && (
            <svg 
              className="smart-exercise-button__lock" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )}
        </div>
        
        <p className="smart-exercise-button__text">
          {locked 
            ? "Personalizované doporučení na základě tvého pokroku"
            : "Tvoje dnešní doporučení: RESET (5 min)"
          }
        </p>
        
        {locked && (
          <p className="smart-exercise-button__cta">
            Odemkni v SMART tarifu →
          </p>
        )}
      </button>
      
      {locked && (
        <LockedFeatureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          featureName="SMART CVIČENÍ"
          tierRequired="SMART"
        />
      )}
    </>
  );
}
