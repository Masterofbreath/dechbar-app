/**
 * useCheckout Hook
 * 
 * React hook for creating Stripe Checkout sessions
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

import { useState } from 'react';
import { supabase } from '@/platform/api/supabase';
import { useAuth } from '@/platform/auth/useAuth';
import type {
  BillingInterval,
  CheckoutStatus,
  CheckoutSessionRequest,
  CheckoutSessionResponse,
  CheckoutError,
} from './types';
import { CHECKOUT_ERRORS } from './constants';

interface UseCheckoutReturn {
  createCheckoutSession: (
    priceId: string,
    interval: BillingInterval,
    moduleId: string,
    email?: string  // Optional email for guest checkout
  ) => Promise<void>;
  status: CheckoutStatus;
  error: CheckoutError | null;
  isLoading: boolean;
}

/**
 * useCheckout Hook
 * 
 * Handles Stripe Checkout session creation and redirects user to Stripe
 * 
 * @example
 * ```tsx
 * const { createCheckoutSession, isLoading, error } = useCheckout();
 * 
 * const handleClick = async () => {
 *   await createCheckoutSession(
 *     'price_1Sra65K7en1dcW6HC63iM7bf',
 *     'monthly',
 *     'membership-smart'
 *   );
 * };
 * ```
 */
export function useCheckout(): UseCheckoutReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<CheckoutStatus>('idle');
  const [error, setError] = useState<CheckoutError | null>(null);

  const createCheckoutSession = async (
    priceId: string,
    interval: BillingInterval,
    moduleId: string,
    email?: string
  ): Promise<void> => {
    // Reset state
    setStatus('loading');
    setError(null);

    try {
      // Guest checkout: email required if not authenticated
      if (!user && !email) {
        throw new Error('Email je povinný pro nákup bez přihlášení');
      }

      // Validate price ID
      if (!priceId) {
        throw new Error(CHECKOUT_ERRORS.MISSING_PRICE_ID);
      }

      console.log('🛒 Creating checkout session:', {
        priceId,
        interval,
        moduleId,
        userId: user?.id || 'guest',
        email: email || user?.email,
      });

      // Call Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke<CheckoutSessionResponse>(
        'create-checkout-session',
        {
          body: {
            price_id: priceId,
            interval,
            module_id: moduleId,
            ...(email && { email }),  // Include email for guests
          } as CheckoutSessionRequest,
        }
      );

      if (functionError) {
        console.error('❌ Checkout session error:', functionError);
        throw new Error(functionError.message || CHECKOUT_ERRORS.SESSION_FAILED);
      }

      if (!data || !data.url) {
        throw new Error(CHECKOUT_ERRORS.SESSION_FAILED);
      }

      console.log('✅ Checkout session created:', data.session_id);
      console.log('🔗 Redirecting to:', data.url);

      // Redirect to Stripe Checkout
      setStatus('success');
      window.location.href = data.url;

    } catch (err: any) {
      console.error('❌ useCheckout error:', err);

      const errorMessage = err.message || CHECKOUT_ERRORS.UNKNOWN_ERROR;

      setError({
        message: errorMessage,
        code: err.code,
      });
      setStatus('error');
    }
  };

  return {
    createCheckoutSession,
    status,
    error,
    isLoading: status === 'loading',
  };
}
