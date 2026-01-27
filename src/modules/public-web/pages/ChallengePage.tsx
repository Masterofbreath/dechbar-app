/**
 * ChallengePage Component
 * 
 * Landing page pro Březnovou Dechovou Výzvu 2026
 * Route: /vyzva
 * 
 * Apple Premium style: Ultra-minimalistická (NO HEADER)
 * Cíl: Maximální konverze (2000-5000 email registrací)
 * 
 * Struktura:
 * 1. Hero - Email input + SMART bonus
 * 2. 3 Reasons - Proč DechPresso (benefit-focused)
 * 3. Timeline - Co tě čeká (vertical centered)
 * 4. Testimonials - Sociální důkaz
 * 5. FAQ - Odstranění bariér
 * 6. Final CTA - Poslední push k akci
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useEffect } from 'react';
import { ChallengeHero } from '../components/challenge/ChallengeHero';
import { Challenge3Reasons } from '../components/challenge/Challenge3Reasons';
import { ChallengeTimeline } from '../components/challenge/ChallengeTimeline';
import { ChallengeTestimonials } from '../components/challenge/ChallengeTestimonials';
import { ChallengeFAQ } from '../components/challenge/ChallengeFAQ';
import { ChallengeFinalCTA } from '../components/challenge/ChallengeFinalCTA';
import { ChallengeFooter } from '../components/challenge/ChallengeFooter';

export function ChallengePage() {
  // Set page title
  useEffect(() => {
    document.title = 'Březnová Dechová Výzva 2026 | DechBar';
    
    // Reset scroll position
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="challenge-page">
      {/* NO HEADER - Apple Premium style for maximum CTA focus */}

      {/* Main Content */}
      <main className="challenge-page__main">
        {/* 1. Hero Section - Email input + CTA */}
        <ChallengeHero />

        {/* 2. 3 Reasons - Proč DechPresso */}
        <Challenge3Reasons />

        {/* 3. Timeline - Co tě čeká (3 kroky) */}
        <ChallengeTimeline />

        {/* 4. Testimonials - Sociální důkaz */}
        <ChallengeTestimonials />

        {/* 5. FAQ - Odstranění bariér před registrací */}
        <ChallengeFAQ />

        {/* 6. Final CTA - Poslední push */}
        <ChallengeFinalCTA />
      </main>

      {/* Footer - Ultra-minimal (legal only) */}
      <ChallengeFooter />
    </div>
  );
}
