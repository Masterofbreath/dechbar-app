/**
 * ChallengeThankYouBonus Component
 * 
 * SMART tarif bonus box
 * Teal gradient pozadí + gold gift icon
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

export function ChallengeThankYouBonus() {
  return (
    <div className="challenge-thank-you-bonus">
      <div className="challenge-thank-you-bonus__content">
        {/* Gift Icon */}
        <div className="challenge-thank-you-bonus__icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="10" width="18" height="10" rx="1" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 10h18v4H3z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 10V20M12 4v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 7c0-1.5 1-3 3-3s3 1.5 3 3" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        {/* Text */}
        <div className="challenge-thank-you-bonus__text">
          <h3 className="challenge-thank-you-bonus__title">
            TVŮJ BONUS
          </h3>
          <p className="challenge-thank-you-bonus__description">
            SMART na 21 dní zdarma
          </p>
          <p className="challenge-thank-you-bonus__value">
            (Ušetříš 249 Kč)
          </p>
        </div>
      </div>
    </div>
  );
}
