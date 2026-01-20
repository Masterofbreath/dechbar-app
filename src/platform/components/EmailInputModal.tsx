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

import { useState, FormEvent } from 'react';
import { Button } from './Button';

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
    } catch (err: any) {
      setError(err.message || 'Něco se pokazilo. Zkus to znovu.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - using global modal-close class */}
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Zavřít"
          type="button"
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

        {/* Header - using global modal-header */}
        <div className="modal-header">
          <h2 className="modal-title">
            Začni dýchat s námi
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="email-modal-form">
          <div className="email-modal-input-wrapper">
            <input
              type="email"
              placeholder="tvuj@email.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`email-modal-input ${error ? 'email-modal-input--error' : ''}`}
              autoFocus
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
        </form>

        {/* Footer - using global modal-footer */}
        <div className="modal-footer">
          <p className="modal-footer-text">
            Po platbě ti pošleme přihlašovací odkaz emailem.
          </p>
        </div>
      </div>
    </div>
  );
}
