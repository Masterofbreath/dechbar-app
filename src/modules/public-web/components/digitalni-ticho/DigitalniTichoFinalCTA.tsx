/**
 * DigitalniTichoFinalCTA Component
 * 
 * Final CTA section - poslední push k akci
 * Re-cap headline + subtext + Stripe checkout CTA
 * 
 * Pattern: Následuje ChallengeFinalCTA
 * Opakování CTA v intervalech je standard u dlouhých stránek
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

interface DigitalniTichoFinalCTAProps {
  onCTAClick: () => void;
}

export function DigitalniTichoFinalCTA({ onCTAClick }: DigitalniTichoFinalCTAProps) {
  const { headline, subtext, cta } = MESSAGES.digitalniTicho.finalCTA;

  return (
    <section className="digitalni-ticho-final-cta">
      <div className="digitalni-ticho-final-cta__container">
        <h2 className="digitalni-ticho-final-cta__headline">
          {headline}
        </h2>
        
        <p className="digitalni-ticho-final-cta__subtext">
          {subtext}
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onCTAClick}
          className="digitalni-ticho-final-cta__button"
        >
          {cta}
        </Button>
      </div>
    </section>
  );
}
