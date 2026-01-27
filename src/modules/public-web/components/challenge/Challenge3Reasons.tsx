/**
 * Challenge3Reasons Component
 * 
 * 3 důvody proč se přihlásit do výzvy
 * Apple Premium: Pozitivní framing, benefit-focused, NO EMOJI!
 * 
 * Layout: 3-column grid (desktop) / stack (mobile)
 * Icons: Inline SVG (outline style, 2.5px stroke, currentColor → Teal)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { MESSAGES } from '@/config/messages';

// Inline SVG Icons - currentColor podporuje CSS color property
const SunriseIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="24" y1="8" x2="24" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="24" y1="44" x2="24" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="8" y1="24" x2="4" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="44" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="14.1" y1="14.1" x2="11.3" y2="11.3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="36.7" y1="36.7" x2="33.9" y2="33.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="33.9" y1="14.1" x2="36.7" y2="11.3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="11.3" y1="36.7" x2="14.1" y2="33.9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const HeadphonesIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="8" y="24" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="34" y="24" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M12 24v-1M36 24v-1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const OfflineIcon = () => (
  <svg width="64" height="64" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 36c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M18 28c3.3-3.3 8.7-3.3 12 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M12 22c6.6-6.6 17.4-6.6 24 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="10" y1="38" x2="38" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const REASONS = [
  {
    icon: <SunriseIcon />,
    headline: MESSAGES.challenge.reasons.reason1.headline,
    text: MESSAGES.challenge.reasons.reason1.text,
  },
  {
    icon: <HeadphonesIcon />,
    headline: MESSAGES.challenge.reasons.reason2.headline,
    text: MESSAGES.challenge.reasons.reason2.text,
  },
  {
    icon: <OfflineIcon />,
    headline: MESSAGES.challenge.reasons.reason3.headline,
    text: MESSAGES.challenge.reasons.reason3.text,
  },
];

export function Challenge3Reasons() {
  return (
    <section className="challenge-reasons">
      <div className="challenge-reasons__container">
        {MESSAGES.challenge.reasons.title && (
          <h2 className="challenge-reasons__title">
            {MESSAGES.challenge.reasons.title}
          </h2>
        )}

        <div className="challenge-reasons__grid">
          {REASONS.map((reason, index) => (
            <div key={index} className="challenge-reason">
              <div className="challenge-reason__icon">
                {reason.icon}
              </div>
              <h3 className="challenge-reason__headline">
                {reason.headline}
              </h3>
              <p className="challenge-reason__text">
                {reason.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
