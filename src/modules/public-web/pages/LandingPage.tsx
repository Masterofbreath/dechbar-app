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

import { Header } from '../components/landing/Header';
import { HeroSection } from '../components/landing/HeroSection';
import { SciencePillars } from '../components/landing/SciencePillars';
import { HowItWorks } from '../components/landing/HowItWorks';
import { TrustSection } from '../components/landing/TrustSection';
import { PricingSection } from '../components/landing/PricingSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="landing-page">
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

