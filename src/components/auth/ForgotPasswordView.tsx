/**
 * ForgotPasswordView Component
 * 
 * Password reset form view for AuthModal
 * Design inspired by WordPress zdravedychej-public modal views
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/platform/auth';
import { Button, Input, TextLink } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

interface ForgotPasswordViewProps {
  onSwitchToLogin: () => void;
}

export function ForgotPasswordView({ onSwitchToLogin }: ForgotPasswordViewProps) {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
      
      if (errorMessage.includes('Unable to validate email')) {
        setFormError(MESSAGES.error.invalidEmail);
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
          <h2 className="modal-title">
            ✉️ Email odeslán!
          </h2>
          <p className="modal-subtitle">
            Zkontrolujte svou emailovou schránku
          </p>
        </div>

        {/* Success message */}
        <ErrorMessage 
          variant="success"
          message={MESSAGES.success.passwordResetSent.replace('Pokud existuje účet s tímto emailem', `Pokud existuje účet s emailem ${email}`)}
          className="mb-6"
        />

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">
            <strong>Co dál?</strong>
          </p>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Zkontrolujte svou emailovou schránku</li>
            <li>Otevřete email od DechBar</li>
            <li>Klikněte na odkaz pro obnovení hesla</li>
            <li>Nastavte si nové heslo</li>
          </ol>
          <p className="text-xs text-gray-500 mt-4">
            💡 Pokud email nevidíte, zkontrolujte složku SPAM
          </p>
        </div>

        {/* Back to login */}
        <div className="modal-footer">
          <p className="modal-footer-text">
            <TextLink onClick={onSwitchToLogin} bold>
              ← Zpět na přihlášení
            </TextLink>
          </p>
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
          helperText={MESSAGES.hints.emailHelper}
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
