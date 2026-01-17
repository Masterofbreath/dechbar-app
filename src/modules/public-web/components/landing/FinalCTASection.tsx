/**
 * FinalCTASection Component
 * 
 * Final conversion section with repeated CTA + FAQ accordion
 * Last chance to convert before footer
 * 
 * Design: Centered CTA card + FAQ below
 * Based on conversion research - repeat CTA with different framing
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/platform';
import { useAuth } from '@/platform/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { FAQ } from './FAQ';
import { MESSAGES } from '@/config/messages';

export function FinalCTASection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  function handleCTA() {
    if (user) {
      // ✅ Přihlášený user → redirect do appky
      navigate('/app');
    } else {
      // ✅ Nepřihlášený user → otevři register modal
      setShowAuthModal(true);
    }
  }

  return (
    <>
      <section className="final-cta-section">
        <div className="final-cta__container">
          {/* CTA Card */}
          <div className="final-cta__card">
            <h2 className="final-cta__headline">
              Připravený na první nádech?
            </h2>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
            >
              {user 
                ? MESSAGES.landing.authenticatedCTA.finalPrimary 
                : MESSAGES.landing.hero.ctaPrimary}
            </Button>
            
            <p className="final-cta__subtext">
              {user 
                ? MESSAGES.landing.authenticatedCTA.finalSubtext 
                : MESSAGES.landing.hero.ctaSubtext}
            </p>
          </div>
          
          {/* FAQ */}
          <div className="final-cta__faq">
            <h3 className="final-cta__faq-title">Často kladené otázky</h3>
            <FAQ />
          </div>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="register"
      />
    </>
  );
}
