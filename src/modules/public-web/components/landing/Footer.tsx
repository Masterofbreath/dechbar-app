/**
 * Footer Component - Apple Premium Style
 * 
 * Ultra-minimal footer pro homepage (identical to ChallengeFooter)
 * Clean, minimal, essential navigation only
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { Logo } from '@/platform';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer__container">
        {/* Logo + tagline */}
        <div className="landing-footer__brand">
          <Logo variant="off-white" />
          <p className="landing-footer__tagline">
            Tvůj dechový průvodce v kapse.
          </p>
        </div>
        
        {/* Inline navigation links */}
        <div className="landing-footer__links">
          <a href="/veda">Věda</a>
          <span className="landing-footer__separator">•</span>
          <a href="/vyzva">Výzva</a>
          <span className="landing-footer__separator">•</span>
          <a href="/privacy">Ochrana soukromí</a>
          <span className="landing-footer__separator">•</span>
          <a href="/terms">Podmínky</a>
          <span className="landing-footer__separator">•</span>
          <a href="https://www.instagram.com/jakub_rozdycha_cesko/" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        
        {/* Copyright */}
        <p className="landing-footer__copyright">
          © {currentYear} DechBar
        </p>
      </div>
    </footer>
  );
}
