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
// import { MESSAGES } from '@/config/messages';

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
          {/* CTA Content - bez karty, čistě */}
          <div className="final-cta__content">
            <h2 className="final-cta__headline">
              Začni dnes a změň svůj dech za 21 dní
            </h2>
            
            <p className="final-cta__description">
              Registrace zdarma. Bez platební karty. Zruš kdykoliv.
            </p>
            
            <Button
              variant="primary"
              size="lg"
              onClick={handleCTA}
            >
              {user ? "Vrať se do appky →" : "Začít zdarma →"}
            </Button>
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
