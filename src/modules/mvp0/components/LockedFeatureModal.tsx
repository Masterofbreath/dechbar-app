/**
 * LockedFeatureModal - Universal Paywall Modal
 * 
 * iOS App Store compliant paywall (Reader App pattern):
 * - No direct payment links
 * - No in-app purchase triggers
 * - Only informs user to visit website
 * 
 * Reusable across all locked features in the app.
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.2.0
 */

import { Card } from '@/platform/components';
import { useScrollLock } from '@/platform/hooks';

export interface LockedFeatureModalProps {
  /**
   * Modal visibility
   */
  isOpen: boolean;
  
  /**
   * Close handler
   */
  onClose: () => void;
  
  /**
   * Name of locked feature
   * @example "SMART CVIČENÍ", "DechBar STUDIO", "Výzvy"
   */
  featureName: string;
  
  /**
   * Required tier to unlock
   */
  tierRequired: 'SMART' | 'AI_COACH' | 'STUDIO' | 'CHALLENGES' | 'AKADEMIE';
}

/**
 * LockedFeatureModal - iOS-compliant paywall
 * 
 * @example
 * <LockedFeatureModal
 *   isOpen={isOpen}
 *   onClose={() => setOpen(false)}
 *   featureName="SMART CVIČENÍ"
 *   tierRequired="SMART"
 * />
 */
export function LockedFeatureModal({
  isOpen,
  onClose,
  featureName,
  tierRequired
}: LockedFeatureModalProps) {
  
  // Lock scroll when modal is open
  useScrollLock(isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-modal-title"
    >
      <Card 
        className="locked-feature-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock Icon */}
        <div className="locked-feature__icon" aria-hidden="true">
          🔒
        </div>
        
        {/* Title */}
        <h2 id="locked-modal-title" className="locked-feature__title">
          {featureName}
        </h2>
        
        {/* Description */}
        <p className="locked-feature__description">
          Tato funkce je dostupná v tarifu <strong>{tierRequired}</strong>.
        </p>
        
        {/* Info */}
        <p className="locked-feature__info">
          Pro odemknutí navštiv naše webové stránky:
        </p>
        
        {/* Website Link (text only, not clickable button - iOS compliance) */}
        <div className="locked-feature__link">
          dechbar.cz/tarify
        </div>
        
        {/* Close Button */}
        <button
          className="locked-feature__close"
          onClick={onClose}
          type="button"
        >
          Zavřít
        </button>
      </Card>
    </div>
  );
}
