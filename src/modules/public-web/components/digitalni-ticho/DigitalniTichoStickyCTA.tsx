/**
 * DigitalniTichoStickyCTA Component
 *
 * Plovoucí CTA lišta - zobrazí se po 180px scrollu
 * Řeší problém: na mobilu je CTA daleko dole
 * Respektuje prefers-reduced-motion
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useEffect } from 'react';
import { Button } from '@/platform/components';
import { EmailInputModal } from '@/platform/components/EmailInputModal';
import { PaymentModal } from '@/platform/payments';
import { MESSAGES } from '@/config/messages';
import { DigitalniTichoCountdown } from './DigitalniTichoCountdown';
import { useDigitalniTichoCheckout } from './useDigitalniTichoCheckout';

const STICKY_SCROLL_THRESHOLD = 180;

export function DigitalniTichoStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);

  const {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    setPaymentOpen,
    clientSecret,
    loadingEmail,
    handleCTAClick,
    handleEmailSubmit,
  } = useDigitalniTichoCheckout();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function handleScroll() {
      setIsVisible(window.scrollY >= STICKY_SCROLL_THRESHOLD);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div className="digitalni-ticho-sticky-cta">
        <div className="digitalni-ticho-sticky-cta__container">
          <span className="digitalni-ticho-sticky-cta__label">
            <DigitalniTichoCountdown />
          </span>
          <Button
            variant="primary"
            size="md"
            onClick={handleCTAClick}
            className="digitalni-ticho-sticky-cta__button"
          >
            {MESSAGES.digitalniTicho.pricing.cta}
          </Button>
        </div>
      </div>

      {/* Krok 1: Email modal pro guest */}
      <EmailInputModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
        isLoading={loadingEmail}
      />

      {/* Krok 2: Stripe Embedded Checkout */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        clientSecret={clientSecret}
      />
    </>
  );
}
