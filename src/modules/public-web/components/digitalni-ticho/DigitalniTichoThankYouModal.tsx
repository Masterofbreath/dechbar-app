/**
 * DigitalniTichoThankYouModal
 *
 * Zobrazí se po úspěšné platbě místo přesměrování na novou stránku.
 * Potvrdí nákup, řekne co dál a zavře se klikem mimo nebo tlačítkem.
 *
 * Design: Apple Premium dark modal — minimalistický, žádný overflow textu.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useEffect } from 'react';
import { Button } from '@/platform/components';
import { CloseButton } from '@/components/shared';

const PROGRAM_START_DATE = new Date('2026-03-01T00:00:00');

interface DigitalniTichoThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DigitalniTichoThankYouModal({
  isOpen,
  onClose,
}: DigitalniTichoThankYouModalProps) {
  // Lock body scroll
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

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const isProgramLive = new Date() >= PROGRAM_START_DATE;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card dt-thankyou-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={onClose} />

        {/* Success icon */}
        <div className="dt-thankyou-modal__icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="var(--color-primary)" strokeWidth="3" />
            <path d="M17 28l8 8 14-14" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Platba proběhla!</h2>
          <p className="modal-subtitle">
            Tvoje místo v programu Digitální ticho je zajištěno.
          </p>
        </div>

        {/* Info */}
        <div className="dt-thankyou-modal__steps">
          <div className="dt-thankyou-modal__step">
            <span className="dt-thankyou-modal__step-label">Co dál?</span>
            <p className="dt-thankyou-modal__step-text">
              Za chvíli ti přijde e-mail s přihlašovacím odkazem a všemi informacemi o programu.
            </p>
          </div>
          <div className="dt-thankyou-modal__step">
            <span className="dt-thankyou-modal__step-label">Kde program najdeš?</span>
            <p className="dt-thankyou-modal__step-text">
              Po přihlášení do DechBar app přejdi na záložku <strong>Akademie</strong> — tam najdeš celý program REŽIM.
            </p>
          </div>
          <div className="dt-thankyou-modal__step">
            <span className="dt-thankyou-modal__step-label">Start programu</span>
            <p className="dt-thankyou-modal__step-text">
              {isProgramLive
                ? <>Program máš dostupný. <strong>Dnes můžeš začít.</strong></>
                : <>Program startuje <strong>1.&nbsp;3.&nbsp;2026</strong>. Přístup dostaneš v den startu.</>
              }
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onClose}
        >
          {isProgramLive ? 'Rozumím, jdu na to!' : 'Rozumím, těším se!'}
        </Button>
      </div>
    </div>
  );
}
