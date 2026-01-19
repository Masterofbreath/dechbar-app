/**
 * SciencePillars Component
 * 
 * 3-pillar science section explaining the "why" behind DechBar
 * Benefit-driven: Sleep, Energy, Stress reduction
 * Links to /veda page for deep dive
 * 
 * Design: 3-column grid (desktop), 1-column stack (mobile)
 * Based on Czech market research - science-first positioning
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { ScienceIcon } from '@/platform';
import { SCIENCE_PILLARS, type SciencePillar } from '../../data/science-pillars';

export function SciencePillars() {
  return (
    <section className="science-section">
      <div className="science-section__container">
        <h2 className="section-title">Proč dýchání funguje</h2>
        
        <p className="science-section__intro">
          95 % lidí dýchá špatně. Výsledek: Špatný spánek, nízká energie a vysoký stres. Změň to za 21 dní.
        </p>
        
        <div className="science-pillars">
          {SCIENCE_PILLARS.map((pillar: SciencePillar) => (
            <div key={pillar.id} className="pillar-card">
              <ScienceIcon type={pillar.icon} className="pillar-card__icon" />
              
              <h3 className="pillar-card__title">{pillar.title}</h3>
              
              <p className="pillar-card__subtitle">{pillar.subtitle}</p>
              
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
