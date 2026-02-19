/**
 * DigitalniTichoFinalCTA Component
 * 
 * Final CTA section - poslední push k akci
 * Re-cap headline + subtext + Stripe checkout CTA
 * 
 * Pattern: Následuje ChallengeFinalCTA
 * Opakování CTA v intervalech je standard u dlouhých stránek
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { Button } from '@/platform/components';
import { EmailInputModal } from '@/platform/components/EmailInputModal';
import { PaymentModal } from '@/platform/payments';
import { MESSAGES } from '@/config/messages';
import { useDigitalniTichoCheckout } from './useDigitalniTichoCheckout';

export function DigitalniTichoFinalCTA() {
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

  const { headline, subtext, cta } = MESSAGES.digitalniTicho.finalCTA;

  return (
    <section className="digitalni-ticho-final-cta">
      <div className="digitalni-ticho-final-cta__container">
        <h2 className="digitalni-ticho-final-cta__headline">
          {headline}
        </h2>
        
        <p className="digitalni-ticho-final-cta__subtext">
          {subtext}
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={handleCTAClick}
          className="digitalni-ticho-final-cta__button"
        >
          {cta}
        </Button>
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
    </section>
  );
}
