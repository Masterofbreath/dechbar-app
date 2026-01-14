/**
 * SciencePillars Component
 * 
 * 3-pillar science section explaining the "why" behind DechBar
 * Bohr effect, Nitric oxide, BOLT tracking
 * Links to /veda page for deep dive
 * 
 * Design: 3-column grid (desktop), 1-column stack (mobile)
 * Based on Czech market research - science-first positioning
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { SCIENCE_PILLARS, type SciencePillar } from '../../data/science-pillars';

export function SciencePillars() {
  return (
    <section className="science-section">
      <div className="science-section__container">
        <h2 className="section-title">Proč dýchání mění vše</h2>
        
        <p className="science-section__intro">
          95% populace dýchá suboptimálně. To ovlivňuje spánek, energii i odolnost vůči stresu.
        </p>
        
        <div className="science-pillars">
          {SCIENCE_PILLARS.map((pillar: SciencePillar) => (
            <div key={pillar.id} className="pillar-card">
              <div className="pillar-card__icon">
                <img 
                  src={`/assets/icons/science/${pillar.icon}.svg`}
                  alt=""
                  aria-hidden="true"
                  width="24"
                  height="24"
                />
              </div>
              
              <h3 className="pillar-card__title">{pillar.title}</h3>
              
              <p className="pillar-card__description">{pillar.description}</p>
            </div>
          ))}
        </div>
        
        <div className="science-section__link">
          <a href="/veda" className="text-link">
            Přečti si vědecké pozadí →
          </a>
        </div>
      </div>
    </section>
  );
}
