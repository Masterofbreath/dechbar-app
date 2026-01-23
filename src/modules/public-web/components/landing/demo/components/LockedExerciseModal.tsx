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

import { useState, useEffect } from 'react';
import { Button } from '@/platform/components';
import { useScrollLock, useSwipeToDismiss } from '@/platform/hooks';
import { useHaptic } from '@/platform/services/haptic';
import type { Exercise } from '@/shared/exercises/types';

export interface LockedExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
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
  onGoogleAuth,
  onEmailSubmit,
}: LockedExerciseModalProps) {
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const { trigger } = useHaptic();
  
  useScrollLock(isOpen);
  
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
  
  if (!isOpen || !exercise) return null;
  
  // Personalized exercise adjective
  const exerciseAdjective = {
    'rano': 'Ranní',
    'reset': 'Resetující',
    'noc': 'Večerní',
    'box': 'Box Breathing',
    'calm': 'Uklidňující',
    'coherence': 'Harmonizující',
    'smart-demo': 'SMART' // For demo SMART exercise
  }[exercise.id] || exercise.name;
  
  // Special headline for SMART exercise
  const isSmartExercise = exercise.id === 'smart-demo';
  const headline = isSmartExercise 
    ? 'SMART CVIČENÍ potřebuje SMART tarif'
    : `${exerciseAdjective} cvičení je připraveno`;
  
  const subtitle = isSmartExercise
    ? 'Personalizované cvičení na základě tvého pokroku. Začni dnes. Upgraduj kdykoliv.'
    : 'Stačí ti tří kliky.';
  
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
                  width="20"
                  height="20"
                  aria-hidden="true"
                />
                <span>Registruj se přes Google</span>
              </Button>
              
              <button
                className="locked-exercise-modal__email-toggle"
                onClick={() => setShowEmailForm(true)}
                type="button"
              >
                Nebo zadej email
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
                  autoFocus
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
        
        {/* Trust signals - NO EMOJI, premium text */}
        <p className="locked-exercise-modal__trust">
          Registrace za 30 sekund • uvnitř 1150+ členů
        </p>
      </div>
    </div>
  );
}
