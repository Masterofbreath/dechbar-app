/**
 * DigitalniTichoPro Component
 *
 * Pro koho to je / není - kvalifikace cílové skupiny
 * Pomáhá filtrovat nevhodné zákazníky, zvyšuje důvěru
 *
 * Layout: 2-column grid (desktop) / stack (mobile)
 * Pattern: Následuje Story, před Highlights
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { Button } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

// Checkmark icon (pro)
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// X icon (není)
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function DigitalniTichoPro() {
  const { title, subtitle, forTitle, forItems, notForTitle, notForItems } =
    MESSAGES.digitalniTicho.pro;

  function scrollToPricing() {
    document.querySelector('.digitalni-ticho-pricing__card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="digitalni-ticho-pro">
      <div className="digitalni-ticho-pro__container">
        <h2 className="digitalni-ticho-pro__title">{title}</h2>
        {subtitle && (
          <p className="digitalni-ticho-pro__subtitle">{subtitle}</p>
        )}

        <div className="digitalni-ticho-pro__grid">
          {/* Pro koho to je */}
          <div className="digitalni-ticho-pro__column digitalni-ticho-pro__column--for">
            <h3 className="digitalni-ticho-pro__column-title">{forTitle}</h3>
            <ul className="digitalni-ticho-pro__list">
              {forItems.map((item, index) => (
                <li key={index} className="digitalni-ticho-pro__list-item">
                  <span className="digitalni-ticho-pro__list-icon digitalni-ticho-pro__list-icon--check">
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro koho to není */}
          <div className="digitalni-ticho-pro__column digitalni-ticho-pro__column--not">
            <h3 className="digitalni-ticho-pro__column-title">{notForTitle}</h3>
            <ul className="digitalni-ticho-pro__list">
              {notForItems.map((item, index) => (
                <li key={index} className="digitalni-ticho-pro__list-item">
                  <span className="digitalni-ticho-pro__list-icon digitalni-ticho-pro__list-icon--x">
                    <XIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="digitalni-ticho-pro__cta-wrapper">
          <Button
            variant="primary"
            size="lg"
            onClick={scrollToPricing}
          >
            Odemkni program →
          </Button>
        </div>
      </div>
    </section>
  );
}
