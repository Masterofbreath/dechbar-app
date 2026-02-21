/**
 * PaymentModal Component
 * 
 * Dva stavy, dva různé layouty:
 * 
 * 1. LOADING (clientSecret === null):
 *    Standardní vystředěná modal karta se spinnerem.
 *    Uživatel vidí okamžitou odezvu po submitu emailu.
 * 
 * 2. FORM (clientSecret dostupný):
 *    Fullscreen overlay — Stripe iframe plave přímo na tmavém pozadí.
 *    Žádný modal-card kontejner (žádný double-container efekt).
 *    Close button fixně v pravém horním rohu viewportu.
 *    Overlay scrolluje jako stránka (page-level scroll).
 * 
 * @package DechBar/Platform/Payments
 * @since 2026-02-20
 */

import { useEffect } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CloseButton } from '@/components/shared';

// Load Stripe.js (cached after first load, inicializuje se při importu modulu)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete?: () => void;
  clientSecret: string | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentComplete,
  clientSecret,
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

  // Modal zavřený = nic nerenderuje
  if (!isOpen) return null;

  // Modal otevřen, ale session ještě není připravena → loading stav
  // Uživatel vidí okamžitou odezvu místo čekání "ve tmě"
  if (!clientSecret) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-card payment-modal payment-modal--loading"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Připravuji platební formulář"
          aria-busy="true"
        >
          <CloseButton onClick={onClose} />
          <div className="payment-modal__loader">
            <div className="payment-modal__spinner" aria-hidden="true" />
            <p className="payment-modal__loader-text">Připravuji platební formulář…</p>
          </div>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    onComplete: () => {
      onClose();
      onPaymentComplete?.();
    },
  };

  // Fullscreen overlay — iframe plave přímo na tmavém pozadí, žádný double-container
  return (
    <div className="modal-overlay payment-modal-overlay" onClick={onClose}>
      {/* Frame je position: relative anchor pro close button */}
      <div
        className="payment-modal-frame"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Platební formulář"
      >
        {/* Close button absolutně v pravém rohu frame = překrývá tmavý Stripe header */}
        <CloseButton
          onClick={onClose}
          className="payment-modal-close"
          ariaLabel="Zavřít platební formulář"
        />

        <div className="payment-modal__stripe-wrapper">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
