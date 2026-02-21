/**
 * DigitalniTichoStickyCTA Component
 *
 * Plovoucí CTA lišta — zobrazí se po 180px scrollu
 * Skryje se, když je pricing sekce alespoň z 20 % viditelná
 * (uživatel vidí pricing CTA → sticky je redundantní)
 *
 * Respektuje prefers-reduced-motion
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState, useEffect } from 'react';
import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';
import { DigitalniTichoCountdown } from './DigitalniTichoCountdown';

const STICKY_SCROLL_THRESHOLD = 180;
const PRICING_VISIBILITY_THRESHOLD = 0.2;

interface DigitalniTichoStickyCTAProps {
  onCTAClick: () => void;
}

export function DigitalniTichoStickyCTA({ onCTAClick }: DigitalniTichoStickyCTAProps) {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [pricingVisible, setPricingVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Scroll threshold
    function handleScroll() {
      setScrolledPast(window.scrollY >= STICKY_SCROLL_THRESHOLD);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver — sleduje pricing sekci
    const pricingEl = document.querySelector('#pricing');
    if (pricingEl) {
      const observer = new IntersectionObserver(
        ([entry]) => setPricingVisible(entry.intersectionRatio >= PRICING_VISIBILITY_THRESHOLD),
        { threshold: PRICING_VISIBILITY_THRESHOLD }
      );
      observer.observe(pricingEl);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        observer.disconnect();
      };
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isVisible = scrolledPast && !pricingVisible;

  if (!isVisible) return null;

  return (
    <div className="digitalni-ticho-sticky-cta">
      <div className="digitalni-ticho-sticky-cta__container">
        <span className="digitalni-ticho-sticky-cta__label">
          <DigitalniTichoCountdown />
        </span>
        <Button
          variant="primary"
          size="md"
          onClick={onCTAClick}
          className="digitalni-ticho-sticky-cta__button"
        >
          {MESSAGES.digitalniTicho.pricing.cta}
        </Button>
      </div>
    </div>
  );
}
