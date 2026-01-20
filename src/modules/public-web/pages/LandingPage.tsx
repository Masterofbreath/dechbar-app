/**
 * LandingPage Component - Research-Based Rebuild
 * 
 * Main landing page optimized for Czech market 2026 launch
 * Based on market research, personas, and conversion optimization
 * 
 * Routes: dechbar.cz/
 * 
 * Structure (6-section "Modified Apple" model):
 * 1. Hero - Value proposition + CTA
 * 2. Science - Why breathing matters (credibility)
 * 3. How It Works - Process clarity (3 steps)
 * 4. Trust - Social proof (endorsement + data)
 * 5. Pricing - Value proposition (3 tiers)
 * 6. Final CTA + FAQ - Last conversion chance + objection handling
 * 
 * Positioning: "První česká aplikace pro funkční dýchání"
 * Primary CTA: Email registration (Magic Link)
 * Differentiation: Science-first, measurement-focused, Czech authority
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { SciencePillars } from '../components/landing/SciencePillars';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TrustSection } from '../components/landing/TrustSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showCancelToast, setShowCancelToast] = useState(false);

  // Detect ?cancelled=true from Stripe redirect
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      setShowCancelToast(true);
      
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShowCancelToast(false);
        // Clean URL (remove query param)
        navigate('/', { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);

  return (
    <div className="landing-page">
      {/* Payment Cancel Toast - Apple-style lightweight banner */}
      {showCancelToast && (
        <div className="payment-cancel-toast">
          <div className="payment-cancel-toast__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <p className="payment-cancel-toast__text">
            Žádná platba nebyla provedena. Tvá karta nebyla zatížena.
          </p>
          <button 
            className="payment-cancel-toast__close"
            onClick={() => setShowCancelToast(false)}
            aria-label="Zavřít"
          >
            ×
          </button>
        </div>
      )}

      {/* Header - sticky navigation with glassmorphism */}
      <Header />

      {/* Section 1: Hero - Main value proposition */}
      {/* "První česká aplikace pro funkční dýchání" */}
      <HeroSection />

      {/* Section 2: Science - Why breathing matters */}
      {/* Bohr effect, NO, BOLT tracking - credibility builder */}
      <SciencePillars />

      {/* Section 3: How It Works - Process clarity */}
      {/* Measure → Practice → Improve (3 steps) */}
      <HowItWorks />

      {/* Section 4: Trust - Social proof */}
      {/* Professional endorsement + data metrics */}
      <TrustSection showEndorsement={true} />

      {/* Section 5: Pricing - Value proposition */}
      {/* 3 tiers: ZDARMA, STARTER (highlighted), PRO */}
      <PricingSection />

      {/* Section 6: Final CTA + FAQ - Last conversion chance */}
      {/* Repeat CTA + objection handling */}
      <FinalCTASection />

      {/* Footer - links, copyright, Czech badge */}
      <Footer />
    </div>
  );
}

