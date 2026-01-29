/**
 * ThankYouPage Component
 * 
 * Děkovací stránka po dokončení registrace
 * Route: /dekujeme-za-registraci
 * 
 * Zobrazuje:
 * 1. Potvrzení registrace
 * 2. Co se stane dál (26.2. otevření app, 1.3. start výzvy)
 * 3. SMART trial bonus info
 * 
 * @package DechBar_App
 * @subpackage Pages/Auth
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChallengeRegistration } from '@/hooks/useChallenge';
import '@/styles/pages/thank-you.css';

export function ThankYouPage() {
  const navigate = useNavigate();
  const { registration, loading, isRegistered } = useChallengeRegistration();
  
  // Redirect if not registered
  useEffect(() => {
    if (!loading && !isRegistered) {
      navigate('/vyzva');
    }
  }, [loading, isRegistered, navigate]);
  
  if (loading || !registration) {
    return null;
  }
  
  const hasSmartTrial = registration.smart_trial_eligible;
  const userName = registration.metadata?.name || 'tam';
  
  return (
    <div className="thank-you-page">
      <div className="thank-you-container">
        {/* Icon */}
        <div className="thank-you-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {/* Header */}
        <div className="thank-you-header">
          <h1 className="thank-you-header__title">
            Jsi registrovaný{userName !== 'tam' && `, ${userName}`}! 🎉
          </h1>
          <p className="thank-you-header__subtitle">
            Těšíme se na tebe ve výzvě
          </p>
        </div>
        
        {/* Timeline */}
        <div className="thank-you-timeline">
          <div className="thank-you-timeline-item">
            <div className="thank-you-timeline-item__icon">📱</div>
            <div className="thank-you-timeline-item__content">
              <h3 className="thank-you-timeline-item__title">26. února 2026</h3>
              <p className="thank-you-timeline-item__text">
                Otevřeme ti přístup do aplikace. Můžeš se seznámit s rozhraním a vyzkoušet cvičení.
              </p>
            </div>
          </div>
          
          <div className="thank-you-timeline-item">
            <div className="thank-you-timeline-item__icon">🚀</div>
            <div className="thank-you-timeline-item__content">
              <h3 className="thank-you-timeline-item__title">1. března 2026</h3>
              <p className="thank-you-timeline-item__text">
                Výzva startuje! 21 dní, které změní tvůj vztah k dechu.
              </p>
            </div>
          </div>
          
          {hasSmartTrial && (
            <div className="thank-you-timeline-item thank-you-timeline-item--highlight">
              <div className="thank-you-timeline-item__icon">✨</div>
              <div className="thank-you-timeline-item__content">
                <h3 className="thank-you-timeline-item__title">SMART Bonus</h3>
                <p className="thank-you-timeline-item__text">
                  Protože jsi se zaregistroval včas, dostáváš SMART tarif <strong>zdarma</strong> po celou dobu výzvy (1.3. - 21.3.)!
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="thank-you-info">
          <p className="thank-you-info__text">
            📧 Na e-mail ti přijde připomenutí <strong>7 dní</strong>, <strong>3 dny</strong> a <strong>1 den</strong> před startem výzvy.
          </p>
        </div>
        
        {/* CTA */}
        <div className="thank-you-cta">
          <button
            className="thank-you-cta__button"
            onClick={() => window.location.href = 'https://zdravedychej.cz'}
          >
            Zpět na web
          </button>
        </div>
      </div>
    </div>
  );
}
