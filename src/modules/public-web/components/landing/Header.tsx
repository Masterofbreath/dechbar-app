/**
 * Header Component
 * 
 * Sticky header with glassmorphism effect on scroll
 * Logo + Auth CTAs (Přihlásit, Začít zdarma)
 * 
 * Design: Transparent → glassmorphism on scroll (Visual Brand Book)
 * Z-index: 1000 (above content, below modals)
 * 
 * @package DechBar_App
 * @subpackage Modules/PublicWeb
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo, Button } from '@/platform';
import { useAuth } from '@/platform/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import { MESSAGES } from '@/config/messages';

export function Header() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();

  // Scroll listener for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function openLoginModal() {
    setAuthView('login');
    setShowAuthModal(true);
  }

  function openRegisterModal() {
    setAuthView('register');
    setShowAuthModal(true);
  }

  return (
    <>
      <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
        <div className="landing-header__container">
          {/* Logo - clickable, navigates to home */}
          <Logo 
            variant="off-white" 
            onClick={() => navigate('/')}
          />

          {/* Conditional Auth actions based on user state */}
          <nav className="landing-header__actions">
            {user ? (
              // AUTHENTICATED: Personalized CTAs
              <>
                <Button 
                  variant="ghost" 
                  size="md"
                  onClick={() => navigate('/app/profile')}
                >
                  {user.vocative_name || MESSAGES.header.authenticatedProfileFallback}
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={() => navigate('/app')}
                >
                  {MESSAGES.header.authenticatedPrimaryCTA}
                </Button>
              </>
            ) : (
              // UNAUTHENTICATED: Login/Register CTAs
              <>
                <Button 
                  variant="ghost" 
                  size="md"
                  onClick={openLoginModal}
                >
                  {MESSAGES.header.loginCTA}
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={openRegisterModal}
                >
                  {MESSAGES.header.registerCTA}
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* AuthModal only shown when unauthenticated */}
      {!user && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultView={authView}
        />
      )}
    </>
  );
}
