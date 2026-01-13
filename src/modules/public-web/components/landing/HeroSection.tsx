/**
 * HeroSection Component
 * 
 * Main hero section with headline, subheading, trust signals, and CTA
 * Includes animated waves background and app screenshot mockup
 * 
 * Design: Full viewport height, 2-column layout (desktop), stacked (mobile)
 * Headline: "Tvůj dechový průvodce v kapse." - 48px desktop, 36px mobile
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { Button } from '@/platform';
import { AnimatedWaves } from './AnimatedWaves';
import { TrustSignals } from './TrustSignals';

export function HeroSection({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="landing-hero">
      {/* Animated waves background */}
      <AnimatedWaves />
      
      <div className="landing-hero__container">
        {/* Left side: Content */}
        <div className="landing-hero__content">
          <h1 className="landing-hero__title hero-fade-in hero-fade-in--1">
            Tvůj dechový průvodce v kapse. 🚀
          </h1>
          
          <p className="landing-hero__subtitle hero-fade-in hero-fade-in--2">
            Přes 100 dechových tréninků. AI průvodce. Komunita 1,150+ lidí.
          </p>
          
          <div className="hero-fade-in hero-fade-in--3">
            <TrustSignals />
          </div>
          
          <div className="landing-hero__cta hero-fade-in hero-fade-in--4">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={onCTA}
            >
              Začít zdarma
            </Button>
          </div>
        </div>
        
        {/* Right side: App screenshot mockup */}
        <div className="landing-hero__visual hero-fade-in hero-fade-in--2">
          <div className="app-mockup">
            <div className="app-mockup__frame">
              <div className="app-mockup__screen">
                {/* Placeholder for app screenshot - will be replaced with real image */}
                <div className="screenshot-placeholder">
                  <svg 
                    width="200" 
                    height="400" 
                    viewBox="0 0 200 400" 
                    fill="none"
                    className="screenshot-placeholder__svg"
                  >
                    <rect 
                      width="200" 
                      height="400" 
                      fill="var(--color-surface)"
                      rx="20"
                    />
                    <text 
                      x="100" 
                      y="200" 
                      textAnchor="middle" 
                      fill="var(--color-text-tertiary)"
                      fontSize="14"
                    >
                      Screenshot aplikace
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
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
  );
}
