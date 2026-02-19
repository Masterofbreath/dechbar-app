/**
 * DigitalniTichoPage Component (V4 - Paid Traffic Optimized)
 *
 * Landing page pro Digitální ticho - 21denní audio program REŽIM
 * Route: /digitalni-ticho
 *
 * V4 Structure:
 * 1. Hero - Centered headline + Trust signals (gold, countdown, guarantee)
 * 2. Audio Preview - Řeší "nevím co kupuju" + CTA
 * 3. Social Proof - Hned po poslechu ukázky (expandable 3+3)
 * 4. Storytelling - Pain → Solution → Transformation
 * 5. Pro koho to je/není - Kvalifikace + CTA
 * 6. Highlights - 3 key features
 * 7. Timeline - 3 fáze (výsledky od Týdne 1)
 * 8. Pricing - 990 Kč + guarantee
 * 9. FAQ - Všechny námitky
 * 10. Final CTA
 * + Sticky CTA bar (po 180px scrollu)
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useEffect } from 'react';
import { DigitalniTichoHero } from '../components/digitalni-ticho/DigitalniTichoHero';
import { DigitalniTichoAudioPreview } from '../components/digitalni-ticho/DigitalniTichoAudioPreview';
import { DigitalniTichoSocialProof } from '../components/digitalni-ticho/DigitalniTichoSocialProof';
import { DigitalniTichoStory } from '../components/digitalni-ticho/DigitalniTichoStory';
import { DigitalniTichoPro } from '../components/digitalni-ticho/DigitalniTichoPro';
import { DigitalniTichoHighlights } from '../components/digitalni-ticho/DigitalniTichoHighlights';
import { DigitalniTichoTimeline } from '../components/digitalni-ticho/DigitalniTichoTimeline';
import { DigitalniTichoPricing } from '../components/digitalni-ticho/DigitalniTichoPricing';
import { DigitalniTichoFAQ } from '../components/digitalni-ticho/DigitalniTichoFAQ';
import { DigitalniTichoFinalCTA } from '../components/digitalni-ticho/DigitalniTichoFinalCTA';
import { DigitalniTichoFooter } from '../components/digitalni-ticho/DigitalniTichoFooter';
import { DigitalniTichoStickyCTA } from '../components/digitalni-ticho/DigitalniTichoStickyCTA';

export function DigitalniTichoPage() {
  useEffect(() => {
    document.title = 'Digitální ticho | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="digitalni-ticho-page">
      <main className="digitalni-ticho-page__main">
        {/* 1. Hero - Centered, zlatý headline, trust signals */}
        <DigitalniTichoHero />

        {/* 2. Audio Preview - Přímá ukázka produktu + CTA */}
        <DigitalniTichoAudioPreview />

        {/* 3. Social Proof - Hned po poslechu = zachytí impulz (expandable) */}
        <DigitalniTichoSocialProof />

        {/* 4. Storytelling - PAIN > SOLUTION > TRANSFORMATION */}
        <DigitalniTichoStory />

        {/* 5. Pro koho to je/není + CTA */}
        <DigitalniTichoPro />

        {/* 6. Highlights - 3 key features */}
        <DigitalniTichoHighlights />

        {/* 7. Timeline - 3 fáze (výsledky od Týdne 1) */}
        <DigitalniTichoTimeline />

        {/* 8. Pricing */}
        <DigitalniTichoPricing />

        {/* 9. FAQ */}
        <DigitalniTichoFAQ />

        {/* 10. Final CTA */}
        <DigitalniTichoFinalCTA />
      </main>

      {/* Sticky CTA - po 180px scrollu */}
      <DigitalniTichoStickyCTA />

      <DigitalniTichoFooter />
    </div>
  );
}
