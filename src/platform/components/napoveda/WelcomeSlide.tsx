/**
 * WelcomeSlide — 3-krokový úvodní průvodce
 *
 * Layout: icon (fixní pozice) → text (proměnný) → dots → akce
 * Spotlight Step 2: dynamická pozice přes getBoundingClientRect(.bulb-indicator)
 *
 * Apple guideline: skip pouze na posledním kroku ✓
 */

import { createPortal } from 'react-dom';
import { useState, useEffect, useCallback, CSSProperties } from 'react';
import { useNapoveda } from './hooks/useNapoveda';

const TOTAL_STEPS = 3;

// ===================================================
// Ikony (pouze SVG — sdílí ws-glow-wrap)
// ===================================================

function IconBreath() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2C8 2 4 5.5 4 10c0 3 1.5 5.5 4 7v3h8v-3c2.5-1.5 4-4 4-7 0-4.5-4-8-8-8z" />
      <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </svg>
  );
}

function IconBulb() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M10 18v-2.5c0-.8-.4-1.5-1-2A6 6 0 1 1 15 13.5c-.6.5-1 1.2-1 2V18" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// ===================================================
// Sdílená GlowIcon (vždy na stejné pozici v cardu)
// ===================================================

interface GlowIconProps {
  step: number;
  pulsing?: boolean;
}

function GlowIcon({ step, pulsing }: GlowIconProps) {
  return (
    <div className="ws-glow-wrap ws-glow-wrap--gold" aria-hidden="true">
      <div className={`ws-glow__ring ws-glow__ring--1${pulsing ? ' ws-glow__ring--pulse' : ''}`} />
      <div className={`ws-glow__ring ws-glow__ring--2${pulsing ? ' ws-glow__ring--pulse' : ''}`} />
      {step === 1 && <div className="ws-glow__ring ws-glow__ring--3" />}
      <div className="ws-glow__core ws-glow__core--gold">
        {step === 1 && <IconBreath />}
        {step === 2 && <IconBulb />}
        {step === 3 && <IconGift />}
      </div>
    </div>
  );
}

// ===================================================
// Text obsah jednotlivých kroků
// ===================================================

function Step1Text() {
  return (
    <div className="ws-text-block">
      <h1 className="ws-title">Vítej v DechBaru</h1>
      <p className="ws-text">
        Tady se naučíš pracovat s dechem.<br />
        Tvé umění dechu v kapse.
      </p>
    </div>
  );
}

function Step2Text() {
  return (
    <div className="ws-text-block">
      <h2 className="ws-title">Tvůj průvodce aplikací</h2>
      <p className="ws-text">
        Žárovička vpravo nahoře<br />
        tě provede celou aplikací<br />
        a naučí tě s ní pracovat.
      </p>
    </div>
  );
}

function Step3Text() {
  return (
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
  );
}

// ===================================================
// Dots navigace
// ===================================================

function StepDots({ current }: { current: number }) {
  return (
    <div className="ws-dots" aria-label={`Krok ${current} z ${TOTAL_STEPS}`}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <span
          key={i}
          className={`ws-dot${i + 1 === current ? ' ws-dot--active' : i + 1 < current ? ' ws-dot--done' : ''}`}
        />
      ))}
    </div>
  );
}

// ===================================================
// Hlavní komponenta
// ===================================================

function WelcomeSlideContent({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const [step, setStep] = useState(1);
  const [bulbRect, setBulbRect] = useState<DOMRect | null>(null);
  const isLast = step === TOTAL_STEPS;

  // Dynamicky najdeme BulbIndicator v DOM — přesná pozice bez ohledu na viewport
  const measureBulb = useCallback(() => {
    const el = document.querySelector('.bulb-indicator');
    if (el) {
      setBulbRect(el.getBoundingClientRect());
    }
  }, []);

  useEffect(() => {
    if (step === 2) {
      // Krátký timeout pro případ, že se layout ještě renderuje
      const t = setTimeout(measureBulb, 50);
      window.addEventListener('resize', measureBulb);
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', measureBulb);
      };
    }
  }, [step, measureBulb]);

  // Overlay background — step 2 má průhledný kruh přesně nad bulb ikonou
  const overlayStyle: CSSProperties | undefined =
    step === 2 && bulbRect
      ? {
          background: `radial-gradient(circle at ${bulbRect.left + bulbRect.width / 2}px ${bulbRect.top + bulbRect.height / 2}px, transparent 26px, rgba(0,0,0,0.78) 50px)`,
        }
      : undefined;

  // Gold ring pozice — vycentrováno na bulb element
  const ringStyle: CSSProperties | undefined =
    step === 2 && bulbRect
      ? {
          position: 'fixed',
          top: `${bulbRect.top + bulbRect.height / 2 - 28}px`,
          left: `${bulbRect.left + bulbRect.width / 2 - 28}px`,
          width: '56px',
          height: '56px',
        }
      : undefined;

  const overlayClass = ['ws-overlay', step === 2 ? 'ws-overlay--step2' : ''].filter(Boolean).join(' ');

  return (
    <div className={overlayClass} style={overlayStyle} role="dialog" aria-modal="true" aria-label="Vítej v DechBaru">
      {/* Gold ring nad skutečnou žárovičkou — pouze krok 2 */}
      {step === 2 && ringStyle && (
        <div className="ws-nav-bulb-ring" style={ringStyle} aria-hidden="true" />
      )}

      <div className="ws-card">
        {/* ===== ICON AREA: vždy na stejné pozici ===== */}
        <div className="ws-icon-area">
          <GlowIcon step={step} pulsing={step === 2} />
        </div>

        {/* ===== TEXT AREA: fixní výška ===== */}
        <div className="ws-text-area">
          {step === 1 && <Step1Text />}
          {step === 2 && <Step2Text />}
          {step === 3 && <Step3Text />}
        </div>

        <StepDots current={step} />

        <div className="ws-actions">
          {!isLast ? (
            <button
              className="ws-btn ws-btn--primary"
              onClick={() => setStep((s) => s + 1)}
              type="button"
            >
              Další
            </button>
          ) : (
            <>
              <button className="ws-btn ws-btn--primary" onClick={onStart} type="button">
                Spustit průvodce
              </button>
              <button className="ws-btn ws-btn--ghost" onClick={onSkip} type="button">
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
