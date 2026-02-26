/**
 * AboutPage - O aplikaci
 *
 * Route: /app/about
 * Layout: Single scroll — identity, mission, creator, footer links.
 * Design: Apple premium, Less is More, dark-first, no sub-navigation.
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 * @since 0.2.1
 */

import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/platform';

const APP_VERSION = import.meta.env.VITE_APP_VERSION;

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AboutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'O aplikaci | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Back button */}
      <div className="about-page__header">
        <button
          className="about-page__back"
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ← Zpět
        </button>
      </div>

      {/* Identity block */}
      <div className="about-page__identity">
        <Logo variant="off-white" />
        <p className="about-page__tagline">umění dechu v kapse</p>
        <p className="about-page__version">v{APP_VERSION}</p>
      </div>

      <div className="about-page__divider" />

      {/* Mission section */}
      <div className="about-page__mission">
        <p className="about-page__section-label">Naše mise</p>
        <div className="about-page__mission-text">
          <p>
            Věříme, že každý z nás nese v sobě silné stránky a dary, které čekají na svůj čas.
            Dech je nástroj, který nám pomáhá tyto dary objevovat a využívat — ku prospěchu
            svému i ostatních.
          </p>
          <p>
            Naším cílem je rozdýchat Česko. Umožnit každému, kdo chce, aby prostřednictvím
            dechu našel cestu k sobě.
          </p>
        </div>
      </div>

      <div className="about-page__divider" />

      {/* Creator section */}
      <div className="about-page__creator">
        <p className="about-page__section-label">Zakladatel</p>

        <div className="about-page__creator-header">
          <img
            src="/assets/images/jakub-dech.png"
            alt="Jakub Pelikán"
            className="about-page__photo"
            width="80"
            height="80"
          />
          <div>
            <p className="about-page__creator-name">Jakub Pelikán</p>
            <p className="about-page__creator-title">Zakladatel DechBar</p>
          </div>
        </div>

        <p className="about-page__bio">
          Pocházím z malé vesničky, miluju přírodu a zdravý životní styl. Dechu se aktivně
          věnuji přes 8 let, posledních 3,5 roku naplno. Za tu dobu prošly mýma rukama
          stovky lidí, odvedl jsem desítky workshopů a natočil přes 150 audio programů.
          V komunitě DechBar jsme za jediný rok překročili 1 000 členů.
        </p>

        <div className="about-page__stats" aria-label="Statistiky">
          <div className="about-page__stat">
            <span className="about-page__stat-number">150+</span>
            <span className="about-page__stat-label">programů</span>
          </div>
          <div className="about-page__stat">
            <span className="about-page__stat-number">1 000+</span>
            <span className="about-page__stat-label">členů</span>
          </div>
          <div className="about-page__stat">
            <span className="about-page__stat-number">8 let</span>
            <span className="about-page__stat-label">praxe</span>
          </div>
        </div>

        <a
          href="https://www.instagram.com/jakub_rozdycha_cesko/"
          target="_blank"
          rel="noopener noreferrer"
          className="about-page__ig-link"
          aria-label="Instagram Jakub rozdýchá Česko"
        >
          <InstagramIcon />
          <span>@jakub_rozdycha_cesko</span>
        </a>
      </div>

      <div className="about-page__divider" />

      {/* Footer links */}
      <footer className="about-page__footer">
        <a
          href="https://www.dechbar.cz"
          target="_blank"
          rel="noopener noreferrer"
          className="about-page__web-link"
        >
          dechbar.cz
        </a>

        <div className="about-page__legal-links">
          <Link to="/app/terms">Obchodní podmínky</Link>
          <span className="about-page__legal-separator" aria-hidden="true">·</span>
          <Link to="/app/privacy">Ochrana osobních údajů</Link>
        </div>

        <a href="mailto:info@dechbar.cz" className="about-page__email">
          info@dechbar.cz
        </a>

        <p className="about-page__copyright">
          © {new Date().getFullYear()} DechBar
        </p>
      </footer>
    </div>
  );
}
