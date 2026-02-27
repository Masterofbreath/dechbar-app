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
import { useSwipeBack } from '@/platform/hooks/useSwipeBack';

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
  const swipeRef = useSwipeBack<HTMLDivElement>();

  useEffect(() => {
    document.title = 'O aplikaci | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page" ref={swipeRef}>
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
            Věříme, že každý z nás má své dary i silné stránky. Věříme, že každý z nás
            může žít radostný a úspěšný život v pevném zdraví. A věříme, že dech nám
            k tomu umí pomoci.
          </p>
          <p>
            Dech fyziologicky ovlivňuje nervový systém, kognitivní funkce, funkčnost orgánů
            i množství produkované energie v každé buňce našeho těla. Dech je nástroj, který
            nám naše dary i silné stránky pomáhá objevovat a využívat — ku prospěchu svému
            i ostatních.
          </p>
          <p>
            Naším cílem je rozdýchat Česko. Umožnit každému, kdo chce, aby prostřednictvím
            dechu našel cestu k sobě, ke svým darům a k energii, která je pro kvalitní,
            radostný a úspěšný život důležitá.
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
          Pocházím z malé vesničky ve Východních Čechách. Vyrůstal jsem v přírodě
          a odmalička jsem šel cestou zdravého životního stylu. S dechem mě seznámil můj
          otec už kolem sedmého roku života. Aktivně se jeho studiu věnuji 8 let a posledních
          3,5 roku naplno. Vedu firemní školení, přednáším na školách i festivalech, dělám
          osobní mentoringy a s radostí sdílím s lidmi, co dech umí a dokáže.
        </p>
        <p className="about-page__bio">
          DechBar vznikl z jednoduché myšlenky: chtěl jsem dát lidem možnost zažít, co dech
          dokáže za pouhých pár minut — zregulovat nervový systém, vrátit do přítomnosti,
          do stavu klidu, kde rozhodnutí vycházejí přirozeně. Tak vzniklo první dechpresso,
          7minutové audio, které změnilo dechovou hru.
        </p>
        <p className="about-page__bio">
          Na to navázala 21denní ranní dechová výzva, do které se za 20 dní přidalo přes
          500 lidí bez jediné utracené koruny za reklamu. V roce 2025 jsme výzvu zopakovali
          celkem 7× a komunita přerostla hranici 1 000 lidí. Zpětná vazba a příběhy lidí mě
          inspirovaly udělat další krok. Doručit víc než jen audio soubory — a tak 1. února
          2026, na první narozeniny DechBaru, vznikla tahle aplikace.
        </p>
        <p className="about-page__bio about-page__bio--closing">
          Díky, že jsi tu s námi. Přeju, ať ti dech přináší maximum a ať to funkčně dýchá.
        </p>
        <p className="about-page__bio about-page__bio--signature">
          Kuba | Dechový barista
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
