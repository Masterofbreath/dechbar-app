/**
 * useLandingPricingCheckout Hook
 *
 * Sdílená logika email-first checkout flow pro pricing sekci na landing page.
 * Jeden stav pro celou sekci — zaručuje 1× EmbeddedCheckoutProvider (Stripe constraint).
 *
 * Flow:
 * 1. Uživatel klikne CTA na SMART kartě → openCheckout({ priceId, moduleId, title, price, billingInterval })
 * 2. Přihlášený → okamžitě otevře PaymentModal (spinner) + volá edge function
 * 3. Host → otevře EmailInputModal → po zadání emailu → PaymentModal (spinner)
 * 4. Edge function vrátí clientSecret → spinner přepne na Stripe formulář
 * 5. Platba proběhne → handlePaymentComplete():
 *    - Přihlášený: zavře modal, čeká na Supabase real-time update membership (max 5s),
 *      pak naviguje na /app bez tvrdého refreshe stránky
 *    - Host: modal s poděkováním (email s potvrzením + magic link už odeslán webhookem)
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Landing
 */

import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';
import { useUserState } from '@/platform/user/userStateStore';
import type { BillingInterval } from './BillingToggle';

export interface CheckoutTarget {
  priceId: string;
  moduleId: string;
  title: string;
  price: string;
  billingInterval: BillingInterval;
}

export function useLandingPricingCheckout() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const refreshMembership = useUserState((s) => s.refreshMembership);
  const refreshModules = useUserState((s) => s.refreshModules);

  const pendingTarget = useRef<CheckoutTarget | null>(null);
  /** Platbu zahájil host (bez přihlášení) → po dokončení zobrazíme poděkování, ne redirect */
  const isGuestCheckoutRef = useRef(false);

  const openCheckout = useCallback(async (target: CheckoutTarget) => {
    setError('');
    pendingTarget.current = target;

    const { data: { user } } = await supabase.auth.getUser();
    isGuestCheckoutRef.current = !user;
    if (user?.email) {
      await createSession(user.email, target);
    } else {
      setEmailModalOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmailSubmit = useCallback(async (email: string) => {
    const target = pendingTarget.current;
    if (!target) return;

    setLoadingEmail(true);
    setError('');
    setEmailModalOpen(false);
    try {
      await createSession(email, target);
    } catch {
      setPaymentOpen(false);
      setClientSecret(null);
      setEmailModalOpen(true);
    } finally {
      setLoadingEmail(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaymentClose = useCallback(() => {
    setPaymentOpen(false);
    setClientSecret(null);
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    setPaymentOpen(false);
    setClientSecret(null);
    if (isGuestCheckoutRef.current) {
      setThankYouModalOpen(true);
    } else {
      // Okamžitě refresh membership + modules z DB — nezávisíme jen na Supabase real-time timing.
      // Real-time listener to stejně zachytí, ale manuální refresh zaručí okamžitou změnu UI.
      await Promise.all([refreshMembership(), refreshModules()]);
      navigate('/app');
    }
   
  }, [refreshMembership, refreshModules, navigate]);

  const closeThankYouModal = useCallback(() => {
    setThankYouModalOpen(false);
  }, []);

  async function createSession(email: string, target: CheckoutTarget) {
    // Okamžitě otevři modal → uživatel vidí loading spinner
    // (React 18 batching by jinak sloučil setPaymentOpen + setClientSecret do jednoho renderu)
    setPaymentOpen(true);

    await captureEmailBefore(email, target.billingInterval);

    const { data, error: invokeError } = await supabase.functions.invoke(
      'create-checkout-session',
      {
        body: {
          priceId: target.priceId,
          moduleId: target.moduleId,
          uiMode: 'embedded',
          email,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/?cancelled=true`,
        },
      }
    );

    if (invokeError) throw invokeError;

    if (data?.clientSecret) {
      setClientSecret(data.clientSecret);
    } else if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Stripe session failed — no clientSecret or url returned');
    }
  }

  /**
   * Zachytí email do UNREG Ecomail listu před otevřením Stripe.
   * Edge function to dělá taky, ale tato client-side verze nastane dřív
   * (ještě před API voláním) → lepší abandoned cart coverage.
   */
  async function captureEmailBefore(email: string, interval: BillingInterval) {
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
              CHECKOUT_SOURCE: 'landing_page_pricing',
              BILLING_INTERVAL: interval,
              CHECKOUT_STARTED_AT: new Date().toISOString(),
            },
          },
          tags: [
            'CHECKOUT_STARTED',
            'SMART_SUBSCRIPTION',
            `INTERVAL_${interval.toUpperCase()}`,
            'ABANDONED_CART_CANDIDATE',
          ],
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
    loadingEmail,
    error,
    thankYouModalOpen,
    closeThankYouModal,
    openCheckout,
    handleEmailSubmit,
    handlePaymentClose,
    handlePaymentComplete,
  };
}
