/**
 * PricingSection Component
 * 
 * Displays 3 pricing tiers: ZDARMA, DechBar HRA, AI Průvodce
 * Grid layout with responsive adaptation per Visual Brand Book
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { PricingCard } from './PricingCard';

const PRICING_PLANS = [
  {
    title: 'ZDARMA',
    price: '0 Kč',
    badge: undefined,
    savingsBadge: undefined,
    features: [
      '10 dechových tréninků',
      'Přístup do komunity',
      'Základní funkce',
    ],
    ctaText: 'Začít zdarma',
    ctaVariant: 'ghost' as const,
    highlighted: false,
  },
  {
    title: 'DechBar HRA',
    price: '249 Kč',
    period: 'měsíc',
    badge: 'OBLÍBENÉ',
    savingsBadge: '💰 -50% sleva při ročním předplatném!',
    features: [
      'Vše zdarma',
      'Gamifikace a odměny',
      'Neomezené tréninky',
      'Statistiky a progress',
    ],
    ctaText: 'Koupit',
    ctaVariant: 'primary' as const,
    highlighted: true,
  },
  {
    title: 'AI Průvodce',
    price: '490 Kč',
    period: 'měsíc',
    badge: 'PREMIUM',
    savingsBadge: '💰 -50% sleva při ročním předplatném!',
    features: [
      'Vše z DechBar HRA',
      'AI osobní trenér',
      'Personalizace',
      'Prioritní podpora',
    ],
    ctaText: 'Koupit',
    ctaVariant: 'primary' as const,
    highlighted: false,
  },
];

export function PricingSection({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="landing-pricing" id="pricing">
      <div className="landing-pricing__container">
        <h2 className="landing-pricing__title">
          Vyber si svůj tarif
        </h2>
        
        <div className="landing-pricing__grid">
          {PRICING_PLANS.map(plan => (
            <PricingCard 
              key={plan.title}
              {...plan}
              onCTA={onCTA}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
