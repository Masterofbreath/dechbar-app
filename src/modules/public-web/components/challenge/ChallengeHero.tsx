/**
 * ChallengeHero Component
 * 
 * Hero section for Březnová Dechová Výzva 2026 landing page
 * Apple Premium style: Minimalistická, sebevědomá jednoduchost
 * 
 * Features:
 * - Email input (pre-registration)
 * - SMART tarif bonus badge (hodnota 249 Kč)
 * - Trust signals (below CTA)
 * - Interactive mockup (HeroMockup component)
 * - Full viewport height
 * - Tight letter-spacing (-0.02em) na headline
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { useState, FormEvent } from 'react';
import { Button } from '@/platform/components';
import { useChallenge } from '@/platform/hooks';
import { MESSAGES } from '@/config/messages';
import { CHALLENGE_CONFIG } from '@/modules/public-web/data/challengeConfig';
import { HeroMockup } from '@/modules/public-web/components/landing/HeroMockup';

export function ChallengeHero() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { submitEmail, isSubmitting } = useChallenge();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    // Submit email
    const result = await submitEmail(email, CHALLENGE_CONFIG.id, 'landing_page');

    if (result.success) {
      setSuccessMessage(result.message);
      setEmail(''); // Clear input
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <section className="challenge-hero">
      <div className="challenge-hero__container">
        {/* Content - Left side (40%) */}
        <div className="challenge-hero__content">
          <h1 className="challenge-hero__headline">
            {MESSAGES.challenge.hero.headline}
          </h1>
          
          <p className="challenge-hero__subtitle">
            Ráno dělá den. Začni ten svůj funkčně.<br />
            Stačí 7 minut a sluchátka.
          </p>

          {/* Email Form */}
          <form className="challenge-hero__form" onSubmit={handleSubmit}>
            <div className="challenge-hero__input-wrapper">
              <input
                type="email"
                className="challenge-hero__email-input"
                placeholder={MESSAGES.challenge.hero.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                autoFocus
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              loading={isSubmitting}
              className="challenge-hero__cta"
            >
              {MESSAGES.challenge.hero.cta}
            </Button>
          </form>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="challenge-hero__success">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="challenge-hero__error">
              {errorMessage}
            </div>
          )}

          {/* Trust Signals (below CTA) */}
          <div className="challenge-hero__trust">
            <span className="trust-signal">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {MESSAGES.challenge.hero.trustSignals.free}
            </span>
            <span className="trust-signal">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 13c0-2.5 1.5-4 4-4h4c2.5 0 4 1.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {MESSAGES.challenge.hero.trustSignals.participants}
            </span>
            <span className="trust-signal">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="5" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 7.5V9.5M10 7.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 3v2M10 3v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {MESSAGES.challenge.hero.trustSignals.simple}
            </span>
          </div>

          {/* SMART Bonus Badge */}
          <div className="challenge-hero__bonus">
            <span className="challenge-hero__bonus-text">
              {MESSAGES.challenge.hero.bonus}
            </span>
            <span className="challenge-hero__bonus-value">
              {MESSAGES.challenge.hero.bonusValue}
            </span>
          </div>

          {/* Timeline Info */}
          <p className="challenge-hero__timeline">
            {MESSAGES.challenge.hero.timeline}
          </p>
        </div>

        {/* Visual - Right side (60%) - Interactive Mockup */}
        <div className="challenge-hero__visual">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
