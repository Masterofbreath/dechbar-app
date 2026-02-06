/**
 * TierLockModal - TypeScript Type Definitions
 * 
 * iOS-compliant paywall modal for tier-restricted features.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components/TierLockModal
 */

export type TierType = 'SMART' | 'AI_COACH';

/**
 * TierLockModal component props
 */
export interface TierLockModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  
  /** Which tier is required for this feature */
  requiredTier: TierType;
  
  /** Name of the locked feature (displayed as title) */
  featureName: string;
  
  /** Optional custom description (overrides default message) */
  description?: string;
  
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Tier labels (Czech)
 */
export const TIER_LABELS: Record<TierType, string> = {
  SMART: 'SMART',
  AI_COACH: 'AI COACH',
};

/**
 * Default tier messaging
 */
export interface TierLockContent {
  featureName: string;
  description: string;
}
