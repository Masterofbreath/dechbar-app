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
    <svg viewBox="0 0 200 280" className="step-screenshot-placeholder">
      {/* Bez rect pozadi - cistsi vzhled */}
      
      {type === 'measure' && (
        <>
          <circle cx="100" cy="110" r="40" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" />
          <path d="M100 80v30l25 15" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
          <text x="100" y="200" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="14" fontWeight="500">
            KP Test
          </text>
        </>
      )}
      
      {type === 'practice' && (
        <>
          <path d="M50 110c0-27.6 22.4-50 50-50s50 22.4 50 50v10" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" />
          <rect x="45" y="120" width="20" height="30" rx="5" fill="var(--color-primary)" />
          <rect x="135" y="120" width="20" height="30" rx="5" fill="var(--color-primary)" />
          <path d="M70 180h60M75 170h50M80 190h40" stroke="var(--color-primary)" strokeWidth="2" opacity="0.5" />
          <text x="100" y="230" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="14" fontWeight="500">
            Audio Program
          </text>
        </>
      )}
      
      {type === 'improve' && (
        <>
          <path d="M40 180L70 150L100 130L130 100L160 80" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="40" cy="180" r="4" fill="var(--color-primary)" />
          <circle cx="70" cy="150" r="4" fill="var(--color-primary)" />
          <circle cx="100" cy="130" r="4" fill="var(--color-primary)" />
          <circle cx="130" cy="100" r="4" fill="var(--color-primary)" />
          <circle cx="160" cy="80" r="4" fill="var(--color-primary)" />
          <text x="100" y="220" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="14" fontWeight="500">
            Tvůj pokrok
          </text>
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
              <div className="step-card__number">{step.number}</div>
              
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
