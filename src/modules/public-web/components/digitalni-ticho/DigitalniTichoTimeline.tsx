/**
 * DigitalniTichoTimeline Component
 *
 * V5 — Plný seznam 21 dílů
 * - Desktop: všechny dny vždy viditelné
 * - Mobile: seznam dní skrytý za togglem (accordion)
 * - Den 1: "Poslechni si →" odkaz scrolluje na audio preview sekci
 *
 * Každá fáze: title + days + arc description + seznam epizod
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { useState } from 'react';
import { MESSAGES } from '@/config/messages';

function scrollToPreview() {
  document.querySelector('.digitalni-ticho-preview')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export function DigitalniTichoTimeline() {
  const { title, phases, note } = MESSAGES.digitalniTicho.timeline;

  // Accordion state — na mobilu defaultně vše zavřené
  const [openPhases, setOpenPhases] = useState<number[]>([]);

  function togglePhase(index: number) {
    setOpenPhases(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }

  return (
    <section className="digitalni-ticho-timeline">
      <div className="digitalni-ticho-timeline__container">
        <h2 className="digitalni-ticho-timeline__title">{title}</h2>

        <div className="digitalni-ticho-timeline__steps">
          {phases.map((phase, index) => {
            const isOpen = openPhases.includes(index);
            const phaseKey = `phase-${index}`;

            return (
              <div key={phaseKey} className="digitalni-ticho-timeline__step">

                {/* Phase header */}
                <div className="digitalni-ticho-timeline__phase-header">
                  <div className="digitalni-ticho-timeline__phase-meta">
                    <span className="digitalni-ticho-timeline__phase-days">
                      {phase.days}
                    </span>
                    <h3 className="digitalni-ticho-timeline__phase-title">
                      {phase.title}
                    </h3>
                  </div>
                  <p className="digitalni-ticho-timeline__phase-arc">
                    {phase.arc}
                  </p>
                </div>

                {/* Episode list — desktop: vždy viditelné, mobile: accordion */}
                <div
                  className={`digitalni-ticho-timeline__episodes${isOpen ? ' digitalni-ticho-timeline__episodes--open' : ''}`}
                >
                  <ul className="digitalni-ticho-timeline__episode-list">
                    {phase.episodes.map(ep => (
                      <li key={ep.day} className="digitalni-ticho-timeline__episode">
                        <span className="digitalni-ticho-timeline__episode-day">
                          {ep.day}
                        </span>
                        <span className="digitalni-ticho-timeline__episode-name">
                          {ep.name}
                        </span>
                        {ep.day === 1 && (
                          <button
                            className="digitalni-ticho-timeline__episode-preview"
                            onClick={scrollToPreview}
                            type="button"
                          >
                            Poslechni si →
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile toggle */}
                <button
                  className="digitalni-ticho-timeline__toggle"
                  onClick={() => togglePhase(index)}
                  aria-expanded={isOpen}
                  aria-controls={`episodes-${index}`}
                  type="button"
                >
                  {isOpen ? 'Skrýt dny ↑' : 'Zobraz všechny dny ↓'}
                </button>

              </div>
            );
          })}
        </div>

        {note && (
          <p className="digitalni-ticho-timeline__note">{note}</p>
        )}
      </div>
    </section>
  );
}
