/**
 * LockedExerciseModal - Conversion-Optimized Registration Modal
 * 
 * Personalized modal per clicked exercise.
 * Google OAuth first (easier), Email secondary.
 * Tone of Voice: Tykání, Imperativ, Dechový vibe.
 * 
 * Design: Apple premium style, dark glassmorphism, minimal.
 * Uses global .modal-card structure for consistency.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/platform/components';
import { useSwipeToDismiss } from '@/platform/hooks';
import { useHaptic } from '@/platform/services/haptic';
import { useDemoScrollLock } from '../hooks/useDemoScrollLock';
import type { Exercise } from '@/shared/exercises/types';

export interface LockedExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  kpMeasurement?: { averageKP: number; attempts: number[] } | null;
  onGoogleAuth: () => void;
  onEmailSubmit: (email: string) => void;
}

/**
 * LockedExerciseModal - Conversion modal with personalized messaging
 * 
 * @example
 * <LockedExerciseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   exercise={selectedExercise}
 *   onGoogleAuth={handleGoogle}
 *   onEmailSubmit={handleEmail}
 * />
 */
export function LockedExerciseModal({
  isOpen,
  onClose,
  exercise,
  kpMeasurement,
  onGoogleAuth,
  onEmailSubmit,
}: LockedExerciseModalProps) {
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { trigger } = useHaptic();
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  useDemoScrollLock(isOpen);
  
  // Swipe to dismiss
  const { handlers, style } = useSwipeToDismiss({ 
    onDismiss: onClose,
    enabled: isOpen
  });
  
  // Trigger haptic when modal opens
  useEffect(() => {
    if (isOpen) {
      trigger('medium');
    }
  }, [isOpen, trigger]);
  
  // Focus email input without scrolling when email form appears
  useEffect(() => {
    if (showEmailForm && emailInputRef.current) {
      // Delay focus slightly to ensure modal is fully rendered
      setTimeout(() => {
        emailInputRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [showEmailForm]);
  
  if (!isOpen) return null;
  
  // KP Conversion variant (no exercise, only KP data)
  if (kpMeasurement && !exercise) {
    const { averageKP } = kpMeasurement;
    
    return (
      <div 
        className="modal-overlay" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kp-conversion-title"
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()} {...handlers} style={style}>
          {/* Close button */}
          <button 
            className="modal-close" 
            onClick={onClose} 
            type="button" 
            aria-label="Zavřít modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6l12 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round"
              />
            </svg>
          </button>
          
          {/* KP Conversion Content */}
          <h2 className="locked-exercise-modal__title" id="kp-conversion-title">
            Uložit měření a pokračovat
          </h2>
          
          <p className="locked-exercise-modal__subtitle">
            Tvoje KP: <strong style={{ color: 'var(--color-primary)' }}>{averageKP}s</strong>. Zaregistruj se a sleduj svůj pokrok.
          </p>
          
          {!showEmailForm ? (
            <>
              {/* Google CTA (primary) */}
              <button 
                type="button"
                onClick={onGoogleAuth} 
                className="locked-exercise-modal__google-btn"
                aria-label="Uložit a registrovat se přes Google"
              >
                <img 
                  src="/oauth-icons/google.svg" 
                  alt="Google" 
                  width="24" 
                  height="24"
                  className="locked-exercise-modal__google-icon"
                />
                Uložit a registrovat se
              </button>
              
              {/* Email toggle */}
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="locked-exercise-modal__email-toggle"
              >
                Nebo pokračuj s emailem
              </button>
            </>
          ) : (
            <>
              {/* Back to Google */}
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="locked-exercise-modal__back-btn"
                aria-label="Zpět na Google registraci"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Zpět na Google registraci
              </button>
              
              {/* Email form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) onEmailSubmit(email);
                }}
                className="locked-exercise-modal__email-form"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tvuj@email.cz"
                  required
                  className="locked-exercise-modal__email-input"
                  aria-label="Email adresa"
                />
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Uložit a začít cvičit →
                </Button>
              </form>
            </>
          )}
          
          {/* Trust signals */}
          <p className="locked-exercise-modal__trust">
            Zdarma • Bez závazků • 1150+ členů
          </p>
        </div>
      </div>
    );
  }
  
  // Exercise conversion variant (original)
  if (!exercise) return null;
  
  // Special case for SMART exercise
  const isSmartExercise = exercise.id === 'smart-demo';
  const headline = isSmartExercise 
    ? 'SMART CVIČENÍ potřebuje SMART tarif'
    : 'Cvičení je připraveno';
  
  const subtitle = isSmartExercise
    ? 'Personalizované cvičení na základě tvého pokroku. Začni dnes. Upgraduj kdykoliv.'
    : 'Zaregistruj se a můžeš začít.';
  
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="locked-exercise-title"
    >
      {/* ✅ Global .modal-card structure for consistency */}
      <div className="modal-card" onClick={(e) => e.stopPropagation()} {...handlers} style={style}>
        {/* Close button - global positioning */}
        <button 
          className="modal-close" 
          onClick={onClose} 
          type="button" 
          aria-label="Zavřít modal"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M18 6L6 18M6 6l12 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        
        {/* Header - global structure */}
        <div className="modal-header">
          <h2 id="locked-exercise-title" className="modal-title">
            {headline}
          </h2>
          
          <p className="modal-subtitle">
            {subtitle}
          </p>
        </div>
        
        {/* Content - custom wrapper for CTAs */}
        <div className="locked-exercise-modal__content">
          {/* Primary CTA: Google OAuth with logo */}
          {!showEmailForm && (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onGoogleAuth}
                className="locked-exercise-modal__google-btn"
              >
                <img 
                  src="/assets/images/icons/oauth/google.svg" 
                  alt=""
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
                <span>Registruj se přes Google</span>
              </Button>
              
              <button
                className="locked-exercise-modal__email-toggle"
                onClick={() => setShowEmailForm(true)}
                type="button"
              >
                Nebo pokračuj s emailem
              </button>
            </>
          )}
          
          {/* Secondary: Email form */}
          {showEmailForm && (
            <>
              <button
                className="locked-exercise-modal__back-button"
                onClick={() => {
                  trigger('light');
                  setShowEmailForm(false);
                }}
                type="button"
              >
                ← Zpět na Google registraci
              </button>
              
              <form
                className="locked-exercise-modal__email-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) {
                    onEmailSubmit(email);
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="tvuj@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="locked-exercise-modal__email-input"
                  required
                  ref={emailInputRef}
                />
                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  type="submit"
                >
                  Začít cvičit →
                </Button>
              </form>
            </>
          )}
        </div>
        
        {/* Trust signals - Clean bulletpoints (Apple-style) */}
        <p className="locked-exercise-modal__trust">
          Zdarma • Bez závazků • 1150+ členů
        </p>
      </div>
    </div>
  );
}
