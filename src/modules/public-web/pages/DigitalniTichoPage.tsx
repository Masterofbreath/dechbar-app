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
import { DigitalniTichoAuthor } from '../components/digitalni-ticho/DigitalniTichoAuthor';
import { DigitalniTichoPricing } from '../components/digitalni-ticho/DigitalniTichoPricing';
import { DigitalniTichoFAQ } from '../components/digitalni-ticho/DigitalniTichoFAQ';
import { DigitalniTichoFinalCTA } from '../components/digitalni-ticho/DigitalniTichoFinalCTA';
import { DigitalniTichoFooter } from '../components/digitalni-ticho/DigitalniTichoFooter';
import { DigitalniTichoStickyCTA } from '../components/digitalni-ticho/DigitalniTichoStickyCTA';
import { EmailInputModal } from '@/platform/components/EmailInputModal';
import { PaymentModal } from '@/platform/payments';
import { useDigitalniTichoCheckout } from '../components/digitalni-ticho/useDigitalniTichoCheckout';
import { DigitalniTichoThankYouModal } from '../components/digitalni-ticho/DigitalniTichoThankYouModal';

export function DigitalniTichoPage() {
  // Jediná instance checkout stavu pro celou stránku.
  // CTA komponenty dostávají pouze handleCTAClick jako prop —
  // tím je zaručeno, že na stránce existuje vždy právě 1× EmbeddedCheckout.
  const {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    clientSecret,
    thankYouOpen,
    setThankYouOpen,
    loadingEmail,
    handleCTAClick,
    handleEmailSubmit,
    handlePaymentClose,
    handlePaymentComplete,
  } = useDigitalniTichoCheckout();

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

        {/* 7.5 Author — Jakub's personal story + authority bridge před cenovou sekcí */}
        <DigitalniTichoAuthor />

        {/* 8. Pricing */}
        <DigitalniTichoPricing onCTAClick={handleCTAClick} />

        {/* 9. FAQ */}
        <DigitalniTichoFAQ />

        {/* 10. Final CTA */}
        <DigitalniTichoFinalCTA onCTAClick={handleCTAClick} />
      </main>

      {/* Sticky CTA - po 180px scrollu */}
      <DigitalniTichoStickyCTA onCTAClick={handleCTAClick} />

      <DigitalniTichoFooter />

      {/* Jediný email modal pro celou stránku — žádné race conditions */}
      <EmailInputModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
        isLoading={loadingEmail}
      />

      {/* Jediný PaymentModal — zaručuje 1× EmbeddedCheckout na stránce (Stripe constraint) */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={handlePaymentClose}
        onPaymentComplete={handlePaymentComplete}
        clientSecret={clientSecret}
      />

      {/* Po úspěšné platbě — poděkování, po zavření redirect.
          Do 26. 2. 2026 jde uživatel na /vyzva, od 26. 2. přímo na dechbar.cz. */}
      <DigitalniTichoThankYouModal
        isOpen={thankYouOpen}
        onClose={() => {
          setThankYouOpen(false);
          const isFullWebLive = new Date() >= new Date('2026-02-26T00:00:00');
          window.location.href = isFullWebLive
            ? 'https://dechbar.cz'
            : 'https://dechbar.cz/vyzva';
        }}
      />
    </div>
  );
}
