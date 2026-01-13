/**
 * RegisterView Component
 * 
 * Ultra-simple registration form - just email + GDPR
 * Passwordless registration with magic link (OAuth ready for future)
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Input, TextLink, Checkbox } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';
import { useAuth } from '@/platform/auth';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
}

export function RegisterView({ onSwitchToLogin, onSuccess }: RegisterViewProps) {
  const { signUpWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

    if (!gdprConsent) {
      setFormError(MESSAGES.error.gdprRequired);
      return;
    }

    try {
      setIsLoading(true);
      
      // ✅ IMPLEMENTOVÁNO: Magic Link registrace
      await signUpWithMagicLink(email, {
        gdprConsent,
        emailRedirectTo: `${window.location.origin}/dashboard`
      });
      
      console.log('✅ Magic link sent to:', email);
      
      setEmailSent(true);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      console.error('Register error:', err);
      
      const errorMessage = err.message || MESSAGES.error.registrationFailed;
      
      if (errorMessage.includes('Unable to validate email')) {
        setFormError(MESSAGES.error.invalidEmailRegister);
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Success view - email byl odeslán
  if (emailSent) {
    return (
      <div className="auth-view">
        <div className="modal-header text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="modal-title">
            {MESSAGES.auth.emailSentTitle}
          </h2>
          <p className="modal-subtitle mb-2">
            {MESSAGES.auth.emailSentSubtitle}
          </p>
          <p className="text-lg font-semibold text-[#F8CA00] mb-4">
            {email}
          </p>
          <p className="text-gray-600 mb-4">
            {MESSAGES.auth.emailSentInstruction}
          </p>
          <p className="text-sm text-gray-500">
            {MESSAGES.auth.emailSentSpamHint}
          </p>
        </div>

        <div className="space-y-3 mt-6">
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
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        
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

        {/* GDPR Consent */}
        <Checkbox
          label={
            <>
              Souhlasím s{' '}
              <a href="/gdpr" target="_blank" rel="noopener noreferrer" className="text-[#F8CA00] hover:underline">
                GDPR
              </a>
              {' '}a{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#F8CA00] hover:underline">
                obchodními podmínkami
              </a>
              <span className="text-[#ef4444] ml-1">*</span>
            </>
          }
          checked={gdprConsent}
          onChange={(e) => setGdprConsent(e.target.checked)}
          required
        />

        {/* Error Message */}
        {formError && (
          <ErrorMessage message={formError} />
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

      {/* OAuth Buttons - připravené pro budoucnost (disabled) */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">nebo</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {/* Google - připraveno (disabled) */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🔵</span>
              <span>Pokračovat s Google</span>
              <span className="text-xs text-gray-400">(brzy)</span>
            </span>
          </Button>

          {/* Apple - připraveno (disabled) */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🍎</span>
              <span>Pokračovat s Apple</span>
              <span className="text-xs text-gray-400">(brzy)</span>
            </span>
          </Button>

          {/* Facebook - připraveno (disabled) */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            disabled
            className="opacity-50 cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">📘</span>
              <span>Pokračovat s Facebook</span>
              <span className="text-xs text-gray-400">(brzy)</span>
            </span>
          </Button>
        </div>
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
