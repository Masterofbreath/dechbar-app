/**
 * LoginView Component
 *
 * Login form view for AuthModal.
 * Supports:
 *   - Email + password login
 *   - Google OAuth
 *   - "Přihlásit bez hesla" — magic link recovery for users without/with forgotten password
 *
 * Session is always persisted in localStorage (no "Remember Me" toggle needed).
 *
 * @package DechBar_App
 * @subpackage Components/Auth
 */

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/platform/auth';
import { supabase } from '@/platform/api/supabase';
import { Button, Input, TextLink } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
  onSuccess?: () => void;
  /** After successful login navigate here. Defaults to /app. */
  returnTo?: string;
}

export function LoginView({ onSwitchToRegister, onSwitchToReset, onSuccess, returnTo }: LoginViewProps) {
  const navigate = useNavigate();
  const { signIn, isLoading, error: authError, signInWithOAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Magic link mode (passwordless login)
  const [magicLinkMode, setMagicLinkMode] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLinkSending, setMagicLinkSending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState('');

  // Keyboard shortcut: Cmd/Ctrl+Enter to submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          formRef.current?.requestSubmit();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading]);

  async function handleOAuthSignIn(provider: 'google') {
    try {
      setFormError('');
      await signInWithOAuth(provider, {
        redirectTo: `${window.location.origin}${returnTo || '/app'}`
      });
    } catch (err: unknown) {
      console.error(`OAuth ${provider} error:`, err);
      setFormError(MESSAGES.error.oauthFailed);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

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
      await signIn({ email, password });

      if (onSuccess) {
        onSuccess();
      }
      navigate(returnTo || '/app');
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : '';

      if (errorMessage.includes('Invalid login credentials')) {
        setFormError(MESSAGES.error.invalidCredentials);
      } else if (errorMessage.includes('Email not confirmed')) {
        setFormError(MESSAGES.error.emailNotConfirmed);
      } else if (
        errorMessage.includes('Email and password') ||
        errorMessage.includes('Password authentication') ||
        errorMessage.includes('signup provider')
      ) {
        setFormError(MESSAGES.error.oauthAccountExists);
      } else if (errorMessage.includes('User not found')) {
        setFormError(MESSAGES.error.invalidCredentials);
      } else if (errorMessage.includes('too many requests') || errorMessage.includes('rate limit')) {
        setFormError(MESSAGES.error.tooManyRequests);
      } else if (errorMessage.includes('network') || errorMessage.includes('Failed to fetch')) {
        setFormError(MESSAGES.error.networkError);
      } else {
        console.warn('Unknown auth error:', errorMessage);
        setFormError(MESSAGES.error.unknownAuthError);
      }
    }
  }

  // ============================================================
  // MAGIC LINK MODE — "Přihlásit bez hesla"
  // Pro uživatele bez hesla nebo s ProtonMail scannerem
  // ============================================================
  async function handleMagicLinkSend(e: FormEvent) {
    e.preventDefault();
    setMagicLinkError('');

    if (!magicEmail || !magicEmail.includes('@')) {
      setMagicLinkError(MESSAGES.error.invalidEmail);
      return;
    }

    try {
      setMagicLinkSending(true);
      const { error } = await supabase.auth.signInWithOtp({
        email: magicEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${returnTo || '/app'}`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        if (error.message?.includes('rate limit') || error.status === 429) {
          setMagicLinkError(MESSAGES.error.rateLimitEmail);
        } else {
          setMagicLinkError(MESSAGES.error.unknownAuthError);
        }
        return;
      }

      setMagicLinkSent(true);
    } catch {
      setMagicLinkError(MESSAGES.error.networkError);
    } finally {
      setMagicLinkSending(false);
    }
  }

  // ============================================================
  // MAGIC LINK SENT STATE
  // ============================================================
  if (magicLinkMode && magicLinkSent) {
    return (
      <div className="auth-view">
        <div className="modal-header">
          <h2 className="modal-title">{MESSAGES.auth.emailSentTitle}</h2>
          <p className="modal-subtitle">{MESSAGES.auth.emailSentInstruction}</p>
        </div>
        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '8px' }}>
          Pokud účet s tímto e-mailem existuje, odeslali jsme odkaz pro přihlášení.
          Zkontroluj schránku (i spam).
        </p>
        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <TextLink onClick={() => { setMagicLinkMode(false); setMagicLinkSent(false); setMagicEmail(''); }}>
            ← Zpět na přihlášení
          </TextLink>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAGIC LINK FORM
  // ============================================================
  if (magicLinkMode) {
    return (
      <div className="auth-view">
        <div className="modal-header">
          <h2 className="modal-title">Přihlásit bez hesla</h2>
          <p className="modal-subtitle">Pošleme ti odkaz přímo na e-mail. Bez hesla.</p>
        </div>

        <form onSubmit={handleMagicLinkSend} className="auth-form" noValidate>
          <Input
            type="email"
            label={MESSAGES.form.email}
            value={magicEmail}
            onChange={(e) => setMagicEmail(e.target.value)}
            placeholder={MESSAGES.form.placeholders.email}
            autoFocus
            required
            disabled={magicLinkSending}
          />

          {magicLinkError && <ErrorMessage message={magicLinkError} />}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={magicLinkSending}
            disabled={magicLinkSending}
          >
            {magicLinkSending ? MESSAGES.buttons.loading.sendingEmail : 'Poslat odkaz →'}
          </Button>
        </form>

        <div className="modal-footer">
          <TextLink onClick={() => setMagicLinkMode(false)}>
            ← Zpět na přihlášení heslem
          </TextLink>
        </div>
      </div>
    );
  }

  // ============================================================
  // STANDARD LOGIN FORM — simplified
  // ============================================================
  return (
    <div className="auth-view">
      <div className="modal-header">
        <h2 className="modal-title">{MESSAGES.auth.loginTitle}</h2>
        <p className="modal-subtitle">{MESSAGES.auth.loginSubtitle}</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="auth-form" noValidate>
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

        <Input
          type="password"
          label={MESSAGES.form.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={MESSAGES.form.placeholders.password}
          required
          disabled={isLoading}
        />

        {/* Two secondary actions on one row — saves vertical space */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
          <TextLink onClick={() => setMagicLinkMode(true)}>
            Přihlásit bez hesla →
          </TextLink>
          <TextLink onClick={onSwitchToReset}>
            Zapomenuté heslo?
          </TextLink>
        </div>

        {(formError || authError) && (
          <ErrorMessage message={formError || authError?.message || ''} />
        )}

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

      {/* OAuth — only active providers */}
      <div className="mt-4">
        <div className="auth-divider">
          <span>{MESSAGES.auth.oauthDivider}</span>
        </div>
        <div className="oauth-icons">
          <button
            type="button"
            className="oauth-icon-button"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            aria-label="Pokračovat s Google"
          >
            <img src="/assets/images/icons/oauth/google.svg" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Register link */}
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
