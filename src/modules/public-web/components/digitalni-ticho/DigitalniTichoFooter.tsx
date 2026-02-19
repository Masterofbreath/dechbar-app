/**
 * DigitalniTichoFooter Component
 * 
 * V3 - Ultra-minimal (COPIED from ChallengeFooter)
 * Apple Premium: Logo + tagline + 3 legal links + copyright ONLY
 * 
 * Konzistence s /vyzva landing page
 * Méně je více - žádné IČO/Sídlo/Telefon (komplikuje)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { Logo } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

export function DigitalniTichoFooter() {
  const currentYear = new Date().getFullYear();
  const { tagline } = MESSAGES.digitalniTicho.footer;

  return (
    <footer className="challenge-footer">
      <div className="challenge-footer__container">
        {/* Logo + tagline */}
        <div className="challenge-footer__brand">
          <Logo variant="off-white" />
          <p className="challenge-footer__tagline">
            {tagline}
          </p>
        </div>
        
        {/* Legal links */}
        <div className="challenge-footer__links">
          <a href="/privacy">Ochrana soukromí</a>
          <span className="challenge-footer__separator">•</span>
          <a href="/terms">Smluvní podmínky</a>
          <span className="challenge-footer__separator">•</span>
          <a href="/contact">Kontakt</a>
        </div>
        
        {/* Copyright */}
        <p className="challenge-footer__copyright">
          © {currentYear} DechBar
        </p>
      </div>
    </footer>
  );
}
