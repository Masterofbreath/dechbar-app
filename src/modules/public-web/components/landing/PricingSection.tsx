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

import { useState, useEffect } from 'react';
import { useAuth } from '@/platform/auth';
import { useUserState, isMembershipTrial } from '@/platform/user/userStateStore';
import { PricingCard } from './PricingCard';
import { BillingToggle, type BillingInterval } from './BillingToggle';
import { AuthModal } from '@/components/auth/AuthModal';
import { AiCoachWaitlistModal } from './AiCoachWaitlistModal';
import { trackMetaEvent, trackPurchase, parsePriceString } from '@/platform/utils/analytics';
import { EmailInputModal } from '@/platform';
import { PaymentModal } from '@/platform/payments';
import { useLandingPricingCheckout } from './useLandingPricingCheckout';
import { CheckoutThankYouModal } from './CheckoutThankYouModal';
import { PRICE_IDS, SMART_FEATURES } from './pricingConstants';

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
      'Ranní + večerní protokoly',
      '3 vlastní cvičení',
      'Sledování výsledků v čase',
      'Osobní profil a uložená data',
    ] as string[],
    ctaText: 'Začít zdarma',
    ctaVariant: 'primary' as const,
    highlighted: false,
  },
  smart: {
    moduleId: 'smart' as const,
    title: 'SMART',
    subtitle: 'Inteligentní doporučení',
    badge: 'OBLÍBENÉ',
    features: [...SMART_FEATURES],
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
    ] as string[],
    ctaText: 'Získat AI Coache →',
    ctaVariant: 'primary' as const,
    highlighted: false,
    comingSoon: true,
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
  const membership = useUserState((s) => s.membership);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  // Aktuální stav tarifu uživatele
  const userPlan = membership?.plan ?? 'ZDARMA';
  const isTrial = isMembershipTrial(membership);

  // Jeden checkout stav pro celou sekci (Digitální ticho pattern)
  // Zaručuje 1× EmbeddedCheckoutProvider v DOM — Stripe constraint
  const {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    clientSecret,
    loadingEmail,
    thankYouModalOpen,
    closeThankYouModal,
    openCheckout,
    handleEmailSubmit,
    handlePaymentClose,
    handlePaymentComplete,
  } = useLandingPricingCheckout();

  // Meta Pixel: user scrolled to pricing section and saw the plans
  useEffect(() => {
    trackMetaEvent('ViewContent', {
      content_name: 'pricing',
      content_type: 'product',
    });
  }, []);

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
            {(() => {
              // Pokud má uživatel premium tarif, ZDARMA karta je "součástí tarifu X"
              const isPremiumUser = userPlan !== 'ZDARMA';
              const freeCta = isPremiumUser
                ? `Součástí tarifu ${userPlan === 'AI_COACH' ? 'AI COACH' : 'SMART'}`
                : user
                  ? 'Aktivní'
                  : PRICING_DATA.free.ctaText;
              return (
                <PricingCard
                  moduleId={PRICING_DATA.free.moduleId}
                  billingInterval={billingInterval}
                  title={PRICING_DATA.free.title}
                  subtitle={PRICING_DATA.free.subtitle}
                  price={PRICING_DATA.free.price}
                  badge={PRICING_DATA.free.badge}
                  features={PRICING_DATA.free.features}
                  ctaText={freeCta}
                  ctaVariant="primary"
                  highlighted={PRICING_DATA.free.highlighted}
                  isDisabled={Boolean(user)}
                  onFreeTierCTA={() => setShowAuthModal(true)}
                />
              );
            })()}

            {/* SMART TIER */}
            {(() => {
              const smartPricing = getPricingForInterval(PRICING_DATA.smart);
              const smartPriceId = getPriceId('smart');

              // Dynamický stav CTA podle aktuálního tarifu uživatele
              let smartCtaText = PRICING_DATA.smart.ctaText;
              let smartDisabled = false;
              let smartCTAOverride: (() => void) | undefined;

              if (userPlan === 'AI_COACH') {
                smartCtaText = 'Součástí tarifu AI COACH';
                smartDisabled = true;
              } else if (userPlan === 'SMART') {
                if (isTrial) {
                  smartCtaText = 'Zachovat přístup →';
                  smartCTAOverride = () => { window.location.href = '/muj-ucet'; };
                } else {
                  smartCtaText = 'Aktivní';
                  smartDisabled = true;
                }
              }

              return (
                <PricingCard
                  moduleId={PRICING_DATA.smart.moduleId}
                  priceId={smartPriceId}
                  billingInterval={billingInterval}
                  title={PRICING_DATA.smart.title}
                  subtitle={PRICING_DATA.smart.subtitle}
                  price={PRICING_DATA.smart.pricing.monthly.price}
                  period={smartPricing.period}
                  priceAnnual={'priceAnnual' in smartPricing ? smartPricing.priceAnnual : undefined}
                  badge={PRICING_DATA.smart.badge}
                  savingsBadge={'savingsBadge' in smartPricing ? smartPricing.savingsBadge : undefined}
                  features={PRICING_DATA.smart.features}
                  ctaText={smartCtaText}
                  ctaVariant={PRICING_DATA.smart.ctaVariant}
                  highlighted={PRICING_DATA.smart.highlighted}
                  isDisabled={smartDisabled}
                  onCTAOverride={smartCTAOverride}
                  onPaidCTAClick={(priceId, interval, moduleId, title, price) =>
                    openCheckout({ priceId, billingInterval: interval, moduleId, title, price })
                  }
                />
              );
            })()}

            {/* AI COACH TIER — comingSoon, checkout není potřeba */}
            {(() => {
              const aiCoachPricing = getPricingForInterval(PRICING_DATA.aiCoach);
              return (
                <PricingCard
                  moduleId={PRICING_DATA.aiCoach.moduleId}
                  priceId={getPriceId('ai-coach')}
                  billingInterval={billingInterval}
                  title={PRICING_DATA.aiCoach.title}
                  subtitle={PRICING_DATA.aiCoach.subtitle}
                  price={PRICING_DATA.aiCoach.pricing.monthly.price}
                  period={aiCoachPricing.period}
                  priceAnnual={'priceAnnual' in aiCoachPricing ? aiCoachPricing.priceAnnual : undefined}
                  badge={PRICING_DATA.aiCoach.badge}
                  savingsBadge={'savingsBadge' in aiCoachPricing ? aiCoachPricing.savingsBadge : undefined}
                  features={PRICING_DATA.aiCoach.features}
                  ctaText={PRICING_DATA.aiCoach.ctaText}
                  ctaVariant={PRICING_DATA.aiCoach.ctaVariant}
                  highlighted={PRICING_DATA.aiCoach.highlighted}
                  comingSoon={PRICING_DATA.aiCoach.comingSoon}
                  onComingSoonCTA={() => setShowWaitlistModal(true)}
                />
              );
            })()}
          </div>
        </div>
      </section>
      
      {/* Auth Modal (for free tier only) */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />

      {/* AI Coach Waitlist Modal */}
      {showWaitlistModal && (
        <AiCoachWaitlistModal onClose={() => setShowWaitlistModal(false)} />
      )}

      {/* Jediný EmailInputModal pro celou pricing sekci */}
      <EmailInputModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
        isLoading={loadingEmail}
      />

      {/* Jediný PaymentModal — 1× EmbeddedCheckoutProvider v DOM (Stripe constraint) */}
      <PaymentModal
        isOpen={paymentOpen}
        onClose={handlePaymentClose}
        onPaymentComplete={() => {
          trackPurchase({
            value: parsePriceString(PRICING_DATA.smart.pricing.monthly.price),
            currency: 'CZK',
            itemName: `SMART ${billingInterval === 'annual' ? 'roční' : 'měsíční'}`,
          });
          handlePaymentComplete();
        }}
        clientSecret={clientSecret}
      />

      {/* Host po platbě: poděkování + info o emailu s magic linkem (přesměrování na /) */}
      <CheckoutThankYouModal
        isOpen={thankYouModalOpen}
        onClose={() => {
          closeThankYouModal();
          window.location.href = '/';
        }}
      />
    </>
  );
}
