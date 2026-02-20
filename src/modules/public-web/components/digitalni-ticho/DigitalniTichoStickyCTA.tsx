/**
 * DigitalniTichoStickyCTA Component
 *
 * Plovoucí CTA lišta - zobrazí se po 180px scrollu
 * Řeší problém: na mobilu je CTA daleko dole
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

interface DigitalniTichoStickyCTAProps {
  onCTAClick: () => void;
}

export function DigitalniTichoStickyCTA({ onCTAClick }: DigitalniTichoStickyCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function handleScroll() {
      setIsVisible(window.scrollY >= STICKY_SCROLL_THRESHOLD);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
