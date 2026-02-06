/**
 * TierLockModal - iOS-Compliant Paywall Modal
 * 
 * Global reusable component for showing tier-locked features.
 * Complies with iOS App Store restrictions (no direct payment links).
 * 
 * @package DechBar_App
 * @subpackage MVP0/Components
 * @since 0.2.0
 */

import { useCallback } from 'react';
import type { TierLockModalProps } from './types';

/**
 * TierLockModal - Global paywall modal
 * 
 * CRITICAL: iOS Compliance
 * - NO payment links
 * - NO "Buy now" buttons
 * - ONLY "Visit dechbar.cz" with copy button
 * 
 * @example
 * ```tsx
 * <TierLockModal
 *   isOpen={showPaywall}
 *   requiredTier="SMART"
 *   featureName="Více než 3 vlastní cvičení"
 *   description="Dosáhl jsi limit 3 cvičení na FREE tarifu."
 *   onClose={() => setShowPaywall(false)}
 * />
 * ```
 */
export function TierLockModal({
  isOpen,
  requiredTier,
  featureName,
  description,
  benefits,
  onClose,
}: TierLockModalProps) {
  
  /**
   * Copy dechbar.cz to clipboard (iOS-compliant CTA)
   */
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText('https://dechbar.cz');
      
      // TODO: Show toast notification
      console.log('✅ Link copied to clipboard');
      
      // Track analytics
      if (window.gtag) {
        window.gtag('event', 'tier_lock_link_copied', {
          feature: featureName,
          required_tier: requiredTier,
        });
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [featureName, requiredTier]);
  
  if (!isOpen) return null;
  
  return (
    <div className="tier-lock-modal">
      <div className="tier-lock-modal__overlay" onClick={onClose} />
      
      <div className="tier-lock-modal__container">
        {/* Header */}
        <div className="tier-lock-modal__header">
          <button 
            className="tier-lock-modal__close"
            onClick={onClose}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
        
        {/* Icon */}
        <div className="tier-lock-modal__icon">
          🔒
        </div>
        
        {/* Title */}
        <h2 className="tier-lock-modal__title">
          {featureName}
        </h2>
        
        {/* Tier Badge */}
        <div className="tier-lock-modal__badge">
          {requiredTier === 'SMART' ? 'SMART Tarif' : 'AI COACH Tarif'}
        </div>
        
        {/* Description */}
        {description && (
          <p className="tier-lock-modal__description">
            {description}
          </p>
        )}
        
        {/* Benefits */}
        {benefits && benefits.length > 0 && (
          <ul className="tier-lock-modal__benefits">
            {benefits.map((benefit, index) => (
              <li key={index}>✓ {benefit}</li>
            ))}
          </ul>
        )}
        
        {/* CTA (iOS-compliant) */}
        <div className="tier-lock-modal__cta">
          <p className="tier-lock-modal__cta-text">
            Pro odemčení navštiv:
          </p>
          
          <button
            className="tier-lock-modal__copy-button"
            onClick={handleCopyLink}
          >
            📋 Zkopírovat odkaz dechbar.cz
          </button>
          
          <p className="tier-lock-modal__note">
            Upgraduj svůj tarif na webu a vrať se zpět do appky.
          </p>
        </div>
        
        {/* Secondary Action */}
        <button
          className="tier-lock-modal__cancel"
          onClick={onClose}
        >
          Zrušit
        </button>
      </div>
    </div>
  );
}
