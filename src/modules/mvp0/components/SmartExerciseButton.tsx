/**
 * SmartExerciseButton - AI-Powered Exercise Recommendation
 * 
 * Tier-aware CTA:
 * - FREE/STARTER: Tertiary (dashed border, locked)
 * - SMART/AI_COACH: PRIMARY CTA (gold gradient, unlocked)
 * 
 * On click (unlocked): computes BIE recommendation and calls onSmartStart
 * with the resulting SmartSessionConfig + ephemeral Exercise.
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
import { useSmartExercise } from '../hooks/useSmartExercise';
import type { SmartSessionConfig } from '../types/exercises';
import type { Exercise } from '../types/exercises';

export interface SmartExerciseButtonProps {
  /** Called when SMART session is computed and ready to start */
  onSmartStart?: (config: SmartSessionConfig, exercise: Exercise) => void;
}

/**
 * SmartExerciseButton - Tier-aware SMART feature
 * 
 * @example
 * <SmartExerciseButton onSmartStart={(config, exercise) => openModal(config, exercise)} />
 */
export function SmartExerciseButton({ onSmartStart }: SmartExerciseButtonProps) {
  const { user } = useAuth();
  const { plan } = useMembership(user?.id);
  const [showModal, setShowModal] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  const { computeAndBuild, isLoading: isDataLoading } = useSmartExercise();
  
  // User has SMART or AI COACH tier - becomes PRIMARY CTA
  const isPremium = plan === 'SMART' || plan === 'AI_COACH';
  const locked = !isPremium;
  const isBusy = isComputing || isDataLoading;
  
  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (locked) {
      setShowModal(true);
      return;
    }

    if (isComputing) return;

    setIsComputing(true);
    setComputeError(null);
    try {
      const { config, exercise } = await computeAndBuild();
      onSmartStart?.(config, exercise);
    } catch {
      setComputeError('Nepodařilo se načíst doporučení, zkouším znovu...');
    } finally {
      setIsComputing(false);
    }
  }
  
  return (
    <>
      <button
        className={`smart-exercise-button${isBusy ? ' smart-exercise-button--loading' : ''}`}
        onClick={handleClick}
        type="button"
        disabled={isBusy}
        aria-busy={isBusy}
      >
        <div className="smart-exercise-button__title">
          {locked && (
            <NavIcon name="lock" size={18} className="smart-exercise-button__lock" />
          )}
          {isDataLoading ? (
            <span>Načítám...</span>
          ) : isComputing ? (
            <span>Připravuji cvičení...</span>
          ) : (
            <span>SMART CVIČENÍ</span>
          )}
        </div>
      </button>

      {computeError && (
        <p className="smart-exercise-button__error" role="alert">
          {computeError}
        </p>
      )}
      
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
