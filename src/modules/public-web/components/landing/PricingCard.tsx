/**
 * PricingCard Component
 * 
 * Individual pricing plan card with features, badges, and Stripe checkout integration.
 * Design: Premium glassmorphism with teal/gold accents per Visual Brand Book.
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { Button, EmailInputModal } from '@/platform';
import { useEmbeddedCheckout, PaymentModal } from '@/platform/payments';
import { useAuth } from '@/platform/auth/useAuth';
import type { BillingInterval } from './BillingToggle';

export interface PricingCardProps {
  moduleId: 'smart' | 'ai-coach' | 'free';
  priceId?: string;  // Stripe Price ID (undefined for free tier)
  billingInterval: BillingInterval;
  title: string;
  subtitle?: string;
  price: string;
  period?: string;
  priceAnnual?: string;
  badge?: string;
  savingsBadge?: string;
  features: string[];
  ctaText: string;
  ctaVariant: 'primary' | 'ghost';
  highlighted?: boolean;
  isDisabled?: boolean;
  onFreeTierCTA?: () => void;  // For free tier (auth modal)
}

export function PricingCard({
  moduleId,
  priceId,
  billingInterval,
  title,
  subtitle,
  price,
  period,
  priceAnnual,
  badge,
  savingsBadge,
  features,
  ctaText,
  ctaVariant,
  highlighted = false,
  isDisabled = false,
  onFreeTierCTA,
}: PricingCardProps) {
  const { user } = useAuth();
  const { 
    openPaymentModal, 
    closePaymentModal, 
    clientSecret, 
    isModalOpen,
    isLoading,
    error 
  } = useEmbeddedCheckout();
  const [localLoading, setLocalLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleCTA = async () => {
    // Free tier: Open auth modal
    if (moduleId === 'free' && onFreeTierCTA) {
      onFreeTierCTA();
      return;
    }

    // Paid tiers: Check price ID
    if (!priceId) {
      console.error('No priceId provided for paid tier');
      return;
    }

    // Authenticated user: Open payment modal directly
    if (user) {
      setLocalLoading(true);
      try {
        await openPaymentModal(
          priceId, 
          billingInterval, 
          moduleId,
          title,  // Module title for modal
          price   // Display price for modal
        );
      } catch (err) {
        console.error('Payment modal failed:', err);
      } finally {
        setLocalLoading(false);
      }
    } else {
      // Guest: Show email modal first
      setIsEmailModalOpen(true);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    setLocalLoading(true);
    try {
      await openPaymentModal(
        priceId!, 
        billingInterval, 
        moduleId,
        title,
        price,
        email  // Guest email
      );
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error('Payment modal failed:', err);
      throw err;  // Re-throw for modal error handling
    } finally {
      setLocalLoading(false);
    }
  };

  const isButtonLoading = isLoading || localLoading;

  return (
    <>
      <div className={`pricing-card ${highlighted ? 'pricing-card--highlighted' : ''}`}>
      {/* Badge (if exists) */}
      {badge && (
        <div className={`pricing-card__badge ${highlighted ? 'pricing-card__badge--gold' : 'pricing-card__badge--teal'}`}>
          {badge}
        </div>
      )}

      {/* Title */}
      <h3 className="pricing-card__title">{title}</h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="pricing-card__subtitle">{subtitle}</p>
      )}

      {/* Price */}
      <div className="pricing-card__price">
        {priceAnnual ? (
          <>
            <span className="pricing-card__price-annual">{priceAnnual}</span>
            <span className="pricing-card__price-note">(roční předplatné)</span>
            <span className="pricing-card__price-monthly">nebo {price}/{period}</span>
          </>
        ) : (
          <>
            <span className="pricing-card__price-amount">{price}</span>
            {period && (
              <span className="pricing-card__price-period">/{period}</span>
            )}
          </>
        )}
      </div>

      {/* Savings badge (if exists) */}
      {savingsBadge && (
        <div className="pricing-card__savings">
          {savingsBadge}
        </div>
      )}

      {/* Features list */}
      <ul className="pricing-card__features">
        {features.map((feature, index) => (
          <li key={index} className="pricing-card__feature">
            <svg 
              className="pricing-card__feature-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <path 
                d="M5 13l4 4L19 7" 
                stroke="var(--color-primary)"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        variant={ctaVariant}
        size="lg"
        fullWidth
        onClick={handleCTA}
        disabled={isDisabled || isButtonLoading}
        className="pricing-card__cta"
      >
        {isButtonLoading ? 'Načítání...' : ctaText}
      </Button>

      {/* Error message */}
      {error && (
        <p className="pricing-card__error" role="alert">
          {error.message || 'Něco se pokazilo. Zkus to prosím znovu.'}
        </p>
      )}
    </div>

    {/* Email Modal for Guest Checkout */}
    <EmailInputModal
      isOpen={isEmailModalOpen}
      onClose={() => setIsEmailModalOpen(false)}
      onSubmit={handleEmailSubmit}
      isLoading={isButtonLoading}
    />

    {/* Payment Modal (Embedded Checkout) */}
    <PaymentModal
      isOpen={isModalOpen}
      onClose={closePaymentModal}
      clientSecret={clientSecret}
    />
    </>
  );
}
