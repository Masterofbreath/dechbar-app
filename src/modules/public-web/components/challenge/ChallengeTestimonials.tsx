/**
 * ChallengeTestimonials Component
 * 
 * Testimonials z WhatsApp výzev (screenshoty nebo text)
 * Apple Premium: Authentic, minimalistické
 * 
 * Layout: Grid 3 columns (desktop) / stack (mobile)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { CHALLENGE_CONFIG } from '@/modules/public-web/data/challengeConfig';

export function ChallengeTestimonials() {
  return (
    <section className="challenge-testimonials">
      <div className="challenge-testimonials__container">
        <div className="challenge-testimonials__grid">
          {CHALLENGE_CONFIG.testimonials.map((testimonial, index) => (
            <div key={index} className="challenge-testimonial">
              {/* Pokud je screenshot, zobraz obrázek */}
              {testimonial.image ? (
                <div className="challenge-testimonial__image">
                  <img 
                    src={testimonial.image} 
                    alt={`Testimonial od ${testimonial.author}`}
                    loading="lazy"
                  />
                </div>
              ) : (
                /* Fallback: Text testimonial */
                <>
                  <blockquote className="challenge-testimonial__text">
                    "{testimonial.text}"
                  </blockquote>
                  <div className="challenge-testimonial__author">
                    — {testimonial.author}
                    {testimonial.age && `, ${testimonial.age}`}
                    {testimonial.city && `, ${testimonial.city}`}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
