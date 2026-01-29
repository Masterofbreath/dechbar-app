/**
 * ChallengeThankYouPage Component
 * 
 * Děkovná stránka po registraci do výzvy
 * Route: /vyzva/dekujeme
 * 
 * Apple Premium style: Ultra-minimalistická, uklidňující
 * Cíl: Potvrdit registraci, vyjasnit timeline, zdůraznit SMART bonus
 * 
 * Struktura:
 * 1. Hero - Checkmark + potvrzení
 * 2. Bonus - SMART tarif info
 * 3. Timeline - Co bude dál (3 kroky)
 * 4. CTA - Zavřít / pokračovat
 * 5. Footer - Reuse ChallengeFooter
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChallengeThankYouHero } from '../components/challenge/ChallengeThankYouHero';
import { ChallengeThankYouBonus } from '../components/challenge/ChallengeThankYouBonus';
import { ChallengeThankYouTimeline } from '../components/challenge/ChallengeThankYouTimeline';
import { ChallengeFooter } from '../components/challenge/ChallengeFooter';
import '@/styles/modules/challenge/challenge-thank-you.css';

export function ChallengeThankYouPage() {
  const navigate = useNavigate();

  // Set page title
  useEffect(() => {
    document.title = 'Děkujeme za registraci | DechBar Výzva 2026';
    
    // Reset scroll position
    window.scrollTo(0, 0);
  }, []);

  const handleContinue = () => {
    // Navigate back to challenge page or close
    navigate('/vyzva');
  };

  return (
    <div className="challenge-thank-you">
      {/* NO HEADER - Apple Premium style */}

      {/* Main Content */}
      <main className="challenge-thank-you__main">
        <div className="challenge-thank-you__container">
          {/* 1. Hero - Checkmark + Potvrzení */}
          <ChallengeThankYouHero />

          {/* 2. Bonus - SMART tarif */}
          <ChallengeThankYouBonus />

          {/* 3. Timeline - Co bude dál */}
          <ChallengeThankYouTimeline />

          {/* 4. CTA */}
          <div className="challenge-thank-you-cta">
            <button 
              className="challenge-thank-you-cta__button"
              onClick={handleContinue}
            >
              Rozumím →
            </button>
          </div>
        </div>
      </main>

      {/* Footer - Reuse from ChallengePage */}
      <ChallengeFooter />
    </div>
  );
}
