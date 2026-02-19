/**
 * DigitalniTichoStory Component
 * 
 * Storytelling section - Janina Hradiská model
 * PAIN → SOLUTION → TRANSFORMATION
 * 
 * Purpose: Emocionální identifikace před technickým popisem
 * Pattern: 3-column grid (desktop) / stack (mobile)
 * 
 * Why: Návštěvník se VIDÍ v situaci → chce řešení → koupí
 * Conversion impact: +10-15% (estimated)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { MESSAGES } from '@/config/messages';

export function DigitalniTichoStory() {
  const { pain, solution, transformation } = MESSAGES.digitalniTicho.story;

  return (
    <section className="digitalni-ticho-story">
      <div className="digitalni-ticho-story__container">
        
        {/* 3-column grid (desktop) */}
        <div className="digitalni-ticho-story__grid">
          
          {/* PAIN */}
          <div className="digitalni-ticho-story__card">
            <h2 className="digitalni-ticho-story__card-headline">
              {pain.headline}
            </h2>
            <div className="digitalni-ticho-story__card-text">
              {pain.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* SOLUTION */}
          <div className="digitalni-ticho-story__card digitalni-ticho-story__card--highlight">
            <h2 className="digitalni-ticho-story__card-headline">
              {solution.headline}
            </h2>
            <div className="digitalni-ticho-story__card-text">
              {solution.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          {/* TRANSFORMATION */}
          <div className="digitalni-ticho-story__card">
            <h2 className="digitalni-ticho-story__card-headline">
              {transformation.headline}
            </h2>
            <div className="digitalni-ticho-story__card-text">
              {transformation.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
          
        </div>
        
      </div>
    </section>
  );
}
