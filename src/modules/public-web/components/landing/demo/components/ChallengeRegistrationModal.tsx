/**
 * ChallengeRegistrationModal - Simplified Registration for Challenge Landing Page
 * 
 * Used on /vyzva page when user clicks on locked exercise.
 * Email-only registration (no Google OAuth) focused on challenge conversion.
 * 
 * Design: Minimal, focused CTA, emphasizes challenge value prop.
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
}

/**
 * ChallengeRegistrationModal - Email registration for challenge
 * 
 * @example
 * <ChallengeRegistrationModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   exercise={selectedExercise}
 *   onSubmit={handleChallengeRegistration}
 * />
 */
export function ChallengeRegistrationModal({
  isOpen,
  onClose,
  exercise,
  onSubmit,
  kpMeasurement,
}: ChallengeRegistrationModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  useDemoScrollLock(isOpen);
  
  if (!isOpen || !exercise) return null;
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Zadej prosím platný email');
      return;
    }
    
    setError('');
    onSubmit(email);
  };
  
  // Show KP result if available
  const hasKPResult = kpMeasurement && kpMeasurement.averageKP > 0;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card challenge-registration-modal" 
        onClick={e => e.stopPropagation()}
      >
        <CloseButton onClick={onClose} />
        
        {/* Exercise context */}
        <div className="challenge-registration-modal__header">
          <h2 className="challenge-registration-modal__title">
            Získej přístup k {exercise.name}
          </h2>
          <p className="challenge-registration-modal__subtitle">
            Zaregistruj se do 21denní výzvy zdarma
          </p>
        </div>
        
        {/* KP Result Display (if measured) */}
        {hasKPResult && (
          <div className="challenge-registration-modal__kp-result">
            <span className="kp-label">Tvoje KP:</span>
            <span className="kp-value">{kpMeasurement.averageKP}s</span>
            <span className="kp-context">
              {kpMeasurement.attempts.length === 1 
                ? 'Výsledek z jednoho měření' 
                : 'Průměr ze tří měření'}
            </span>
          </div>
        )}
        
        {/* Challenge benefits */}
        <div className="challenge-registration-modal__benefits">
          <p className="benefit-item">✓ 21 dní komplexního dechového tréninku</p>
          <p className="benefit-item">✓ Denní cvičení s audio guidancí</p>
          <p className="benefit-item">✓ Sledování pokroku KP</p>
          <p className="benefit-item">✓ Přístup k {exercise.name} ihned</p>
        </div>
        
        {/* Email form */}
        <form onSubmit={handleSubmit} className="challenge-registration-modal__form">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(''); // Clear error on type
            }}
            placeholder="tvuj@email.cz"
            className={`email-input ${error ? 'email-input--error' : ''}`}
            autoFocus
          />
          
          {error && (
            <p className="error-message">{error}</p>
          )}
          
          <Button 
            variant="primary" 
            size="large"
            onClick={handleSubmit}
            className="submit-button"
          >
            Registrovat do výzvy →
          </Button>
        </form>
        
        {/* Legal notice */}
        <p className="challenge-registration-modal__legal">
          Registrací souhlasíš s{' '}
          <a 
            href="/obchodni-podminky" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            obchodními podmínkami
          </a>
          .
        </p>
      </div>
    </div>
  );
}
