/**
 * PricingCard Component
 * 
 * Individual pricing plan card with features, badges, and CTA
 * Design: Dark surface with teal/gold accents per Visual Brand Book
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { Button } from '@/platform';

export interface PricingCardProps {
  title: string;
  subtitle?: string;
  price: string;
  period?: string;
  priceAnnual?: string;
  badge?: string;
  savingsBadge?: string;
  features: string[];
  ctaText: string;
  ctaVariant: 'primary' | 'ghost';
  highlighted?: boolean;
  onCTA: () => void;
}

export function PricingCard({
  title,
  subtitle,
  price,
  period,
  priceAnnual,
  badge,
  savingsBadge,
  features,
  ctaText,
  ctaVariant,
  highlighted = false,
  onCTA,
}: PricingCardProps) {
  return (
    <div className={`pricing-card ${highlighted ? 'pricing-card--highlighted' : ''}`}>
      {/* Badge (if exists) */}
      {badge && (
        <div className={`pricing-card__badge ${highlighted ? 'pricing-card__badge--gold' : 'pricing-card__badge--teal'}`}>
          {badge}
        </div>
      )}

      {/* Title */}
      <h3 className="pricing-card__title">{title}</h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="pricing-card__subtitle">{subtitle}</p>
      )}

      {/* Price */}
      <div className="pricing-card__price">
        {priceAnnual ? (
          <>
            <span className="pricing-card__price-annual">{priceAnnual}</span>
            <span className="pricing-card__price-note">(roční předplatné)</span>
            <span className="pricing-card__price-monthly">nebo {price}/{period}</span>
          </>
        ) : (
          <>
            <span className="pricing-card__price-amount">{price}</span>
            {period && (
              <span className="pricing-card__price-period">/{period}</span>
            )}
          </>
        )}
      </div>

      {/* Savings badge (if exists) */}
      {savingsBadge && (
        <div className="pricing-card__savings">
          {savingsBadge}
        </div>
      )}

      {/* Features list */}
      <ul className="pricing-card__features">
        {features.map((feature, index) => (
          <li key={index} className="pricing-card__feature">
            <svg 
              className="pricing-card__feature-icon" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
            >
              <path 
                d="M5 13l4 4L19 7" 
                stroke="var(--color-primary)"
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <Button
        variant={ctaVariant}
        size="lg"
        fullWidth
        onClick={onCTA}
        className="pricing-card__cta"
      >
        {ctaText}
      </Button>
    </div>
  );
}
