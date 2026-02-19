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
 * - Embedded Checkout (NO redirect = dark mode preserved)
 * - Apple Pay / Google Pay support
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState } from 'react';
import { Button } from '@/platform/components';
import { PaymentModal } from '@/platform/payments';
import { supabase } from '@/platform/api/supabase';
import { MESSAGES } from '@/config/messages';

export function DigitalniTichoPricing() {
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  async function handleCheckout() {
    setLoading(true);
    setError('');

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId: import.meta.env.VITE_STRIPE_PRICE_DIGITALNI_TICHO,
            moduleId: 'digitalni-ticho',
            uiMode: 'embedded',
            successUrl: `${window.location.origin}/digitalni-ticho/dekujeme`,
            cancelUrl: `${window.location.origin}/digitalni-ticho`,
          },
        }
      );

      if (invokeError) throw invokeError;

      if (data?.clientSecret) {
        // Embedded checkout — otevři modal
        setClientSecret(data.clientSecret);
        setPaymentOpen(true);
      } else if (data?.url) {
        // Hosted checkout fallback — přesměruj
        window.location.href = data.url;
      } else {
        throw new Error('Stripe session failed — no clientSecret or url returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Něco se pokazilo. Zkus to znovu nebo nás kontaktuj.');
    } finally {
      setLoading(false);
    }
  }

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
            onClick={handleCheckout}
            loading={loading}
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

      {/* Stripe Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setPaymentOpen(false)}
        clientSecret={clientSecret}
        moduleTitle="Digitální ticho"
        price="990 Kč"
        interval="lifetime"
      />
    </section>
  );
}
