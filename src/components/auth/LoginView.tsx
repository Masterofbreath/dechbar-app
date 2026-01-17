/**
 * LoginView Component
 * 
 * Login form view for AuthModal
 * Design inspired by WordPress zdravedychej-public modal views
 * 
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
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
  const { signIn, isLoading, error: authError, signInWithOAuth } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleOAuthSignIn(provider: 'google' | 'apple' | 'facebook') {
    try {
      setFormError('');
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
      
      const errorMessage = err.message || '';
      
      // ✅ COMPREHENSIVE ERROR TRANSLATION (100% Czech coverage)
      if (errorMessage.includes('Invalid login credentials')) {
        // Wrong email/password combination
        setFormError(MESSAGES.error.invalidCredentials);
        
      } else if (errorMessage.includes('Email not confirmed')) {
        // Email verification pending
        setFormError(MESSAGES.error.emailNotConfirmed);
        
      } else if (errorMessage.includes('Email and password') || 
                 errorMessage.includes('Password authentication') ||
                 errorMessage.includes('signup provider')) {
        // OAuth account trying to login with password
        setFormError(MESSAGES.error.oauthAccountExists);
        
      } else if (errorMessage.includes('User not found')) {
        // Security: Don't reveal if email exists (email enumeration attack prevention)
        setFormError(MESSAGES.error.invalidCredentials);
        
      } else if (errorMessage.includes('too many requests') || 
                 errorMessage.includes('rate limit')) {
        // Rate limiting (brute force protection)
        setFormError(MESSAGES.error.tooManyRequests);
        
      } else if (errorMessage.includes('network') || 
                 errorMessage.includes('Failed to fetch')) {
        // Network connectivity issues
        setFormError(MESSAGES.error.networkError);
        
      } else {
        // ✅ FALLBACK: Generic Czech error (no more English!)
        console.warn('Unknown auth error:', errorMessage);
        setFormError(MESSAGES.error.unknownAuthError);
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
          <ErrorMessage message={formError || authError?.message || ''} />
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
      </div>

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
