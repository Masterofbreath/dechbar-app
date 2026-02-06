/**
 * SmartExerciseButton - AI-Powered Exercise Recommendation
 * 
 * Tier-aware CTA:
 * - FREE/STARTER: Tertiary (dashed border, locked)
 * - SMART/AI_COACH: PRIMARY CTA (gold gradient, unlocked)
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.1.0
 */

import { useState } from 'react';
import { NavIcon } from '@/platform/components';
import { useAuth } from '@/platform/auth';
import { useMembership } from '@/platform/membership';
import { LockedFeatureModal } from './LockedFeatureModal';

export interface SmartExerciseButtonProps {
  /**
   * Click handler (when unlocked)
   */
  onClick?: () => void;
}

/**
 * SmartExerciseButton - Tier-aware SMART feature
 * 
 * @example
 * <SmartExerciseButton onClick={() => navigate('/smart')} />
 */
export function SmartExerciseButton({ onClick }: SmartExerciseButtonProps) {
  const { user } = useAuth();
  const { plan } = useMembership(user?.id);
  const [showModal, setShowModal] = useState(false);
  
  // User has SMART or AI COACH tier - becomes PRIMARY CTA
  const isPremium = plan === 'SMART' || plan === 'AI_COACH';
  const locked = !isPremium;
  
  function handleClick(event: React.MouseEvent) {
    // Prevent scroll jump on mobile/desktop
    event.preventDefault();
    event.stopPropagation();
    
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
        <div className="smart-exercise-button__title">
          {locked && (
            <NavIcon name="lock" size={18} className="smart-exercise-button__lock" />
          )}
          <span>SMART CVIČENÍ</span>
        </div>
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
