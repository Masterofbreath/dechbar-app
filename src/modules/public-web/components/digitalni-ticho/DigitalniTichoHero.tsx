/**
 * DigitalniTichoHero Component
 *
 * V5 - Rotating subtitle, mobile image, premium trust signals
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useEffect } from 'react';
import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';
import { DigitalniTichoCountdown } from './DigitalniTichoCountdown';

const ROTATING_SUBTITLES = [
  'regulace nervového systému.',
  'výsledek, který cítíš od prvního dne.',
  'trénink odpočinku pro moderního člověka.',
];

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CoinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.4 10.6 7.5 12 7.5s2.5.9 2.5 2c0 2.5-5 2.5-5 5 0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RefundIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeadphonesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <polygon points="10,8 16,12 10,16" fill="currentColor"/>
  </svg>
);

export function DigitalniTichoHero() {
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setRotatingIndex(prev => (prev + 1) % ROTATING_SUBTITLES.length);
        setVisible(true);
      }, 350);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  function scrollToPricing() {
    document.querySelector('.digitalni-ticho-pricing__card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToAudio() {
    document.querySelector('.digitalni-ticho-preview')?.scrollIntoView({ behavior: 'smooth' });
  }

  const { trustBar } = MESSAGES.digitalniTicho.hero;

  return (
    <section className="digitalni-ticho-hero">
      <div className="digitalni-ticho-hero__container">
        <div className="digitalni-ticho-hero__content">

          {/* Badge — typ produktu */}
          <span className="digitalni-ticho-hero__badge">
            <HeadphonesIcon />
            {MESSAGES.digitalniTicho.hero.badge}
          </span>

          <h1 className="digitalni-ticho-hero__headline">
            {MESSAGES.digitalniTicho.hero.headline}
          </h1>

          {/* Rotating subtitle — 2řádkový layout */}
          <div className="digitalni-ticho-hero__subtitle-block">
            <span className="digitalni-ticho-hero__subtitle-fixed">
              15 minut denně –
            </span>
            <span
              className={`digitalni-ticho-hero__subtitle-rotating ${visible ? 'is-visible' : 'is-hidden'}`}
            >
              {ROTATING_SUBTITLES[rotatingIndex]}
            </span>
          </div>

          {/* Description — desktop: inline, mobile: 2 odstavce */}
          <div className="digitalni-ticho-hero__description">
            {Array.isArray(MESSAGES.digitalniTicho.hero.description)
              ? MESSAGES.digitalniTicho.hero.description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))
              : <p>{MESSAGES.digitalniTicho.hero.description}</p>
            }
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={scrollToPricing}
            className="digitalni-ticho-hero__cta"
          >
            {MESSAGES.digitalniTicho.hero.cta}
          </Button>

          {/* Audio sample link */}
          <button
            className="digitalni-ticho-hero__audio-link"
            onClick={scrollToAudio}
            type="button"
          >
            <PlayIcon />
            {MESSAGES.digitalniTicho.hero.audioSampleLabel}
          </button>

          {/* Trust Signals — Row 1: start + lifetime */}
          <div className="digitalni-ticho-hero__trust">
            <span className="trust-signal">
              <CalendarIcon />
              <DigitalniTichoCountdown />
            </span>
            <span className="trust-signal">
              <CoinIcon />
              {trustBar.lifetime}
            </span>
          </div>

          {/* Trust Signals — Row 2: guarantee, stripe, members */}
          <div className="digitalni-ticho-hero__trust digitalni-ticho-hero__trust--secondary">
            <span className="trust-signal">
              <RefundIcon />
              {trustBar.guarantee}
            </span>
            <span className="trust-signal">
              <ShieldIcon />
              {trustBar.stripe}
            </span>
            <span className="trust-signal">
              <UsersIcon />
              {trustBar.members}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
