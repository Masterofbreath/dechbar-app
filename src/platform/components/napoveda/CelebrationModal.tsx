/**
 * CelebrationModal — modal po získání SMART odměny
 *
 * Zobrazuje se automaticky z NapovedaProvider po udělení reward phase 1 nebo 2.
 *
 * Fáze 1: "Gratuluji! Získal/a jsi 1 den SMART zdarma"
 * Fáze 2: "Super! Tvůj SMART prodloužen o 2 dny"
 *
 * Po zavření Fáze 1 → automaticky spustí Úroveň 2 (pokud existuje).
 */

import { createPortal } from 'react-dom';
import type { RewardPhase } from './hooks/useRewardGrant';

interface CelebrationModalProps {
  phase: RewardPhase;
  expiresAt?: string;
  onClose: () => void;
  onStartLevel2?: () => void;
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function Phase1Content({
  expiresAt,
  onClose,
  onStartLevel2,
}: {
  expiresAt?: string;
  onClose: () => void;
  onStartLevel2?: () => void;
}) {
  return (
    <>
      {/* Konfety placeholder — v budoucnu animace */}
      <div className="celebration-modal__confetti" aria-hidden="true">
        <span>🎉</span>
        <span>✨</span>
        <span>🎊</span>
      </div>

      <div className="celebration-modal__icon celebration-modal__icon--gold" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      </div>

      <h2 className="celebration-modal__title">Skvělá práce!</h2>
      <p className="celebration-modal__subtitle">
        Právě jsi dokončil/a základní průvodce DechBarem.
      </p>

      <div className="celebration-modal__reward-badge">
        <span className="celebration-modal__reward-days">+1 den</span>
        <span className="celebration-modal__reward-plan">SMART zdarma</span>
        {expiresAt && (
          <span className="celebration-modal__reward-expiry">
            Platí do {formatDate(expiresAt)}
          </span>
        )}
      </div>

      <p className="celebration-modal__hint">
        Chceš získat ještě <strong>+2 dny SMART</strong>? Pokračuj na pokročilý průvodce.
      </p>

      <div className="celebration-modal__actions">
        {onStartLevel2 && (
          <button
            className="celebration-modal__btn-primary"
            onClick={() => { onStartLevel2(); onClose(); }}
            type="button"
          >
            Pokračovat na Úroveň 2
          </button>
        )}
        <button
          className="celebration-modal__btn-secondary"
          onClick={onClose}
          type="button"
        >
          Zavřít
        </button>
      </div>
    </>
  );
}

function Phase2Content({
  expiresAt,
  onClose,
}: {
  expiresAt?: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="celebration-modal__confetti" aria-hidden="true">
        <span>🌟</span>
        <span>💪</span>
        <span>✨</span>
      </div>

      <div className="celebration-modal__icon celebration-modal__icon--primary" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      <h2 className="celebration-modal__title">Výborně!</h2>
      <p className="celebration-modal__subtitle">
        Dokončil/a jsi celý průvodce DechBarem. Jsi připraven/a naplno.
      </p>

      <div className="celebration-modal__reward-badge">
        <span className="celebration-modal__reward-days">+2 dny</span>
        <span className="celebration-modal__reward-plan">SMART prodlouženo</span>
        {expiresAt && (
          <span className="celebration-modal__reward-expiry">
            Nová platnost do {formatDate(expiresAt)}
          </span>
        )}
      </div>

      <div className="celebration-modal__actions">
        <button
          className="celebration-modal__btn-primary"
          onClick={onClose}
          type="button"
          autoFocus
        >
          Super, jdeme na to!
        </button>
      </div>
    </>
  );
}

export function CelebrationModal({
  phase,
  expiresAt,
  onClose,
  onStartLevel2,
}: CelebrationModalProps) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="celebration-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={phase === 1 ? 'Gratulace k dokončení Úrovně 1' : 'Gratulace k dokončení Průvodce'}
    >
      <div className="celebration-modal">
        {phase === 1 ? (
          <Phase1Content
            expiresAt={expiresAt}
            onClose={onClose}
            onStartLevel2={onStartLevel2}
          />
        ) : (
          <Phase2Content expiresAt={expiresAt} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body
  );
}
