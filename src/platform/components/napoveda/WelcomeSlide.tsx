/**
 * WelcomeSlide — Uvítací fullscreen slide pro nového uživatele
 *
 * Zobrazí se jednou při prvním přihlášení (user_tour_state NEEXISTUJE).
 * Apple requirement: vždy přítomno "Přeskočit vše" tlačítko.
 *
 * Flow:
 * - "Jdeme na to" → vytvoří user_tour_state → spustí Tour
 * - "Přeskočit vše" → vytvoří user_tour_state (bulb=lit) → zavře slide → toast info
 */

import { createPortal } from 'react-dom';
import { useNapoveda } from './hooks/useNapoveda';

interface WelcomeSlideProps {
  onStart: () => void;
  onSkip: () => void;
}

function WelcomeContent({ onStart, onSkip }: WelcomeSlideProps) {
  return (
    <div className="welcome-slide" role="dialog" aria-modal="true" aria-label="Vítej v DechBaru">
      <div className="welcome-slide__inner">

        {/* Animovaný breath circle — logo / vizuální kotva */}
        <div className="welcome-slide__breath-circle" aria-hidden="true">
          <div className="welcome-slide__breath-ring welcome-slide__breath-ring--1" />
          <div className="welcome-slide__breath-ring welcome-slide__breath-ring--2" />
          <div className="welcome-slide__breath-ring welcome-slide__breath-ring--3" />
          <div className="welcome-slide__breath-core">
            {/* Ikona dechu */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7v3h8v-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" />
              <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
            </svg>
          </div>
        </div>

        {/* Nadpis */}
        <h1 className="welcome-slide__title">Vítej v DechBaru</h1>
        <p className="welcome-slide__lead">
          Práce s dechem dostupná na 2 kliky.
        </p>

        <div className="welcome-slide__divider" aria-hidden="true" />

        {/* Feature points */}
        <div className="welcome-slide__features">
          <div className="welcome-slide__feature">
            <span className="welcome-slide__feature-icon" aria-hidden="true">
              {/* Bulb icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" />
                <path d="M10 21h4" />
                <path d="M10 18v-2.5c0-.8-.4-1.5-1-2A6 6 0 1 1 15 13.5c-.6.5-1 1.2-1 2V18" />
              </svg>
            </span>
            <p className="welcome-slide__feature-text">
              Žárovička vpravo nahoře tě provede celou aplikací
            </p>
          </div>

          <div className="welcome-slide__feature">
            <span className="welcome-slide__feature-icon welcome-slide__feature-icon--gold" aria-hidden="true">
              {/* Gift icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </span>
            <p className="welcome-slide__feature-text">
              Dokonči Nápovědu a získej <strong>3 dny SMART zdarma</strong>
            </p>
          </div>
        </div>

        <div className="welcome-slide__divider" aria-hidden="true" />

        {/* CTA */}
        <button
          className="welcome-slide__btn-start"
          onClick={onStart}
          type="button"
          autoFocus
        >
          Jdeme na to
        </button>

        <button
          className="welcome-slide__btn-skip"
          onClick={onSkip}
          type="button"
        >
          Přeskočit vše
        </button>
      </div>
    </div>
  );
}

export function WelcomeSlide() {
  const { showWelcome, handleWelcomeStart, handleWelcomeSkip } = useNapoveda();

  if (!showWelcome) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <WelcomeContent onStart={handleWelcomeStart} onSkip={handleWelcomeSkip} />,
    document.body
  );
}
