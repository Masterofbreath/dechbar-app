/**
 * EmailInputModal - Guest Checkout Email Collection
 * 
 * Minimalistic Apple-style modal for collecting email from guest users.
 * Uses global modal styles for consistency across the app.
 * 
 * Design: Dark elevated surface, glassmorphism, breathing animation
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 */

import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { CloseButton } from '@/components/shared';
import { useSwipeToDismiss } from '@/platform/hooks';

export interface EmailInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

export function EmailInputModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading 
}: EmailInputModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  // Swipe to dismiss
  const { handlers, style } = useSwipeToDismiss({ 
    onDismiss: onClose,
    enabled: isOpen
  });

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Zadej svůj email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Zadej platný email');
      return;
    }

    try {
      await onSubmit(email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo. Zkus to znovu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        {...handlers}
        style={style}
      >
        <CloseButton onClick={onClose} />

        {/* Header - using global modal-header */}
        <div className="modal-header">
          <h2 className="modal-title">
            Vstup do programu
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="email-modal-form">
          <div className="email-modal-input-wrapper">
            <input
              type="email"
              placeholder="tvuj@email.cz"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              className={`email-modal-input ${error ? 'email-modal-input--error' : ''}`}
              autoFocus={window.innerWidth > 768}
              autoComplete="email"
              disabled={isLoading}
            />
            {error && (
              <p className="email-modal-error">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            className="email-modal-submit"
          >
            Pokračuj na platbu →
          </Button>

          <p className="gdpr-notice">
            Pokračováním souhlasíš s{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">
              obchodními podmínkami
            </a>
            {' '}a{' '}
            <a href="/gdpr" target="_blank" rel="noopener noreferrer">
              ochranou osobních údajů
            </a>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
