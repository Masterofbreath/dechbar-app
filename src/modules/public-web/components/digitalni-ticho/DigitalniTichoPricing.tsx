/**
 * DigitalniTichoPricing Component
 * 
 * V3 - Čistá cena (bez fake srovnání)
 * Důraz na DOŽIVOTNÍ + OFFLINE (klíčové benefity)
 * 
 * Pricing Strategy:
 * - Oficiální cena: 990 Kč (NO fake anchoring)
 * - Per day: 47 Kč/den (price framing)
 * - Garance: 7denní vrácení peněz (realistic)
 * 
 * Stripe Integration:
 * - Email-first flow → Embedded Checkout (NO redirect = dark mode preserved)
 * - Apple Pay / Google Pay support
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { Button } from '@/platform/components';
import { EmailInputModal } from '@/platform/components/EmailInputModal';
import { PaymentModal } from '@/platform/payments';
import { MESSAGES } from '@/config/messages';
import { useDigitalniTichoCheckout } from './useDigitalniTichoCheckout';

export function DigitalniTichoPricing() {
  const {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    setPaymentOpen,
    clientSecret,
    loadingEmail,
    error,
    handleCTAClick,
    handleEmailSubmit,
  } = useDigitalniTichoCheckout();

  const { 
    price,
    perDay,
    coffeeNote,
    title, 
    subtitle, 
    badge,
    featuresTitle,
    features,
    cta,
    stats
  } = MESSAGES.digitalniTicho.pricing;

  return (
    <section id="pricing" className="digitalni-ticho-pricing">
      <div className="digitalni-ticho-pricing__container">
        <div className="digitalni-ticho-pricing__card">
          {/* Badge */}
          <div className="digitalni-ticho-pricing__badge">
            {badge}
          </div>

          {/* Title */}
          <h2 className="digitalni-ticho-pricing__title">
            {title}
          </h2>
          
          <p className="digitalni-ticho-pricing__subtitle">
            {subtitle}
          </p>

          {/* Simple Price (NO fake stacking) */}
          <div className="digitalni-ticho-pricing__price-wrapper">
            <span className="digitalni-ticho-pricing__price">
              {price}
            </span>
          </div>
          
          <p className="digitalni-ticho-pricing__per-day">
            = {perDay} {coffeeNote}
          </p>

          {/* Features */}
          <h3 className="digitalni-ticho-pricing__features-title">
            {featuresTitle}
          </h3>
          
          <ul className="digitalni-ticho-pricing__features">
            {features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          {/* CTA Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleCTAClick}
          >
            {cta}
          </Button>

          {/* Value Stats - pod CTA */}
          <div className="digitalni-ticho-pricing__stats">
            {stats.map((stat, index) => (
              <div key={index} className="digitalni-ticho-pricing__stat">
                <span className="digitalni-ticho-pricing__stat-value">{stat.value}</span>
                <span className="digitalni-ticho-pricing__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="digitalni-ticho-pricing__error">
              {error}
            </div>
          )}
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
    </section>
  );
}
