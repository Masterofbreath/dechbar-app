/**
 * DigitalniTichoTimeline Component
 * 
 * V3 - Správné fáze (Příběh, Vedení, Ticho)
 * 3 kroky s prodejním textem
 * 
 * Pattern: Vertical timeline (3 steps)
 * Focus: Program journey (emotional)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { MESSAGES } from '@/config/messages';

export function DigitalniTichoTimeline() {
  const { title, phases, note } = MESSAGES.digitalniTicho.timeline;

  return (
    <section className="digitalni-ticho-timeline">
      <div className="digitalni-ticho-timeline__container">
        <h2 className="digitalni-ticho-timeline__title">
          {title}
        </h2>

        <div className="digitalni-ticho-timeline__steps">
          {phases.map((phase, index) => (
            <div key={index} className="digitalni-ticho-timeline__step">
              <h3 className="digitalni-ticho-timeline__phase-title">
                {phase.title}
              </h3>
              <p className="digitalni-ticho-timeline__phase-days">
                {phase.days}
              </p>
              <p className="digitalni-ticho-timeline__phase-description">
                {phase.description}
              </p>
            </div>
          ))}
        </div>

        {note && (
          <p className="digitalni-ticho-timeline__note">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
