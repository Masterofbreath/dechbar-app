/**
 * useDigitalniTichoCheckout Hook
 *
 * Sdílená logika email-first checkout flow pro Digitální ticho.
 *
 * Flow:
 * 1. Uživatel klikne na CTA → otevře se EmailInputModal
 * 2. Zadá email → email uložen do Supabase (checkout_started event)
 * 3. Vytvoří se Stripe session s předvyplněným emailem
 * 4. Otevře se PaymentModal se Stripe Embedded Checkout
 *
 * Pokud je uživatel přihlášený, krok 1-2 přeskočíme.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/platform/api/supabase';

export function useDigitalniTichoCheckout() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState('');

  // Klik na CTA — pokud je přihlášen, přeskočí email modal
  const handleCTAClick = useCallback(async () => {
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // Přihlášený uživatel → rovnou checkout
      await createSession(user.email);
    } else {
      // Host → zobraz email modal
      setEmailModalOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Uživatel potvrdil email v modalu
  const handleEmailSubmit = useCallback(async (email: string) => {
    setLoadingEmail(true);
    setError('');
    try {
      await createSession(email);
      setEmailModalOpen(false);
    } finally {
      setLoadingEmail(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function createSession(email: string) {
    // Zachyť email pro remarketing (checkout_started event)
    await captureEmail(email);

    const { data, error: invokeError } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          priceId: import.meta.env.VITE_STRIPE_PRICE_DIGITALNI_TICHO,
          moduleId: 'digitalni-ticho',
          uiMode: 'embedded',
          email,
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
    } else {
      throw new Error('Stripe session failed — no clientSecret or url returned');
    }
  }

  async function captureEmail(email: string) {
    try {
      await supabase.from('ecomail_sync_queue').insert({
        user_id: null,
        email,
        event_type: 'checkout_started',
        payload: {
          module_id: 'digitalni-ticho',
          price_czk: 990,
          source: 'landing_page',
        },
        status: 'pending',
      });
    } catch {
      // Neblokuj checkout při selhání zachytávání
    }
  }

  return {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    setPaymentOpen,
    clientSecret,
    loadingEmail,
    error,
    handleCTAClick,
    handleEmailSubmit,
  };
}
