/**
 * ChallengeBanner — Announcement strip for Březnová Dechová Výzva 2026
 *
 * Slim full-width bar above the header linking to /vyzva.
 * Apple-style announcement band with gold accent.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useNavigate } from 'react-router-dom';

export function ChallengeBanner() {
  const navigate = useNavigate();

  return (
    <div className="challenge-banner" role="banner" aria-label="Aktuální kampaň">
      <a
        className="challenge-banner__link"
        href="/vyzva"
        onClick={(e) => {
          e.preventDefault();
          navigate('/vyzva');
        }}
        aria-label="Březnová Dechová Výzva 2026 — Zjistit více"
      >
        <span className="challenge-banner__badge">Výzva</span>

        <p className="challenge-banner__text">
          <strong>Březnová Dechová Výzva 2026</strong>
          {' '}— 21 dní ke zdravějšímu dýchání. Přidej se!
        </p>

        <svg
          className="challenge-banner__arrow"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  );
}
