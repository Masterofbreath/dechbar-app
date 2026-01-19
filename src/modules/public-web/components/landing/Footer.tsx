/**
 * Footer Component - Premium Apple-style
 * 
 * 4-column footer with breathing animation, social icons, and company info
 * Inspired by WP footer design with modern enhancements
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
        
        {/* Top section - Brand + Grid */}
        <div className="landing-footer__top">
          
          {/* Brand column */}
          <div className="landing-footer__brand">
            <Logo variant="off-white" />
            <p className="landing-footer__tagline">
              Tvůj dechový průvodce v kapse.
            </p>
            <ul className="landing-footer__company-info">
              <li><strong>Provozovatel:</strong> Jakub Pelikán</li>
              <li><strong>IČO:</strong> 05630886</li>
            </ul>
          </div>

          {/* Grid columns */}
          <div className="landing-footer__grid">
            <div className="landing-footer__column">
              <h3 className="landing-footer__column-title">Produkt</h3>
              <ul className="landing-footer__links">
                <li><a href="#pricing">Ceník</a></li>
                <li><a href="/veda">Věda</a></li>
                <li><a href="/app">Funkce</a></li>
              </ul>
            </div>

          <div className="landing-footer__column">
            <h3 className="landing-footer__column-title">Komunita</h3>
            <ul className="landing-footer__links">
              <li><a href="/blog">Blog</a></li>
              <li><a href="https://www.instagram.com/jakub_rozdycha_cesko/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><a href="https://www.youtube.com/@jakubrozdychacesko" target="_blank" rel="noopener noreferrer">YouTube</a></li>
              <li><a href="https://www.facebook.com/jakubrozdychacesko/" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            </ul>
          </div>

            <div className="landing-footer__column">
              <h3 className="landing-footer__column-title">Právní</h3>
              <ul className="landing-footer__links">
                <li><a href="/gdpr">GDPR</a></li>
                <li><a href="/terms">Podmínky</a></li>
                <li><a href="/cookies">Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar with breathing animation */}
        <div className="landing-footer__bottom">
          <div className="landing-footer__bottom-left">
            <p className="landing-footer__copyright">
              © {currentYear} DechBar | Certifikováno odborníky
            </p>
            <p className="landing-footer__made-in">
              🇨🇿 Vytvořeno v České republice
            </p>
          </div>

          {/* Social icons */}
          <div className="landing-footer__social">
            <a href="https://www.instagram.com/jakub_rozdycha_cesko/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm0 7.8a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm5.4-8.1a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4ZM21 7.2v9.6A4.2 4.2 0 0 1 16.8 21H7.2A4.2 4.2 0 0 1 3 16.8V7.2A4.2 4.2 0 0 1 7.2 3h9.6A4.2 4.2 0 0 1 21 7.2Zm-1.8 0a2.4 2.4 0 0 0-2.4-2.4H7.2A2.4 2.4 0 0 0 4.8 7.2v9.6A2.4 2.4 0 0 0 7.2 19.2h9.6a2.4 2.4 0 0 0 2.4-2.4V7.2Z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@jakubrozdychacesko" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.8 8.6s-.2-1.4-.7-2c-.7-.8-1.5-.8-1.9-.8C16.7 5.5 12 5.5 12 5.5s-4.7 0-7.2.3c-.4 0-1.2 0-1.9.8-.5.6-.7 2-.7 2s-.2 1.6-.2 3.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.7 2c.7.8 1.6.8 2 .8 1.5.2 7 .2 7 .2s4.7 0 7.2-.3c.4 0 1.2 0 1.9-.8.5-.6.7-2 .7-2s.2-1.6.2-3.2v-1.5c0-1.6-.2-3.2-.2-3.2ZM9.8 14.8v-5.7l5.5 2.9-5.5 2.8Z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/jakubrozdychacesko/" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
