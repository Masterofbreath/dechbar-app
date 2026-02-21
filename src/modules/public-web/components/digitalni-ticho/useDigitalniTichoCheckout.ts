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
  const [thankYouOpen, setThankYouOpen] = useState(false);
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
    setEmailModalOpen(false); // Zavři email modal PŘED otevřením Stripe — předchází probliknutí
    try {
      await createSession(email);
    } catch {
      // Při chybě: zavři payment modal (který createSession otevřel) a vrať email modal
      setPaymentOpen(false);
      setClientSecret(null);
      setEmailModalOpen(true);
    } finally {
      setLoadingEmail(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Správné zavření payment modalu — resetuje clientSecret aby EmbeddedCheckoutProvider
  // se plně odmontoval a příští otevření začalo čistě bez staré Stripe session
  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    setClientSecret(null);
  }, []);

  // Platba proběhla úspěšně → zavři Stripe modal, otevři poděkování
  const handlePaymentComplete = useCallback(() => {
    setPaymentOpen(false);
    setClientSecret(null);
    setThankYouOpen(true);
  }, []);

  async function createSession(email: string) {
    // Otevři modal IHNED → uživatel vidí loading spinner okamžitě
    // clientSecret je ještě null → PaymentModal renderuje loading stav
    // React 18 batching by jinak sloučil setPaymentOpen + setClientSecret do jednoho renderu
    // a loading stav by nikdy nebyl vidět
    setPaymentOpen(true);

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
      setClientSecret(data.clientSecret);  // paymentOpen je již true → přepne loading → formulář
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
        event_type: 'contact_add',
        payload: {
          list_name: 'UNREG',
          contact: {
            email,
            custom_fields: {
              CHECKOUT_SOURCE: 'landing_page',
            },
          },
          tags: ['CHECKOUT_STARTED', 'digitalni-ticho'],
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
    clientSecret,
    thankYouOpen,
    setThankYouOpen,
    loadingEmail,
    error,
    handleCTAClick,
    handleEmailSubmit,
    handlePaymentClose,
    handlePaymentComplete,
  };
}
