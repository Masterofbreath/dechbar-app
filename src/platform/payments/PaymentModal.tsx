/**
 * PaymentModal Component
 * 
 * Apple-style glassmorphism modal with Stripe Embedded Checkout
 * Displays DechBar logo, module details, and Stripe payment form
 * Automatic Apple Pay/Google Pay detection based on device
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-01-20
 */

import { useEffect } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { BillingInterval } from './types';

// Load Stripe.js (cached after first load)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string | null;
  moduleTitle: string;
  price: string;
  interval: BillingInterval;
}

/**
 * PaymentModal Component
 * 
 * Renders Stripe Embedded Checkout in Apple-style modal
 * Uses existing modal system (glassmorphism, dark theme)
 * 
 * Features:
 * - DechBar logo (512x512)
 * - Module title + price context
 * - Stripe Embedded Checkout (Apple Pay, Google Pay, Cards)
 * - Security badge
 * - ESC key to close
 * - Body scroll lock
 * 
 * @example
 * ```tsx
 * <PaymentModal
 *   isOpen={isModalOpen}
 *   onClose={closePaymentModal}
 *   clientSecret={clientSecret}
 *   moduleTitle="SMART Membership"
 *   price="249 Kč"
 *   interval="monthly"
 * />
 * ```
 */
export function PaymentModal({
  isOpen,
  onClose,
  clientSecret,
  moduleTitle,
  price,
  interval,
}: PaymentModalProps) {
  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    onComplete: () => {
      console.log('✅ Payment completed');
      // Stripe will redirect to return_url (CheckoutSuccessPage)
      // Modal will auto-close on navigation
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card payment-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Close Button */}
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Zavřít"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 6L6 18M6 6l12 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Logo */}
        <div className="payment-modal__logo-wrapper">
          <img 
            src="/assets/brand/logo/payment-logo-512.png" 
            alt="DechBar" 
            className="payment-modal__logo"
            width="80"
            height="80"
          />
        </div>

        {/* Header */}
        <div className="modal-header">
          <h2 id="payment-modal-title" className="modal-title">
            {moduleTitle}
          </h2>
          <p className="modal-subtitle">
            {price} / {interval === 'monthly' ? 'měsíc' : 'rok'}
          </p>
        </div>

        {/* Stripe Embedded Checkout */}
        <div className="payment-modal__stripe-wrapper">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>

        {/* Security Badge */}
        <div className="payment-modal__security">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span>Zabezpečeno Stripe</span>
        </div>
      </div>
    </div>
  );
}
