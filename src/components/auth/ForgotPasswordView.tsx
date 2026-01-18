/**
 * ForgotPasswordView Component
 * 
 * Password reset form view for AuthModal
 * Design inspired by WordPress zdravedychej-public modal views
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/platform/auth';
import { Button, Input, TextLink } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

interface ForgotPasswordViewProps {
  onSwitchToLogin: () => void;
  onSuccessStateChange?: (isSuccess: boolean) => void;
}

export function ForgotPasswordView({ onSwitchToLogin, onSuccessStateChange }: ForgotPasswordViewProps) {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ✅ Notify parent about success state
  useEffect(() => {
    if (onSuccessStateChange) {
      onSuccessStateChange(isSuccess);
    }
  }, [isSuccess, onSuccessStateChange]);

  // ✅ Keyboard shortcut: Cmd/Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); // Prevent default browser behavior
        
        // Only submit if form is not already loading and success screen is not shown
        if (!isLoading && !isSuccess) {
          formRef.current?.requestSubmit(); // Triggers validation + onSubmit handler
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, isSuccess]);

  // ✅ COUNTDOWN TIMER pro rate limit
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) {
      if (rateLimitSeconds === 0) {
        setFormError('');
        setRateLimitSeconds(null);
      }
      return;
    }
    
    const timer = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!email) {
      setFormError(MESSAGES.error.requiredFields);
      return;
    }

    if (!email.includes('@')) {
      setFormError(MESSAGES.error.invalidEmail);
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email);
      
      // Success
      setIsSuccess(true);
      
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Map Supabase errors to Czech
      const errorMessage = err.message || MESSAGES.error.passwordResetFailed;
      
      // ✅ PARSOVAT DYNAMICKÝ ČAS ZE SUPABASE + COUNTDOWN
      if (errorMessage.includes('For security purposes') || errorMessage.includes('Email rate limit')) {
        const secondsMatch = errorMessage.match(/(\d+)\s+seconds?/);
        const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60;
        
        setRateLimitSeconds(seconds);
        setFormError(`Z bezpečnostních důvodů můžeš poslat další email až za ${seconds} sekund.`);
      } else if (errorMessage.includes('Unable to validate email')) {
        setFormError(MESSAGES.error.invalidEmail);
      } else if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        setFormError(MESSAGES.error.tooManyRequests);
      } else if (errorMessage.includes('User not found')) {
        // Security: Nezobrazujeme, že email neexistuje (security best practice)
        setIsSuccess(true);
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="auth-view">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">E-mail poslán</h2>
        </div>

        {/* Email Display (Gold) */}
        <p className="success-email-display">{email}</p>

        {/* Instruction (Teal) */}
        <p className="success-instruction">Dýchej s námi.</p>

        {/* Close Button */}
        <div className="modal-footer">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onSwitchToLogin}
          >
            Zavřít
          </Button>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="auth-view">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {MESSAGES.auth.forgotPasswordTitle}
          </h2>
          <p className="modal-subtitle">
            {MESSAGES.auth.forgotPasswordSubtitle}
          </p>
        </div>

      {/* Reset Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="auth-form" noValidate>
        
        {/* Email */}
        <Input
          type="email"
          label={MESSAGES.form.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={MESSAGES.form.placeholders.email}
          autoFocus
          required
          disabled={isLoading}
          helperText={MESSAGES.hints.emailHelper}
        />

        {/* Error Message - dynamický countdown pro rate limit */}
        {formError && (
          <ErrorMessage 
            message={
              rateLimitSeconds !== null && rateLimitSeconds > 0
                ? `Z bezpečnostních důvodů můžeš poslat další email až za ${rateLimitSeconds} sekund.`
                : formError
            } 
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? MESSAGES.buttons.loading.sending : MESSAGES.buttons.sendResetLink}
        </Button>
      </form>

      {/* Login Link */}
      <div className="modal-footer">
        <p className="modal-footer-text">
          {MESSAGES.auth.knowPassword}{' '}
          <TextLink onClick={onSwitchToLogin} bold>
            Přihlaš se
          </TextLink>
        </p>
      </div>
    </div>
  );
}
