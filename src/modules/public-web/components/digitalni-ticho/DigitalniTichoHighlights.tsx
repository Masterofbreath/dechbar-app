/**
 * DigitalniTichoHighlights Component
 * 
 * 3-6 klíčových features programu Digitální ticho
 * Apple Premium: Pozitivní framing, benefit-focused, NO EMOJI
 * 
 * Layout: 3-column grid (desktop) / stack (mobile)
 * Icons: Inline SVG (outline style, 2.5px stroke, currentColor)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/DigitalniTicho
 */

import { MESSAGES } from '@/config/messages';

// Inline SVG Icons
const PathIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24c0 0 8-12 16-12s16 12 16 12-8 12-16 12-16-12-16-12z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="2.5"/>
  </svg>
);

const LayersIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12L8 20l16 8 16-8-16-8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 28l16 8 16-8M8 36l16 8 16-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InfinityIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 24c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zM20 24c0-4.4-3.6-8-8-8s-8 3.6-8 8 3.6 8 8 8 8-3.6 8-8z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ICONS = [
  <PathIcon />,      // Od Příběhu k Tichu (path/journey)
  <LayersIcon />,    // Každý den jinak (layers/unique)
  <InfinityIcon />,  // Doživotně tvoje (infinity/lifetime)
];

export function DigitalniTichoHighlights() {
  const highlights = MESSAGES.digitalniTicho.highlights.items;

  return (
    <section className="digitalni-ticho-highlights">
      <div className="digitalni-ticho-highlights__container">
        <div className="digitalni-ticho-highlights__grid">
          {highlights.map((highlight, index) => (
            <div key={index} className="digitalni-ticho-highlight">
              <div className="digitalni-ticho-highlight__icon">
                {ICONS[index % ICONS.length]}
              </div>
              <h3 className="digitalni-ticho-highlight__headline">
                {highlight.headline}
              </h3>
              <p className="digitalni-ticho-highlight__text">
                {highlight.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
