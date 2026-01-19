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
import { useAuth } from '@/platform/auth';
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
      'Měření KP',
      '3 základní cvičení',
      'Ranní + večerní protokol',
      '3 vlastní časovače',
      '3 dechpressa',
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
      'Personalizovaná doporučení',
      'Sledování KP v čase',
      '150+ audio programů',
      'Neomezené vlastní cvičení',
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
      'Osobní AI trenér 24/7',
      'Neomezený počet zpráv s AI',
      'Pokročilá analýza dýchání',
      'Prioritní podpora',
    ],
    ctaText: 'Získat AI Coache →',
    ctaVariant: 'primary' as const,
    highlighted: false,
  },
];

export function PricingSection() {
  const { user } = useAuth();
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
            {PRICING_PLANS.map(plan => {
              // ✅ Dynamic CTA for authenticated users
              const isFreePlan = plan.title === 'ZDARMA';
              const ctaText = (user && isFreePlan) 
                ? 'Aktivní' 
                : plan.ctaText;
              const isDisabled = Boolean(user && isFreePlan); // ✅ Convert to boolean
              
              return (
                <PricingCard 
                  key={plan.title}
                  {...plan}
                  ctaText={ctaText}
                  isDisabled={isDisabled}
                  onCTA={handleCTA}
                />
              );
            })}
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
