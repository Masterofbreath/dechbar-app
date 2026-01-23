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
import { useScrollLock, useSwipeToDismiss } from '@/platform/hooks';

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
  
  // Swipe to dismiss
  const { handlers, style } = useSwipeToDismiss({ 
    onDismiss: onClose,
    enabled: isOpen
  });
  
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
        {...handlers}
        style={style}
      >
        {/* Lock Icon */}
        <div className="locked-feature__icon" aria-hidden="true">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
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
          dechbar.cz
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
