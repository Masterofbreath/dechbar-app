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

import { useState } from 'react';
import { Button } from '@/platform/components';
import { PaymentModal } from '@/platform/payments';
import { supabase } from '@/platform/api/supabase';
import { MESSAGES } from '@/config/messages';

export function DigitalniTichoFinalCTA() {
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { headline, subtext, cta } = MESSAGES.digitalniTicho.finalCTA;

  async function handleCheckout() {
    setLoading(true);

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
        setClientSecret(data.clientSecret);
        setPaymentOpen(true);
      } else if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  }

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
          onClick={handleCheckout}
          loading={loading}
          className="digitalni-ticho-final-cta__button"
        >
          {cta}
        </Button>
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
