/**
 * Footer Component
 * 
 * 4-column footer with links, logo, and copyright
 * Design: Dark surface background, responsive grid layout
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

        {/* 4-column grid */}
        <div className="landing-footer__grid">
          {/* Column 1: Produkt */}
          <div className="landing-footer__column">
            <h3 className="landing-footer__column-title">Produkt</h3>
            <ul className="landing-footer__links">
              <li><a href="#pricing">Ceník</a></li>
              <li><a href="/veda">Věda za DechBarem</a></li>
              <li><a href="/app">Funkce</a></li>
            </ul>
          </div>

          {/* Column 2: Komunita */}
          <div className="landing-footer__column">
            <h3 className="landing-footer__column-title">Komunita</h3>
            <ul className="landing-footer__links">
              <li><a href="/blog">Blog</a></li>
              <li><a href="https://facebook.com/dechbar" target="_blank" rel="noopener noreferrer">Facebook</a></li>
              <li><a href="https://instagram.com/dechbar" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            </ul>
          </div>

          {/* Column 3: Právní */}
          <div className="landing-footer__column">
            <h3 className="landing-footer__column-title">Právní</h3>
            <ul className="landing-footer__links">
              <li><a href="/gdpr">GDPR</a></li>
              <li><a href="/terms">Obchodní podmínky</a></li>
              <li><a href="/cookies">Cookies</a></li>
            </ul>
          </div>

          {/* Column 4: Kontakt */}
          <div className="landing-footer__column">
            <h3 className="landing-footer__column-title">Kontakt</h3>
            <ul className="landing-footer__links">
              <li><a href="mailto:info@dechbar.cz">Email</a></li>
              <li><a href="/support">Podpora</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar - copyright + Czech badge */}
        <div className="landing-footer__bottom">
          <p className="landing-footer__copyright">
            © {currentYear} DechBar | Certifikováno odborníky
          </p>
          <p className="landing-footer__made-in">
            🇨🇿 Vytvořeno v České republice
          </p>
        </div>
      </div>
    </footer>
  );
}
