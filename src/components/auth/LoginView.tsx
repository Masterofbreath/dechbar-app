/**
 * LoginView Component
 * 
 * Login form view for AuthModal
 * Design inspired by WordPress zdravedychej-public modal views
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/platform/auth';
import { Button, Input, TextLink, Checkbox } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
  onSuccess?: () => void;
}

export function LoginView({ onSwitchToRegister, onSwitchToReset, onSuccess }: LoginViewProps) {
  const navigate = useNavigate();
  const { signIn, isLoading, error: authError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!email || !password) {
      setFormError(MESSAGES.error.requiredFields);
      return;
    }

    if (!email.includes('@')) {
      setFormError(MESSAGES.error.invalidEmailLogin);
      return;
    }

    if (password.length < 6) {
      setFormError(MESSAGES.error.passwordTooShort);
      return;
    }

    try {
      await signIn({ email, password, remember });
      
      // Success
      if (onSuccess) {
        onSuccess();
      }
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Map Supabase errors to Czech
      const errorMessage = err.message || MESSAGES.error.loginFailed;
      
      if (errorMessage.includes('Invalid login credentials')) {
        setFormError(MESSAGES.error.invalidCredentials);
      } else if (errorMessage.includes('Email not confirmed')) {
        setFormError('Email nebyl potvrzen. Zkontroluj svou schránku.');
      } else {
        setFormError(errorMessage);
      }
    }
  }

  return (
    <div className="auth-view">
      {/* Header */}
      <div className="modal-header">
        <h2 className="modal-title">
          {MESSAGES.auth.loginTitle}
        </h2>
        <p className="modal-subtitle">
          {MESSAGES.auth.loginSubtitle}
        </p>
      </div>

      {/* Login Form */}
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

        {/* Password */}
        <Input
          type="password"
          label={MESSAGES.form.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={MESSAGES.form.placeholders.password}
          required
          disabled={isLoading}
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <Checkbox
            label={MESSAGES.form.rememberMe}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          
          <TextLink onClick={onSwitchToReset}>
            Zapomenuté heslo?
          </TextLink>
        </div>

        {/* Error Message */}
        {(formError || authError) && (
          <ErrorMessage message={formError || authError.message} />
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
          {isLoading ? MESSAGES.buttons.loading.login : MESSAGES.buttons.login}
        </Button>
      </form>

      {/* Register Link */}
      <div className="modal-footer">
        <p className="modal-footer-text">
          {MESSAGES.auth.noAccount}{' '}
          <TextLink onClick={onSwitchToRegister} bold>
            {MESSAGES.buttons.register}
          </TextLink>
        </p>
      </div>
    </div>
  );
}
