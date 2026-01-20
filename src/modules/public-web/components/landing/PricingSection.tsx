/**
 * PricingSection Component
 * 
 * Displays 3 pricing tiers: ZDARMA, SMART, AI COACH
 * Grid layout with responsive adaptation per Visual Brand Book
 * Features Stripe checkout integration and billing toggle
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { useAuth } from '@/platform/auth';
import { PricingCard } from './PricingCard';
import { BillingToggle, type BillingInterval } from './BillingToggle';
import { AuthModal } from '@/components/auth/AuthModal';

// Stripe Price IDs (from Stripe Dashboard)
const PRICE_IDS = {
  smart: {
    monthly: 'price_1Sra65K7en1dcW6HC63iM7bf',
    annual: 'price_1SraHbK7en1dcW6HjYNfiXau',
  },
  aiCoach: {
    monthly: 'price_1SraCSK7en1dcW6HFkmAbdIL',
    annual: 'price_1SraIaK7en1dcW6HsYyN0Aj9',
  },
} as const;

// Pricing data with monthly/annual variants
const PRICING_DATA = {
  free: {
    moduleId: 'free' as const,
    title: 'ZDARMA',
    subtitle: 'Základy funkčního dýchání',
    price: '0 Kč',
    badge: undefined,
    features: [
      'Měř svou kontrolní pauzu',
      '3 základní cvičení',
      'Ranní + večerní rituály',
      '3 vlastní cvičení',
      'Audio průvodce',
    ],
    ctaText: 'Začít zdarma',
    ctaVariant: 'ghost' as const,
    highlighted: false,
  },
  smart: {
    moduleId: 'smart' as const,
    title: 'SMART',
    subtitle: 'Inteligentní doporučení',
    badge: 'OBLÍBENÉ',
    features: [
      'Personalizovaná doporučení',
      'Sledování KP v čase',
      '150+ audio programů',
      'Neomezené vlastní cvičení',
    ],
    ctaText: 'Začít →',
    ctaVariant: 'primary' as const,
    highlighted: true,
    pricing: {
      monthly: {
        price: '249 Kč',
        period: 'měsíc',
      },
      annual: {
        price: '125 Kč',
        period: 'měsíc',
        priceAnnual: '125 Kč/měsíc',
        savingsBadge: 'Ušetříš 1 494 Kč ročně',
      },
    },
  },
  aiCoach: {
    moduleId: 'ai-coach' as const,
    title: 'AI COACH',
    subtitle: 'Tvůj osobní AI trenér',
    badge: 'PREMIUM',
    features: [
      'Osobní AI trenér 24/7',
      'Neomezený počet zpráv s AI',
      'Pokročilá analýza dýchání',
      'Prioritní podpora',
    ],
    ctaText: 'Získat AI Coache →',
    ctaVariant: 'primary' as const,
    highlighted: false,
    pricing: {
      monthly: {
        price: '490 Kč',
        period: 'měsíc',
      },
      annual: {
        price: '245 Kč',
        period: 'měsíc',
        priceAnnual: '245 Kč/měsíc',
        savingsBadge: 'Ušetříš 2 940 Kč ročně',
      },
    },
  },
} as const;

export function PricingSection() {
  const { user } = useAuth();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Helper to get Price ID for a plan
  const getPriceId = (moduleId: 'smart' | 'ai-coach'): string => {
    if (moduleId === 'smart') {
      return billingInterval === 'monthly' 
        ? PRICE_IDS.smart.monthly 
        : PRICE_IDS.smart.annual;
    }
    return billingInterval === 'monthly'
      ? PRICE_IDS.aiCoach.monthly
      : PRICE_IDS.aiCoach.annual;
  };

  // Helper to get pricing data based on billing interval
  const getPricingForInterval = (plan: typeof PRICING_DATA.smart | typeof PRICING_DATA.aiCoach) => {
    return plan.pricing[billingInterval];
  };

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
          
          {/* Billing Toggle */}
          <BillingToggle 
            value={billingInterval} 
            onChange={setBillingInterval}
          />
          
          <div className="landing-pricing__grid">
            {/* FREE TIER */}
            <PricingCard 
              moduleId={PRICING_DATA.free.moduleId}
              billingInterval={billingInterval}
              title={PRICING_DATA.free.title}
              subtitle={PRICING_DATA.free.subtitle}
              price={PRICING_DATA.free.price}
              badge={PRICING_DATA.free.badge}
              features={PRICING_DATA.free.features}
              ctaText={user ? 'Aktivní' : PRICING_DATA.free.ctaText}
              ctaVariant={PRICING_DATA.free.ctaVariant}
              highlighted={PRICING_DATA.free.highlighted}
              isDisabled={Boolean(user)}
              onFreeTierCTA={() => setShowAuthModal(true)}
            />

            {/* SMART TIER */}
            <PricingCard 
              moduleId={PRICING_DATA.smart.moduleId}
              priceId={getPriceId('smart')}
              billingInterval={billingInterval}
              title={PRICING_DATA.smart.title}
              subtitle={PRICING_DATA.smart.subtitle}
              price={getPricingForInterval(PRICING_DATA.smart).price}
              period={getPricingForInterval(PRICING_DATA.smart).period}
              priceAnnual={getPricingForInterval(PRICING_DATA.smart).priceAnnual}
              badge={PRICING_DATA.smart.badge}
              savingsBadge={billingInterval === 'annual' ? getPricingForInterval(PRICING_DATA.smart).savingsBadge : undefined}
              features={PRICING_DATA.smart.features}
              ctaText={PRICING_DATA.smart.ctaText}
              ctaVariant={PRICING_DATA.smart.ctaVariant}
              highlighted={PRICING_DATA.smart.highlighted}
            />

            {/* AI COACH TIER */}
            <PricingCard 
              moduleId={PRICING_DATA.aiCoach.moduleId}
              priceId={getPriceId('ai-coach')}
              billingInterval={billingInterval}
              title={PRICING_DATA.aiCoach.title}
              subtitle={PRICING_DATA.aiCoach.subtitle}
              price={getPricingForInterval(PRICING_DATA.aiCoach).price}
              period={getPricingForInterval(PRICING_DATA.aiCoach).period}
              priceAnnual={getPricingForInterval(PRICING_DATA.aiCoach).priceAnnual}
              badge={PRICING_DATA.aiCoach.badge}
              savingsBadge={billingInterval === 'annual' ? getPricingForInterval(PRICING_DATA.aiCoach).savingsBadge : undefined}
              features={PRICING_DATA.aiCoach.features}
              ctaText={PRICING_DATA.aiCoach.ctaText}
              ctaVariant={PRICING_DATA.aiCoach.ctaVariant}
              highlighted={PRICING_DATA.aiCoach.highlighted}
            />
          </div>
        </div>
      </section>
      
      {/* Auth Modal (for free tier only) */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </>
  );
}
