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
import { AuthModal } from '@/components/auth/AuthModal';

export function Header() {
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

          {/* Auth actions */}
          <nav className="landing-header__actions">
            <Button 
              variant="ghost" 
              size="md"
              onClick={openLoginModal}
            >
              Přihlásit
            </Button>
            <Button 
              variant="primary" 
              size="md"
              onClick={openRegisterModal}
            >
              Začít zdarma
            </Button>
          </nav>
        </div>
      </header>

      {/* Reuse existing AuthModal component */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authView}
      />
    </>
  );
}
