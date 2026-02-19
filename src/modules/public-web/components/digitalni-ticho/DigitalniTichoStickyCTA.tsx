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
import { PaymentModal } from '@/platform/payments';
import { supabase } from '@/platform/api/supabase';
import { MESSAGES } from '@/config/messages';
import { DigitalniTichoCountdown } from './DigitalniTichoCountdown';

const STICKY_SCROLL_THRESHOLD = 180;

export function DigitalniTichoStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Respektuj prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function handleScroll() {
      setIsVisible(window.scrollY >= STICKY_SCROLL_THRESHOLD);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleCheckout() {
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            priceId: import.meta.env.VITE_STRIPE_PRICE_DIGITALNI_TICHO || 'price_digitalni_ticho_990',
            moduleId: 'digitalni-ticho',
            successUrl: `${window.location.origin}/digitalni-ticho/dekujeme`,
            cancelUrl: `${window.location.origin}/digitalni-ticho`,
          },
        }
      );

      if (invokeError) throw invokeError;

      if (data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentOpen(true);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  }

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
            onClick={handleCheckout}
            loading={loading}
            className="digitalni-ticho-sticky-cta__button"
          >
            {MESSAGES.digitalniTicho.pricing.cta}
          </Button>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setPaymentOpen(false)}
        clientSecret={clientSecret}
        moduleTitle="Digitální ticho"
        price="990 Kč"
        interval="lifetime"
      />
    </>
  );
}
