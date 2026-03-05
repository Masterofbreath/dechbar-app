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

import { useState, type FormEvent } from 'react';
import { Button } from '@/platform/components';
import { CloseButton } from '@/components/shared/CloseButton';
import { useChallengeMagicLink } from '@/hooks/useChallenge';
import { MESSAGES } from '@/config/messages';
import { canStillRegister } from '@/platform/api/onboarding';

export function ChallengeFinalCTA() {
  const [email, setEmail] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { sendLink, loading } = useChallengeMagicLink();
  const registrationOpen = canStillRegister();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    setShowSuccessModal(false);
    setErrorMessage('');

    // Send magic link (KP = 0 for footer CTA - KP not measured yet)
    const result = await sendLink(email, 0, 'footer_cta');

    if (result.success) {
      // Show success modal instead of redirect
      setShowSuccessModal(true);
    } else {
      setErrorMessage(result.error || 'Něco se pokazilo. Zkus to znovu.');
    }
  }

  return (
    <section className="challenge-final-cta">
      <div className="challenge-final-cta__container">
        <h2 className="challenge-final-cta__headline">
          {MESSAGES.challenge.final.headline}
        </h2>

        {/* Email Form */}
        {registrationOpen ? (
        <form className="challenge-final-cta__form" onSubmit={handleSubmit}>
          <div className="challenge-final-cta__input-wrapper">
            <input
              type="email"
              className="challenge-final-cta__email-input"
              placeholder={MESSAGES.challenge.hero.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            type="submit"
            loading={loading}
            className="challenge-final-cta__button"
          >
            {MESSAGES.challenge.final.cta}
          </Button>

          <p className="challenge-final-cta__consent">
            Pokračováním souhlasíš s{' '}
            <a href="/obchodni-podminky" target="_blank" rel="noopener noreferrer">
              Obchodními podmínkami
            </a>
            {' '}a{' '}
            <a href="/ochrana-osobnich-udaju" target="_blank" rel="noopener noreferrer">
              Ochranou osobních údajů
            </a>
            .
          </p>
        </form>
        ) : (
        <div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Výzva pro nové členy skončila 7. března.
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => { window.location.href = '/'; }}
          >
            Přejít na dechbar.cz →
          </Button>
        </div>
        )}

        {/* Success/Error Messages */}
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={() => setShowSuccessModal(false)} />
            
            <p className="success-email-display">{email}</p>
            <p className="success-instruction">Dokonči registraci v e-mailu.</p>
            
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth
              onClick={() => setShowSuccessModal(false)}
              style={{marginTop: '1.5rem'}}
            >
              Rozumím
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
