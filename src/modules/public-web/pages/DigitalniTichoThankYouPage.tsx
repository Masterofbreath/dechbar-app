/**
 * DigitalniTichoThankYouPage Component
 * 
 * Post-checkout success page
 * Route: /digitalni-ticho/dekujeme
 * 
 * Pattern: Následuje ChallengeThankYouPage
 * Apple Premium style: Minimalistická, clear next steps
 * 
 * Content:
 * - Děkujeme za nákup
 * - Co dál? (sleduj e-mail)
 * - Kdy to začne? (1.3.2026)
 * - Příprava (sluchátka, prostředí, hlasitost)
 * - CTA zpět na dashboard
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useEffect } from 'react';
import { Button } from '@/platform/components';
import { Logo } from '@/platform/components';
import { MESSAGES } from '@/config/messages';

export function DigitalniTichoThankYouPage() {
  const { 
    title, 
    subtitle, 
    emailTitle, 
    emailText, 
    startTitle, 
    startText,
    preparationTitle,
    preparationItems,
    ctaDashboard 
  } = MESSAGES.digitalniTicho.thankYou;

  useEffect(() => {
    document.title = 'Děkujeme! | Digitální ticho | DechBar';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="digitalni-ticho-thank-you">
      <div className="digitalni-ticho-thank-you__container">
        {/* Logo */}
        <div className="digitalni-ticho-thank-you__logo">
          <Logo variant="off-white" />
        </div>

        {/* Success Icon */}
        <div className="digitalni-ticho-thank-you__icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="var(--color-primary)" strokeWidth="4"/>
            <path d="M25 40l10 10 20-20" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="digitalni-ticho-thank-you__title">
          {title}
        </h1>
        
        <p className="digitalni-ticho-thank-you__subtitle">
          {subtitle}
        </p>

        {/* Next Steps */}
        <div className="digitalni-ticho-thank-you__steps">
          {/* Email */}
          <div className="digitalni-ticho-thank-you__step">
            <h2 className="digitalni-ticho-thank-you__step-title">
              {emailTitle}
            </h2>
            <p className="digitalni-ticho-thank-you__step-text">
              {emailText}
            </p>
          </div>

          {/* Start Date */}
          <div className="digitalni-ticho-thank-you__step">
            <h2 className="digitalni-ticho-thank-you__step-title">
              {startTitle}
            </h2>
            <p className="digitalni-ticho-thank-you__step-text">
              {startText}
            </p>
          </div>

          {/* Preparation */}
          <div className="digitalni-ticho-thank-you__step">
            <h2 className="digitalni-ticho-thank-you__step-title">
              {preparationTitle}
            </h2>
            <ul className="digitalni-ticho-thank-you__preparation-list">
              {preparationItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA back to dashboard */}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => window.location.href = '/'}
        >
          {ctaDashboard}
        </Button>
      </div>
    </div>
  );
}
