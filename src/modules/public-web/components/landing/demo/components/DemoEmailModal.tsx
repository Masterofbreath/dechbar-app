/**
 * DemoEmailModal - Email Registration Capture
 * 
 * Simple email capture modal after KP measurement.
 * Validates email, displays user's KP result.
 * 
 * Design: Apple premium style, dark glassmorphism, minimal.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { useState } from 'react';
import { Button } from '@/platform/components';
import { CloseButton } from '@/components/shared';
import { useDemoScrollLock } from '../hooks/useDemoScrollLock';

export interface DemoEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  kpValue: number;
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * DemoEmailModal Component
 */
export function DemoEmailModal({
  isOpen,
  onClose,
  onSubmit,
  kpValue,
}: DemoEmailModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  useDemoScrollLock(isOpen);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setError('Zadej svůj e-mail');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Zadej platný e-mail');
      return;
    }
    
    // Clear error and submit
    setError('');
    onSubmit(email);
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(''); // Clear error on input
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <div 
        className="modal-card demo-email-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <CloseButton onClick={onClose} />
        
        {/* Title */}
        <h2 id="email-modal-title" className="modal-card__title">
          Ulož si svůj výsledek
        </h2>
        
        {/* Subtitle */}
        <p className="demo-email-modal__subtitle">
          Vytvoř si účet a sleduj svůj pokrok v aplikaci.
        </p>
        
        {/* KP Result Display */}
        <div className="demo-email-modal__kp-display">
          <span className="kp-label">Tvoje KP:</span>
          <span className="kp-value">{kpValue}s</span>
        </div>
        
        {/* Email Form */}
        <form onSubmit={handleSubmit} className="demo-email-modal__form">
          {/* Email Input */}
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            onKeyPress={handleKeyPress}
            placeholder="tvuj@email.cz"
            className="demo-email-modal__input"
            autoFocus
            aria-label="E-mail"
            aria-invalid={!!error}
            aria-describedby={error ? 'email-error' : undefined}
          />
          
          {/* Error Message */}
          {error && (
            <p id="email-error" className="demo-email-modal__error" role="alert">
              {error}
            </p>
          )}
          
          {/* Submit Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            type="button"
          >
            Vytvořit účet zdarma
          </Button>
        </form>
        
        {/* Privacy Notice */}
        <p className="demo-email-modal__privacy">
          Registrací souhlasíš s{' '}
          <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="demo-email-modal__link">
            GDPR
          </a>
          {' '}a{' '}
          <a href="/obchodni-podminky" target="_blank" rel="noopener noreferrer" className="demo-email-modal__link">
            obchodními podmínkami
          </a>
          {' '}včetně používání souborů Cookie.
        </p>
      </div>
    </div>
  );
}
