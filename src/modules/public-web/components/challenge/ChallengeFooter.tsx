/**
 * ChallengeFooter Component
 * 
 * Ultra-minimal footer pro conversion landing pages
 * Apple Premium: Logo + tagline + legal links + copyright
 * 
 * Use case: /vyzva, future product LP
 * Reusable pro všechny conversion-focused landing pages
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { Logo } from '@/platform';

export function ChallengeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="challenge-footer">
      <div className="challenge-footer__container">
        {/* Logo + tagline */}
        <div className="challenge-footer__brand">
          <Logo variant="off-white" />
          <p className="challenge-footer__tagline">
            Tvůj dechový průvodce v kapse.
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
