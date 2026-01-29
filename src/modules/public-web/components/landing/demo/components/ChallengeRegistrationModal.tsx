/**
 * ChallengeRegistrationModal - Simplified Registration for Challenge Landing Page
 * 
 * Used on /vyzva page when user clicks on exercise or completes KP measurement.
 * Email-only registration focused on challenge conversion.
 * 
 * Design: Reuses DemoEmailModal styling for consistency with homepage mockup.
 * 
 * Flow:
 * - With KP: "Vstup do výzvy" + KP result display
 * - Without KP: "Získej přístup" + challenge invitation
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { useState } from 'react';
import { Button } from '@/platform/components';
import { CloseButton } from '@/components/shared';
import { useDemoScrollLock } from '../hooks/useDemoScrollLock';
import type { Exercise } from '@/shared/exercises/types';

export interface ChallengeRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onSubmit: (email: string) => void;
  kpMeasurement?: { averageKP: number; attempts: number[] } | null;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Validate email format
 */
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * ChallengeRegistrationModal Component
 * 
 * @example
 * <ChallengeRegistrationModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   exercise={selectedExercise}
 *   onSubmit={handleChallengeRegistration}
 *   kpMeasurement={kpData} // Optional
 * />
 */
export function ChallengeRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  kpMeasurement,
  successMessage = '',
  errorMessage = '',
}: ChallengeRegistrationModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  useDemoScrollLock(isOpen);
  
  if (!isOpen) return null;
  
  // Determine if user has measured KP
  const hasKPResult = kpMeasurement && kpMeasurement.averageKP > 0;
  
  // Conditional text based on KP measurement
  const title = hasKPResult ? 'Vstup do výzvy' : 'Získej přístup';
  const subtitle = hasKPResult
    ? 'Registruj se do výzvy a změň své ráno.'
    : 'Zaregistruj se do 21denní výzvy zdarma';
  
  const contextMessage = kpMeasurement && kpMeasurement.attempts.length === 1
    ? 'Výsledek z jednoho měření'
    : 'Průměr ze tří měření';
  
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
      aria-labelledby="challenge-modal-title"
    >
      <div 
        className="modal-card demo-email-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <CloseButton onClick={onClose} />
        
        {/* Success State - Prioritize over normal form */}
        {successMessage ? (
          <div className="demo-email-modal__success">
            <div className="success-icon">✓</div>
            <h2 className="success-email-display">{email}</h2>
            <p className="success-instruction">{successMessage}</p>
            
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onClose}
              style={{ marginTop: '1.5rem' }}
            >
              Rozumím
            </Button>
          </div>
        ) : (
          <>
            {/* Title - Conditional based on KP */}
            <h2 id="challenge-modal-title" className="modal-card__title">
              {title}
            </h2>
            
            {/* Subtitle - Conditional based on KP */}
            <p className="demo-email-modal__subtitle">
              {subtitle}
            </p>
            
            {/* KP Result Display - Only if measured */}
            {hasKPResult && (
              <div className="demo-email-modal__kp-display">
                <span className="kp-value">{kpMeasurement.averageKP}s</span>
                <span className="kp-context">{contextMessage}</span>
              </div>
            )}
            
            {/* Email Form - Same styling as homepage */}
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
              {(error || errorMessage) && (
                <p id="email-error" className="demo-email-modal__error" role="alert">
                  {error || errorMessage}
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
                Vstoupit do výzvy
              </Button>
            </form>
            
            {/* Privacy Notice */}
            <p className="demo-email-modal__privacy">
              Registrací souhlasíš s{' '}
              <a 
                href="/obchodni-podminky" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="demo-email-modal__link"
              >
                obchodními podmínkami
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
