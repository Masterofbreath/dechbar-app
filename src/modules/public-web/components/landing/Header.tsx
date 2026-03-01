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
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Logo, Button } from '@/platform';
import { useAuth } from '@/platform/auth';
import { AuthModal } from '@/components/auth/AuthModal';
import type { AuthModalProps } from '@/components/auth/AuthModal';
import { MESSAGES } from '@/config/messages';

export function Header() {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Derive initial modal state from URL params at render time (no useEffect needed)
  // /?returnTo=%2Fapp  → auto-open login, remember returnTo for post-login redirect
  // /?openAuth=reset   → auto-open forgot-password view
  // /?openAuth=register → auto-open register view
  const urlReturnTo = searchParams.get('returnTo') || undefined;
  const urlOpenAuth = searchParams.get('openAuth');
  const hasAuthParams = !!(urlReturnTo || urlOpenAuth);

  function resolveView(): AuthModalProps['defaultView'] {
    if (urlOpenAuth === 'reset') return 'reset';
    if (urlOpenAuth === 'register') return 'register';
    return 'login';
  }

  const [showAuthModal, setShowAuthModal] = useState(() => hasAuthParams && !user);
  const [authView, setAuthView] = useState<AuthModalProps['defaultView']>(resolveView);
  const [returnTo, setReturnTo] = useState<string | undefined>(urlReturnTo);

  // Scroll listener for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function openLoginModal() {
    setReturnTo(undefined);
    setAuthView('login');
    setShowAuthModal(true);
  }

  function openRegisterModal() {
    setReturnTo(undefined);
    setAuthView('register');
    setShowAuthModal(true);
  }

  return (
    <>
      <header 
        className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}
      >
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
                  onClick={() => navigate('/muj-ucet')}
                  className="landing-header__profile-btn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Tvůj profil
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
          onClose={() => {
            setShowAuthModal(false);
            // Clean URL params after modal is closed without login
            if (searchParams.get('returnTo') || searchParams.get('openAuth')) {
              navigate('/', { replace: true });
            }
          }}
          defaultView={authView}
          returnTo={returnTo}
        />
      )}
    </>
  );
}
