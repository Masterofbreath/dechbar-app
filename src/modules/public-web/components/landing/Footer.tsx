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
            umění dechu v kapse
          </p>
        </div>
        
        {/* Legal + contact links */}
        <div className="landing-footer__links">
          <a href="/obchodni-podminky">Obchodní podmínky</a>
          <span className="landing-footer__separator">•</span>
          <a href="/ochrana-osobnich-udaju">Ochrana osobních údajů</a>
          <span className="landing-footer__separator">•</span>
          <a href="mailto:info@dechbar.cz">Kontakt</a>
        </div>
        
        {/* Copyright */}
        <p className="landing-footer__copyright">
          © {currentYear} DechBar
        </p>
      </div>
    </footer>
  );
}
