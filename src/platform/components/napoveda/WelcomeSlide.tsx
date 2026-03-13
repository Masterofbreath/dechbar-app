/**
 * WelcomeSlide — 3-krokový úvodní průvodce pro nového uživatele
 *
 * Styl: driver.js-like overlay (tmavé pozadí, světlý card uprostřed)
 * Minimum textu, maximální přehlednost.
 *
 * Krok 1: Pozdrav — "Vítej v DechBaru"
 * Krok 2: Žárovička — spotlight kolem bulb ikony + krátké vysvětlení
 * Krok 3: Odměna — info o 3 dnech SMART zdarma
 * Final CTA: "Spustit průvodce" | "Odložit"
 */

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useNapoveda } from './hooks/useNapoveda';

const TOTAL_STEPS = 3;

// ===================================================
// Sdílené sub-komponenty
// ===================================================

function StepDots({ current }: { current: number }) {
  return (
    <div className="ws-dots" aria-label={`Krok ${current} z ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`ws-dot ${i + 1 === current ? 'ws-dot--active' : ''}`}
        />
      ))}
    </div>
  );
}

// ===================================================
// Krok 1 — Pozdrav
// ===================================================

function Step1() {
  return (
    <div className="ws-step">
      {/* Breath circle */}
      <div className="ws-breath" aria-hidden="true">
        <div className="ws-breath__ring ws-breath__ring--1" />
        <div className="ws-breath__ring ws-breath__ring--2" />
        <div className="ws-breath__ring ws-breath__ring--3" />
        <div className="ws-breath__core">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7v3h8v-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" />
            <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
          </svg>
        </div>
      </div>

      <h1 className="ws-title">Vítej v DechBaru</h1>
      <p className="ws-text">
        Aplikace pro práci s dechem.<br />
        Ukážeme ti, jak na to.
      </p>
    </div>
  );
}

// ===================================================
// Krok 2 — Žárovička
// ===================================================

function Step2() {
  return (
    <div className="ws-step">
      {/* Spotlight kolem bulb ikony */}
      <div className="ws-spotlight" aria-hidden="true">
        <div className="ws-spotlight__ring ws-spotlight__ring--1" />
        <div className="ws-spotlight__ring ws-spotlight__ring--2" />
        <div className="ws-spotlight__icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18h6" />
            <path d="M10 21h4" />
            <path d="M10 18v-2.5c0-.8-.4-1.5-1-2A6 6 0 1 1 15 13.5c-.6.5-1 1.2-1 2V18" />
            <path d="M12 8v3M10.5 9.5l3 3" strokeWidth="1.25" strokeOpacity="0.6" />
          </svg>
        </div>
      </div>

      <h2 className="ws-title">Tvůj průvodce aplikací</h2>
      <p className="ws-text">
        Žárovička vpravo nahoře<br />
        tě provede celou aplikací.
      </p>

      {/* Šipka ukazující nahoru doprava */}
      <div className="ws-arrow-hint" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
        <span>vpravo nahoře</span>
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
      {/* Gift icon */}
      <div className="ws-reward-icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      </div>

      <h2 className="ws-title">Odměna za dokončení</h2>

      <div className="ws-reward-badge">
        <span className="ws-reward-days">3 dny</span>
        <span className="ws-reward-label">SMART zdarma</span>
      </div>

      <p className="ws-text ws-text--small">
        Projdi průvodce a získej plný přístup<br />
        ke všem cvičením na 3 dny.
      </p>
    </div>
  );
}

// ===================================================
// Hlavní komponenta
// ===================================================

function WelcomeSlideContent({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(1);

  const isLast = step === TOTAL_STEPS;

  function handleNext() {
    if (isLast) return;
    setStep((s) => s + 1);
  }

  return (
    <div
      className="ws-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Vítej v DechBaru"
    >
      <div className="ws-card">
        {/* Kroky */}
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}

        {/* Dots */}
        <StepDots current={step} />

        {/* Akce */}
        <div className="ws-actions">
          {!isLast ? (
            <>
              <button
                className="ws-btn ws-btn--primary"
                onClick={handleNext}
                type="button"
                autoFocus
              >
                Další
              </button>
              <button
                className="ws-btn ws-btn--ghost"
                onClick={onSkip}
                type="button"
              >
                Přeskočit
              </button>
            </>
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
