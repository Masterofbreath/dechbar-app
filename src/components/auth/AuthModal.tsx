/**
 * AuthModal Component
 * 
 * Modal container with view switching (Login/Register/Reset)
 * Design inspired by WordPress dechbar-game liquid glass modal
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState, useEffect } from 'react';
import { LoginView } from './LoginView';
import { RegisterView } from './RegisterView';
import { ForgotPasswordView } from './ForgotPasswordView';
import { CloseButton } from '@/components/shared/CloseButton';
import { Logo } from '@/platform';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'register' | 'reset';
}

type AuthView = 'login' | 'register' | 'reset';

export function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  const [isClosing, setIsClosing] = useState(false);
  const [isSuccessState, setIsSuccessState] = useState(false);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView(defaultView);
      setIsSuccessState(false);
    }
  }, [isOpen, defaultView]);

  // ESC key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function switchView(view: AuthView) {
    console.log(`Switching to ${view} view`);
    setCurrentView(view);
  }

  async function handleSuccess() {
    setIsClosing(true);  // Start fade-out animation
    await new Promise(resolve => setTimeout(resolve, 400));  // Wait for fade-out
    onClose();
    setIsClosing(false);
  }

  // ✅ Close modal when clicking outside (on overlay, not on modal-card)
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className={`modal-overlay ${isClosing ? 'modal-overlay--fading-out' : ''}`}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal card with liquid glass effect + success variant */}
      <div className={`modal-card ${isSuccessState ? 'modal-card--success' : ''}`}>
        {/* Close button */}
        <CloseButton onClick={onClose} />

        {/* Logo */}
        <div className="modal-logo">
          <Logo variant="off-white" />
        </div>

        {/* View content */}
        <div className="auth-view">
          {currentView === 'login' && (
            <LoginView
              onSwitchToRegister={() => switchView('register')}
              onSwitchToReset={() => switchView('reset')}
              onSuccess={handleSuccess}
            />
          )}

          {currentView === 'register' && (
            <RegisterView
              onSwitchToLogin={() => switchView('login')}
              onSuccess={handleSuccess}
              onSuccessStateChange={setIsSuccessState}
            />
          )}

          {currentView === 'reset' && (
            <ForgotPasswordView
              onSwitchToLogin={() => switchView('login')}
              onSuccessStateChange={setIsSuccessState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
