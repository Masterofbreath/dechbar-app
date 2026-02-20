/**
 * DigitalniTichoAuthor Component
 *
 * Founder story section — Jakub's personal story + authority bridge
 * Placement: between Timeline and Pricing
 *
 * Purpose: Builds trust right before the purchase decision.
 * Pattern: Split layout (photo left / text right on desktop, stacked on mobile)
 *
 * Photo: Place file at /public/assets/images/jakub-dech.png
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { MESSAGES } from '@/config/messages';

export function DigitalniTichoAuthor() {
  const { headline, paragraphs, name, title, photoAlt, credentials } =
    MESSAGES.digitalniTicho.author;

  return (
    <section className="digitalni-ticho-author">
      <div className="digitalni-ticho-author__container">
        <div className="digitalni-ticho-author__layout">

          {/* FOTO — vlevo na desktopu, nahoře na mobilu */}
          <div className="digitalni-ticho-author__photo-wrap">
            <img
              src="/assets/images/jakub-dech.png"
              alt={photoAlt}
              className="digitalni-ticho-author__photo"
              loading="lazy"
            />
            <p className="digitalni-ticho-author__name">{name}</p>
            <p className="digitalni-ticho-author__title">{title}</p>
          </div>

          {/* CONTENT — vpravo na desktopu */}
          <div className="digitalni-ticho-author__content">
            <h2 className="digitalni-ticho-author__headline">{headline}</h2>

            <div className="digitalni-ticho-author__text">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Credentials strip — 3 čísla */}
            <div className="digitalni-ticho-author__credentials">
              {credentials.map((c, i) => (
                <div key={i} className="digitalni-ticho-author__credential">
                  <span className="digitalni-ticho-author__credential-value">
                    {c.value}
                  </span>
                  <span className="digitalni-ticho-author__credential-label">
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
