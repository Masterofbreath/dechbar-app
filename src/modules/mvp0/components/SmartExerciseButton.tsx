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
import { useUserState } from '@/platform/user/userStateStore';
import { LockedFeatureModal } from './LockedFeatureModal';
import { useSmartExercise } from '../hooks/useSmartExercise';
import { unlockSharedAudioContext } from '../utils/sharedAudioContext';
import type { SmartSessionConfig } from '../types/exercises';
import type { Exercise } from '../types/exercises';

export interface SmartExerciseButtonProps {
  /** Called when SMART session is computed and ready to start */
  onSmartStart?: (config: SmartSessionConfig, exercise: Exercise) => void;
  /** Called synchronously on click (before async compute) — use to open modal immediately
   *  and unlock Web Audio API within the gesture call stack (Safari autoplay policy). */
  onEarlyOpen?: () => void;
}

/**
 * SmartExerciseButton - Tier-aware SMART feature
 * 
 * @example
 * <SmartExerciseButton onSmartStart={(config, exercise) => openModal(config, exercise)} />
 */
export function SmartExerciseButton({ onSmartStart, onEarlyOpen }: SmartExerciseButtonProps) {
  const { user } = useAuth();
  const { plan } = useMembership(user?.id);
  const { isAdmin } = useUserState();
  const [showModal, setShowModal] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);
  const { computeAndBuild, isLoading: isDataLoading } = useSmartExercise();
  
  // ADMIN/CEO bypass — always unlocked for internal testing
  const isPremium = plan === 'SMART' || plan === 'AI_COACH' || isAdmin;
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

    // 1. Unlock Web Audio API synchronously BEFORE any await.
    //    Safari loses the gesture token after the first await.
    unlockSharedAudioContext();

    // 2. Call onEarlyOpen synchronously — parent can open the modal immediately
    //    so unlockAudio() inside SessionEngineModal also runs within the gesture stack.
    onEarlyOpen?.();

    setIsComputing(true);
    setComputeError(null);
    try {
      // Minimální delay 2s pro "Vypočítáváme…" — vytváří vnímanou hodnotu výpočtu
      const [result] = await Promise.all([
        computeAndBuild(),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
      onSmartStart?.(result.config, result.exercise);
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
            <span>Vypočítáváme…</span>
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
