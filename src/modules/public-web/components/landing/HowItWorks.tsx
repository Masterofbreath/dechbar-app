/**
 * HowItWorks Component
 * 
 * 3-step process explanation: Measure → Practice → Improve
 * With numbered badges and placeholder screenshots
 * 
 * Design: 3-column grid (desktop), vertical stack (mobile)
 * Based on conversion research - clear process reduces friction
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { HOW_IT_WORKS_STEPS, type HowItWorksStep } from '../../data/how-it-works';

function StepScreenshotPlaceholder({ type }: { type: 'measure' | 'practice' | 'improve' }) {
  return (
    <svg viewBox="0 0 200 220" className="step-screenshot-placeholder">
      {type === 'measure' && (
        <>
          {/* Outer subtle circle */}
          <circle cx="100" cy="100" r="50" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.2" />
          {/* Main circle */}
          <circle cx="100" cy="100" r="42" stroke="var(--color-primary)" strokeWidth="3" fill="none" />
          {/* Clock hand */}
          <path d="M100 70v30l25 15" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      
      {type === 'practice' && (
        <>
          {/* Headphones */}
          <path d="M50 95c0-27.6 22.4-50 50-50s50 22.4 50 50v10" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" />
          <rect x="45" y="105" width="20" height="30" rx="5" fill="var(--color-primary)" />
          <rect x="135" y="105" width="20" height="30" rx="5" fill="var(--color-primary)" />
          {/* Waveform */}
          <path d="M70 165h60M75 155h50M80 175h40" stroke="var(--color-primary)" strokeWidth="2" opacity="0.5" />
        </>
      )}
      
      {type === 'improve' && (
        <>
          {/* Trending graph */}
          <path d="M40 150L70 120L100 100L130 70L160 50" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Data points */}
          <circle cx="40" cy="150" r="4" fill="var(--color-primary)" />
          <circle cx="70" cy="120" r="4" fill="var(--color-primary)" />
          <circle cx="100" cy="100" r="4" fill="var(--color-primary)" />
          <circle cx="130" cy="70" r="4" fill="var(--color-primary)" />
          <circle cx="160" cy="50" r="5" fill="var(--color-primary)" />
        </>
      )}
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section className="how-it-works-section">
      <div className="how-it-works__container">
        <h2 className="section-title">Jak DechBar funguje</h2>
        
        <div className="steps-grid">
          {HOW_IT_WORKS_STEPS.map((step: HowItWorksStep) => (
            <div key={step.number} className="step-card">
              {/* Číslo nahoře - malé a gold */}
              <div className="step-card__number-badge">{step.number}</div>
              
              <div className="step-card__screenshot">
                <StepScreenshotPlaceholder type={step.screenshotPlaceholder} />
              </div>
              
              <h3 className="step-card__title">{step.title}</h3>
              
              <p className="step-card__description">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
