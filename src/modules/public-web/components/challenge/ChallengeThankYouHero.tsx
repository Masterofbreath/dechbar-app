/**
 * ChallengeThankYouHero Component
 * 
 * Hero section děkovné stránky
 * Obsahuje: Checkmark icon + hlavní potvrzení registrace
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

export function ChallengeThankYouHero() {
  return (
    <div className="challenge-thank-you-hero">
      {/* Checkmark Circle Icon */}
      <div className="challenge-thank-you-hero__icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Headline - Ultra Premium: Krátké, sebevědomé, bez závazku */}
      <h1 className="challenge-thank-you-hero__title">
        Hotovo
      </h1>

      {/* Subheadline - Jasný fakt, bez tlaku */}
      <p className="challenge-thank-you-hero__subtitle">
        Výzva startuje 1. března
      </p>
    </div>
  );
}
