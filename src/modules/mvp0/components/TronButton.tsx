/**
 * TronButton - Cesta na Trůn CTA
 *
 * Tier-aware + safety-aware button for walking breath-hold training.
 *
 * Access conditions (all must be true):
 * 1. Membership: SMART or AI_COACH (or admin)
 * 2. KP >= 20s (safety gate — hypercapnic training)
 * 3. Safety flags: pregnancy === false AND cardiovascular === false
 *
 * Lock states:
 * - 'tier'        → shows LockedFeatureModal (upsell)
 * - 'kp_missing'  → user has not measured KP yet
 * - 'kp_low'      → KP < 20s (not ready yet)
 * - 'safety'      → pregnancy or cardiovascular flag set
 * - null          → unlocked, ready to start
 *
 * @package DechBar_App
 * @subpackage MVP0/Components
 */

import { useState } from 'react';
import { NavIcon } from '@/platform/components';
import { useAuth } from '@/platform/auth';
import { useMembership } from '@/platform/membership';
import { useUserState } from '@/platform/user/userStateStore';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { useSafetyFlags } from '../api/exercises';
import { LockedFeatureModal } from './LockedFeatureModal';
import { unlockSharedAudioContext } from '../utils/sharedAudioContext';
import { TRON_MIN_KP } from '../config/tronLevels';
import { useTronSession, buildTronExercise } from '../hooks/useTronSession';
import type { TronSessionConfig } from '../types/exercises';
import type { Exercise } from '../types/exercises';

export interface TronButtonProps {
  /** Called synchronously on click — unlock AudioContext in gesture stack */
  onEarlyOpen?: () => void;
  /** Called after session config is ready — passes config + ephemeral Exercise */
  onTronStart?: (config: TronSessionConfig, exercise: Exercise) => void;
}

type LockReason = 'tier' | 'kp_missing' | 'kp_low' | 'safety' | null;

export function TronButton({ onEarlyOpen, onTronStart }: TronButtonProps) {
  const { user } = useAuth();
  const { plan } = useMembership(user?.id);
  const { isAdmin } = useUserState();
  const { currentKP, isLoading: kpLoading } = useKPMeasurements();
  const safetyFlags = useSafetyFlags();
  const { config: tronConfig } = useTronSession();

  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showSafetyToast, setShowSafetyToast] = useState(false);

  // --- Determine lock reason ---
  const isPremium = plan === 'SMART' || plan === 'AI_COACH' || isAdmin;
  const flags = safetyFlags.data;
  const hasSafetyConcern = flags?.pregnancy === true || flags?.cardiovascular === true;

  const lockReason: LockReason = (() => {
    if (!isPremium) return 'tier';
    if (hasSafetyConcern) return 'safety';
    if (!kpLoading && currentKP === null) return 'kp_missing';
    if (!kpLoading && currentKP !== null && currentKP < TRON_MIN_KP) return 'kp_low';
    return null;
  })();

  const isLocked = lockReason !== null;

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (lockReason === 'tier') {
      setShowLockedModal(true);
      return;
    }

    if (lockReason === 'safety') {
      setShowSafetyToast(true);
      setTimeout(() => setShowSafetyToast(false), 4000);
      return;
    }

    if (lockReason === 'kp_missing' || lockReason === 'kp_low') {
      setShowSafetyToast(true);
      setTimeout(() => setShowSafetyToast(false), 4000);
      return;
    }

    // Unlocked — build exercise and start session
    unlockSharedAudioContext();
    onEarlyOpen?.();
    const exercise = buildTronExercise(tronConfig);
    onTronStart?.(tronConfig, exercise);
  }

  function getLockMessage(): string {
    switch (lockReason) {
      case 'kp_missing':
        return 'Nejprve si změř svou KP v sekci Pokrok';
      case 'kp_low':
        return `Tvoje KP je ${currentKP}s. Pro Trůn potřebuješ min. ${TRON_MIN_KP}s`;
      case 'safety':
        return 'Tento nástroj není vhodný s ohledem na tvé zdravotní podmínky';
      default:
        return '';
    }
  }

  return (
    <>
      <button
        className={`tron-button${isLocked ? ' tron-button--locked' : ''}${kpLoading ? ' tron-button--loading' : ''}`}
        onClick={handleClick}
        type="button"
        disabled={kpLoading}
        aria-busy={kpLoading}
      >
        <div className="tron-button__title">
          {isLocked && (
            <NavIcon name="lock" size={16} className="tron-button__lock" />
          )}
          <span>CESTA NA TRŮN</span>
        </div>
      </button>

      {/* Safety / KP toast */}
      {showSafetyToast && lockReason !== 'tier' && (
        <p className="tron-button__toast" role="alert">
          {getLockMessage()}
        </p>
      )}

      {/* Tier upsell modal */}
      {lockReason === 'tier' && (
        <LockedFeatureModal
          isOpen={showLockedModal}
          onClose={() => setShowLockedModal(false)}
          featureName="CESTA NA TRŮN"
          tierRequired="SMART"
        />
      )}
    </>
  );
}
