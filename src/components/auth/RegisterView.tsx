/**
 * RegisterView Component
 * 
 * Ultra-simple registration form - just email + GDPR
 * Passwordless registration with magic link (OAuth ready for future)
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Button, Input, TextLink } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';
import { useAuth } from '@/platform/auth';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
  onSuccessStateChange?: (isSuccess: boolean) => void;
}

export function RegisterView({ onSwitchToLogin, onSuccess, onSuccessStateChange }: RegisterViewProps) {
  const { signUpWithMagicLink, signInWithOAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // ✅ Notify parent about success state
  useEffect(() => {
    if (onSuccessStateChange) {
      onSuccessStateChange(emailSent);
    }
  }, [emailSent, onSuccessStateChange]);

  // ✅ Keyboard shortcut: Cmd/Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); // Prevent default browser behavior
        
        // Only submit if form is not already loading and success screen is not shown
        if (!isLoading && !emailSent) {
          formRef.current?.requestSubmit(); // Triggers validation + onSubmit handler
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, emailSent]);

  // ✅ COUNTDOWN TIMER pro rate limit (pouze pro error message)
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) {
      // Když countdown skončí, vyčisti error
      if (rateLimitSeconds === 0) {
        setFormError('');
        setRateLimitSeconds(null);
      }
      return;
    }
    
    const timer = setInterval(() => {
      setRateLimitSeconds(prev => {
        if (prev === null || prev <= 1) {
          return 0; // Spustí cleanup výše
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  async function handleOAuthSignIn(provider: 'google' | 'apple' | 'facebook') {
    try {
      setFormError('');
      
      // ✅ Implicit consent: User consents by clicking OAuth button
      // Backend will automatically store gdpr_consent: true in authStore.ts
      
      await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}/app`
      });
    } catch (err: any) {
      console.error(`OAuth ${provider} error:`, err);
      setFormError(MESSAGES.error.oauthFailed);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!email) {
      setFormError(MESSAGES.error.requiredFields);
      return;
    }

    if (!email.includes('@')) {
      setFormError(MESSAGES.error.invalidEmailRegister);
      return;
    }

    // ✅ Implicit consent: User consents by submitting the form
    // Backend will automatically store gdpr_consent: true in authStore.ts

    try {
      setIsLoading(true);
      
      // ✅ Magic Link registration (implicit GDPR consent)
      await signUpWithMagicLink(email, {
        gdprConsent: true,
        emailRedirectTo: `${window.location.origin}/app`
      });
      
      console.log('✅ Magic link sent to:', email);
      
      setEmailSent(true);
      // ✅ onSuccess() se zavolá až při kliknutí na "Zavřít" v success view
      
    } catch (err: any) {
      console.error('Register error:', err);
      
      const errorMessage = err.message || MESSAGES.error.registrationFailed;
      
      // ✅ PARSOVAT DYNAMICKÝ ČAS ZE SUPABASE + COUNTDOWN
      if (errorMessage.includes('For security purposes') || errorMessage.includes('Email rate limit')) {
        // Extract seconds: "...after 45 seconds" → 45
        const secondsMatch = errorMessage.match(/(\d+)\s+seconds?/);
        const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 60;
        
        // Spusť countdown timer
        setRateLimitSeconds(seconds);
        setFormError(`Z bezpečnostních důvodů můžeš poslat další email až za ${seconds} sekund.`);
      } else if (errorMessage.includes('Unable to validate email')) {
        setFormError(MESSAGES.error.invalidEmailRegister);
      } else if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        setFormError(MESSAGES.error.tooManyRequests);
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ✅ SUCCESS VIEW - Apple "Méně je více" (3 prvky: Title + Email + Instruction)
  if (emailSent) {
    return (
      <div className="auth-view">
        <div className="modal-header">
          <h2 className="modal-title">
            {MESSAGES.auth.emailSentTitle}
          </h2>
          
          <p className="success-email-display">
            {email}
          </p>
          
          <p className="success-instruction">
            {MESSAGES.auth.emailSentInstruction}
          </p>
        </div>

        <div className="space-y-3 mt-6">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              onSwitchToLogin();
              if (onSuccess) {
                onSuccess();
              }
            }}
          >
            Zavřít
          </Button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="auth-view">
      {/* Header */}
      <div className="modal-header">
        <h2 className="modal-title">
          {MESSAGES.auth.registerTitle}
        </h2>
        <p className="modal-subtitle">
          {MESSAGES.auth.registerSubtitle}
        </p>
      </div>

      {/* Register Form */}
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
          {isLoading ? MESSAGES.buttons.loading.sendingEmail : MESSAGES.buttons.continueWithEmail}
        </Button>
      </form>

      {/* OAuth Icons - Premium Minimal (Stripe/Notion style) */}
      <div className="mt-6">
        {/* Divider with imperativ "nebo pokračuj s" */}
        <div className="auth-divider">
          <span>{MESSAGES.auth.oauthDivider}</span>
        </div>

        {/* OAuth icons - small, side by side */}
        <div className="oauth-icons">
          {/* Google - ENABLED */}
          <button
            type="button"
            className="oauth-icon-button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            aria-label="Pokračovat s Google"
          >
            <img 
              src="/assets/images/icons/oauth/google.svg" 
              alt=""
              aria-hidden="true"
            />
          </button>

          {/* Facebook - DISABLED (připraveno) */}
          <button
            type="button"
            className="oauth-icon-button"
            disabled
            aria-label="Pokračovat s Facebook (brzy dostupné)"
          >
            <img 
              src="/assets/images/icons/oauth/facebook.svg" 
              alt=""
              aria-hidden="true"
            />
          </button>

          {/* Apple - DISABLED (připraveno) */}
          <button
            type="button"
            className="oauth-icon-button"
            disabled
            aria-label="Pokračovat s Apple (brzy dostupné)"
          >
            <img 
              src="/assets/images/icons/oauth/apple.svg" 
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>

        {/* GDPR Notice - Informational text (VARIANTA A: below OAuth) */}
        <p className="gdpr-notice">
          Registrací souhlasíš s{' '}
          <a href="/gdpr" target="_blank" rel="noopener noreferrer">
            GDPR
          </a>
          {' '}a{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer">
            obchodními podmínkami
          </a>
          {' '}včetně používání souborů Cookie.
        </p>
      </div>

      {/* Login Link */}
      <div className="modal-footer">
        <p className="modal-footer-text">
          {MESSAGES.auth.alreadyHaveAccount}{' '}
          <TextLink onClick={onSwitchToLogin} bold>
            Přihlaš se
          </TextLink>
        </p>
      </div>
    </div>
  );
}
