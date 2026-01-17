/**
 * HeroSection Component - Research-Based Rebuild
 * 
 * Main hero section optimized for Czech market 2026 launch
 * Based on market research, personas, and Visual Brand Book 2.0
 * 
 * Design: Full viewport height, 2-column layout (desktop), stacked (mobile)
 * Headline: "První česká aplikace pro funkční dýchání" - Science-first positioning
 * CTA: Email registration (Magic Link) - lowest friction conversion
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/platform';
import { useAuth } from '@/platform/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { AnimatedWaves } from './AnimatedWaves';
import { HeroMockup } from './HeroMockup';
import { MESSAGES } from '@/config/messages';

// Trust signals data
const TRUST_SIGNALS = [
  { icon: 'users', text: '1150+ dýchačů' },
  { icon: 'headphones', text: '100+ cvičení' },
  { icon: 'certificate', text: 'Certifikováno' },
  { icon: 'currency', text: 'Od 0 Kč' },
];

export function HeroSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleCTA() {
    if (user) {
      // ✅ Přihlášený user → redirect do appky
      navigate('/app');
    } else {
      // ✅ Nepřihlášený user → otevři register modal
      setShowAuthModal(true);
    }
  }

  return (
    <>
      <section className="landing-hero">
        {/* Animated waves background */}
        <AnimatedWaves />
        
        <div className="landing-hero__container">
          {/* Left side: Content */}
          <div className="landing-hero__content">
            <h1 className="landing-hero__title">
              První česká aplikace pro funkční dýchání
            </h1>
            
            <h2 className="landing-hero__subtitle">
              Měř svůj pokrok. Cvič s certifikovaným instruktorem. Viditelné výsledky za 21 dní.
            </h2>
            
            <div className="landing-hero__cta">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleCTA}
              >
                {user 
                  ? MESSAGES.landing.authenticatedCTA.heroPrimary 
                  : MESSAGES.landing.hero.ctaPrimary}
              </Button>
              
              <p className="landing-hero__cta-subtext">
                {user 
                  ? MESSAGES.landing.authenticatedCTA.heroSubtext 
                  : MESSAGES.landing.hero.ctaSubtext}
              </p>
            </div>
            
            {/* Trust signals */}
            <div className="trust-signals">
              {TRUST_SIGNALS.map((item, index) => (
                <div key={index} className="trust-signal">
                  <img 
                    src={`/assets/icons/trust/${item.icon}.svg`}
                    alt=""
                    aria-hidden="true"
                    width="20"
                    height="20"
                    className="trust-signal__icon"
                  />
                  <span className="trust-signal__text">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right side: App mockup */}
          <div className="landing-hero__visual">
            <HeroMockup />
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 4v16m0 0l-6-6m6 6l6-6" 
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>
      
      {/* Auth Modal - Email registration */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </>
  );
}
