/**
 * CheckoutThankYouModal
 *
 * Zobrazí se hostovi po úspěšné platbě (předplatné). Přihlášený uživatel
 * je rovnou přesměrován do appky; host vidí tento modal a dostane transakční
 * email s potvrzením a magic linkem do appky (odesílá webhook).
 *
 * Design: Apple Premium dark modal, méně je více.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Landing
 */

import { useEffect } from 'react';
import { Button } from '@/platform/components';
import { CloseButton } from '@/components/shared';

export interface CheckoutThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutThankYouModal({ isOpen, onClose }: CheckoutThankYouModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="checkout-thankyou-title">
      <div
        className="modal-card checkout-thankyou-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={onClose} />

        <div className="checkout-thankyou-modal__icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="var(--color-primary)" strokeWidth="3" />
            <path d="M17 28l8 8 14-14" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="modal-header">
          <h2 id="checkout-thankyou-title" className="modal-title">
            Vítej v DechBar
          </h2>
          <p className="modal-subtitle">
            Zkušební přístup je aktivní. Poslali jsme ti email s odkazem do appky.
          </p>
        </div>

        <p className="checkout-thankyou-modal__hint">
          Otevři email a klikni na odkaz. Přihlásíš se bez hesla a máš přístup ke všemu.
        </p>

        <Button variant="primary" size="lg" fullWidth onClick={onClose}>
          Zpět na úvod
        </Button>
      </div>
    </div>
  );
}
