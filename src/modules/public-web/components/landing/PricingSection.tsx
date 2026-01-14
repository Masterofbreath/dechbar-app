/**
 * PricingSection Component
 * 
 * Displays 3 pricing tiers: ZDARMA, SMART, AI COACH
 * Grid layout with responsive adaptation per Visual Brand Book
 * Based on Czech market research - transparent pricing, annual emphasis
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { PricingCard } from './PricingCard';
import { AuthModal } from '@/components/auth/AuthModal';

const PRICING_PLANS = [
  {
    title: 'ZDARMA',
    subtitle: 'Základy funkčního dýchání',
    price: '0 Kč',
    badge: undefined,
    savingsBadge: undefined,
    features: [
      '3 základní dechová cvičení',
      'Ranní, polední a večerní protokol',
      'Audio instrukce',
    ],
    ctaText: 'Začít zdarma',
    ctaVariant: 'ghost' as const,
    highlighted: false,
  },
  {
    title: 'SMART',
    subtitle: 'Inteligentní doporučení',
    price: '249 Kč',
    period: 'měsíc',
    priceAnnual: '125 Kč/měsíc',
    badge: 'OBLÍBENÉ',
    savingsBadge: 'Ušetříš 1,488 Kč ročně',
    features: [
      'Všechno z ZDARMA',
      'BOLT skóre tracking',
      'Smart doporučení tréninků',
      'Grafy a statistiky pokroku',
      '50+ audio programů',
    ],
    ctaText: 'Začít →',
    ctaVariant: 'primary' as const,
    highlighted: true,
  },
  {
    title: 'AI COACH',
    subtitle: 'Tvůj osobní AI trenér',
    price: '490 Kč',
    period: 'měsíc',
    priceAnnual: '245 Kč/měsíc',
    badge: 'PREMIUM',
    savingsBadge: 'Ušetříš 2,940 Kč ročně',
    features: [
      'Všechno ze SMART',
      'Všech 100+ programů',
      'AI trenér přizpůsobený tobě',
      'Pokročilé analýzy (HRV, trendy)',
      'Prioritní podpora od týmu',
    ],
    ctaText: 'Získat AI Coache →',
    ctaVariant: 'primary' as const,
    highlighted: false,
  },
];

export function PricingSection() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleCTA() {
    setShowAuthModal(true);
  }

  return (
    <>
      <section className="landing-pricing" id="pricing">
        <div className="landing-pricing__container">
          <h2 className="landing-pricing__title">
            Vyber si svou cestu
          </h2>
          
          <p className="landing-pricing__subtitle">
            Začni zdarma. Upgrade, když uvidíš výsledky.
          </p>
          
          <div className="landing-pricing__grid">
            {PRICING_PLANS.map(plan => (
              <PricingCard 
                key={plan.title}
                {...plan}
                onCTA={handleCTA}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </>
  );
}
