/**
 * ChallengeFinalCTA Component
 * 
 * Finální call-to-action sekce (konec LP)
 * Apple Premium: Ultra clean, centered, minimalistický
 * 
 * Layout: Centered, dark background
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Challenge
 */

import { useState, FormEvent } from 'react';
import { Button } from '@/platform/components';
import { useChallenge } from '@/platform/hooks';
import { MESSAGES } from '@/config/messages';
import { CHALLENGE_CONFIG } from '@/modules/public-web/data/challengeConfig';

export function ChallengeFinalCTA() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { submitEmail, isSubmitting } = useChallenge();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    setSuccessMessage('');
    setErrorMessage('');

    const result = await submitEmail(email, CHALLENGE_CONFIG.id, 'landing_page_final');

    if (result.success) {
      setSuccessMessage(result.message);
      setEmail('');
    } else {
      setErrorMessage(result.message);
    }
  }

  return (
    <section className="challenge-final-cta">
      <div className="challenge-final-cta__container">
        <h2 className="challenge-final-cta__headline">
          {MESSAGES.challenge.final.headline}
        </h2>

        {/* Email Form */}
        <form className="challenge-final-cta__form" onSubmit={handleSubmit}>
          <div className="challenge-final-cta__input-wrapper">
            <input
              type="email"
              className="challenge-final-cta__email-input"
              placeholder={MESSAGES.challenge.hero.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={isSubmitting}
            className="challenge-final-cta__button"
          >
            {MESSAGES.challenge.final.cta}
          </Button>
        </form>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="challenge-final-cta__success">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="challenge-final-cta__error">
            {errorMessage}
          </div>
        )}

        {/* Subtext */}
        <p className="challenge-final-cta__subtext">
          {MESSAGES.challenge.final.subtext}
        </p>
      </div>
    </section>
  );
}
