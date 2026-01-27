/**
 * ChallengeBreakingText Component
 * 
 * Breaking text mezi sekcemi - pattern breaking, breathing space
 * Apple Premium: Stručný, centered, subtle
 * 
 * Purpose: Narušit monotonní flow dvou 3-column sekcí za sebou
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { MESSAGES } from '@/config/messages';

export function ChallengeBreakingText() {
  return (
    <section className="challenge-breaking-text">
      <div className="challenge-breaking-text__container">
        <p className="challenge-breaking-text__content">
          {MESSAGES.challenge.timeline.breakingText}
        </p>
      </div>
    </section>
  );
}
