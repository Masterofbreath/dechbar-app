/**
 * WelcomeSlide — 3-krokový úvodní průvodce pro nového uživatele
 *
 * Styl: driver.js-like overlay (tmavé pozadí, card uprostřed)
 * Fixní šířka cardu — obsah se mění, modal neskáče.
 *
 * Krok 1: Pozdrav — gold + breath circle
 * Krok 2: Žárovička — gold spotlight (bez skip)
 * Krok 3: Odměna — CTA "Spustit průvodce" | "Odložit"
 *
 * Apple guideline: skip pouze na posledním kroku ✓
 */

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useNapoveda } from './hooks/useNapoveda';

const TOTAL_STEPS = 3;

function StepDots({ current }: { current: number }) {
  return (
    <div className="ws-dots" aria-label={`Krok ${current} z ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span key={i} className={`ws-dot ${i + 1 === current ? 'ws-dot--active' : i + 1 < current ? 'ws-dot--done' : ''}`} />
      ))}
    </div>
  );
}

// ===================================================
// Krok 1 — Pozdrav (gold)
// ===================================================

function Step1() {
  return (
    <div className="ws-step">
      <div className="ws-glow-wrap ws-glow-wrap--gold" aria-hidden="true">
        <div className="ws-glow__ring ws-glow__ring--1" />
        <div className="ws-glow__ring ws-glow__ring--2" />
        <div className="ws-glow__ring ws-glow__ring--3" />
        <div className="ws-glow__core ws-glow__core--gold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7v3h8v-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" />
            <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
          </svg>
        </div>
      </div>

      <div className="ws-text-block">
        <h1 className="ws-title">Vítej v DechBaru</h1>
        <p className="ws-text">
          Umění dechu v kapse.
        </p>
      </div>
    </div>
  );
}

// ===================================================
// Krok 2 — Žárovička (spotlight na skutečnou bulb v nav)
// ===================================================

function Step2() {
  return (
    <div className="ws-step">
      {/* Gold pulzující ring nad skutečnou žárovičkou v nav */}
      <div className="ws-nav-bulb-ring" aria-hidden="true" />

      <div className="ws-glow-wrap ws-glow-wrap--gold" aria-hidden="true">
        <div className="ws-glow__ring ws-glow__ring--1 ws-glow__ring--pulse" />
        <div className="ws-glow__ring ws-glow__ring--2 ws-glow__ring--pulse" />
        <div className="ws-glow__core ws-glow__core--gold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18h6" />
            <path d="M10 21h4" />
            <path d="M10 18v-2.5c0-.8-.4-1.5-1-2A6 6 0 1 1 15 13.5c-.6.5-1 1.2-1 2V18" />
          </svg>
        </div>
      </div>

      <div className="ws-text-block">
        <h2 className="ws-title">Tvůj průvodce aplikací</h2>
        <p className="ws-text">
          Ikonka žárovičky vpravo nahoře<br />
          tě provede celou aplikací<br />
          a naučí tě s ní pracovat.
        </p>
      </div>
    </div>
  );
}

// ===================================================
// Krok 3 — Odměna
// ===================================================

function Step3() {
  return (
    <div className="ws-step">
      <div className="ws-glow-wrap ws-glow-wrap--gold ws-glow-wrap--gift" aria-hidden="true">
        <div className="ws-glow__ring ws-glow__ring--1" />
        <div className="ws-glow__ring ws-glow__ring--2" />
        <div className="ws-glow__core ws-glow__core--gold">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </div>
      </div>

        <div className="ws-text-block">
          <h2 className="ws-title">Odměna za dokončení</h2>
          <div className="ws-reward-badge">
            <span className="ws-reward-days">3 dny</span>
            <span className="ws-reward-label">členství SMART zdarma</span>
          </div>
          <p className="ws-text ws-text--muted">
            Projdi průvodce a získej plný přístup<br />
            ke všem cvičením na 3 dny zdarma.
          </p>
        </div>
    </div>
  );
}

// ===================================================
// Hlavní komponenta
// ===================================================

function WelcomeSlideContent({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(1);
  const isLast = step === TOTAL_STEPS;

  const overlayClass = [
    'ws-overlay',
    step === 2 ? 'ws-overlay--step2' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={overlayClass} role="dialog" aria-modal="true" aria-label="Vítej v DechBaru">
      <div className="ws-card">
        {/* Kroky — pevná výška, obsah se neposouvá */}
        <div className="ws-content">
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>

        <StepDots current={step} />

        <div className="ws-actions">
          {!isLast ? (
            <button
              className="ws-btn ws-btn--primary"
              onClick={() => setStep((s) => s + 1)}
              type="button"
              autoFocus
            >
              Další
            </button>
          ) : (
            <>
              <button
                className="ws-btn ws-btn--primary"
                onClick={onStart}
                type="button"
                autoFocus
              >
                Spustit průvodce
              </button>
              <button
                className="ws-btn ws-btn--ghost"
                onClick={onSkip}
                type="button"
              >
                Odložit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function WelcomeSlide() {
  const { showWelcome, handleWelcomeStart, handleWelcomeSkip } = useNapoveda();

  if (!showWelcome) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <WelcomeSlideContent onStart={handleWelcomeStart} onSkip={handleWelcomeSkip} />,
    document.body
  );
}
