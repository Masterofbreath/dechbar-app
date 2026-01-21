/**
 * useEmbeddedCheckout Hook
 * 
 * React hook for managing Stripe Embedded Checkout flow
 * Creates checkout session, opens payment modal, handles success/cancel
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

import { useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth/useAuth';
import type {
  BillingInterval,
  EmbeddedCheckoutSessionResponse,
  EmbeddedCheckoutSessionRequest,
  CheckoutError,
} from './types';
import { CHECKOUT_ERRORS } from './constants';

interface UseEmbeddedCheckoutReturn {
  openPaymentModal: (
    priceId: string,
    interval: BillingInterval,
    moduleId: string,
    moduleTitle: string,
    price: string,
    email?: string
  ) => Promise<void>;
  closePaymentModal: () => void;
  clientSecret: string | null;
  isModalOpen: boolean;
  moduleTitle: string;
  price: string;
  interval: BillingInterval;
  error: CheckoutError | null;
  isLoading: boolean;
}

/**
 * useEmbeddedCheckout Hook
 * 
 * Handles Embedded Checkout flow - creates session with clientSecret,
 * opens payment modal with Stripe Embedded Checkout
 * 
 * @example
 * ```tsx
 * const { openPaymentModal, closePaymentModal, isModalOpen, clientSecret } = useEmbeddedCheckout();
 * 
 * const handleClick = async () => {
 *   await openPaymentModal(
 *     'price_1Sra65K7en1dcW6HC63iM7bf',
 *     'monthly',
 *     'membership-smart',
 *     'SMART Membership',
 *     '249 Kč'
 *   );
 * };
 * 
 * <PaymentModal
 *   isOpen={isModalOpen}
 *   onClose={closePaymentModal}
 *   clientSecret={clientSecret}
 *   moduleTitle={moduleTitle}
 *   price={price}
 *   interval={interval}
 * />
 * ```
 */
export function useEmbeddedCheckout(): UseEmbeddedCheckoutReturn {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [price, setPrice] = useState('');
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [error, setError] = useState<CheckoutError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openPaymentModal = async (
    priceId: string,
    billingInterval: BillingInterval,
    moduleId: string,
    title: string,
    priceDisplay: string,
    email?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Guest checkout: email required if not authenticated
      if (!user && !email) {
        throw new Error('Email je povinný pro nákup bez přihlášení');
      }

      if (!priceId) {
        throw new Error(CHECKOUT_ERRORS.MISSING_PRICE_ID);
      }

      console.log('🛒 Creating embedded checkout session:', {
        priceId,
        interval: billingInterval,
        moduleId,
        userId: user?.id || 'guest',
        email: email || user?.email,
      });

      // Call Edge Function with ui_mode: embedded
      const { data, error: functionError } = await supabase.functions.invoke<EmbeddedCheckoutSessionResponse>(
        'create-checkout-session',
        {
          body: {
            price_id: priceId,
            interval: billingInterval,
            module_id: moduleId,
            ui_mode: 'embedded',
            ...(email && { email }),
          } as EmbeddedCheckoutSessionRequest,
        }
      );

      if (functionError) {
        console.error('❌ Embedded checkout session error:', functionError);
        throw new Error(functionError.message || CHECKOUT_ERRORS.SESSION_FAILED);
      }

      if (!data || !data.clientSecret) {
        throw new Error(CHECKOUT_ERRORS.SESSION_FAILED);
      }

      console.log('✅ Embedded checkout session created:', data.session_id);

      // Store modal context
      setClientSecret(data.clientSecret);
      setModuleTitle(title);
      setPrice(priceDisplay);
      setInterval(billingInterval);
      
      // Open modal
      setIsModalOpen(true);

    } catch (err: unknown) {
      console.error('❌ useEmbeddedCheckout error:', err);

      const errorMessage = (err as Error).message || CHECKOUT_ERRORS.UNKNOWN_ERROR;

      setError({
        message: errorMessage,
        code: (err as Error & { code?: string }).code,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setClientSecret(null);
    setError(null);
  };

  return {
    openPaymentModal,
    closePaymentModal,
    clientSecret,
    isModalOpen,
    moduleTitle,
    price,
    interval,
    error,
    isLoading,
  };
}
