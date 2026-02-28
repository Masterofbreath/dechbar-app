/**
 * ResetPasswordPage
 *
 * Správné zpracování Supabase password reset flow:
 * 1. Čeká na PASSWORD_RECOVERY event z onAuthStateChange
 * 2. Teprve po navázání session zobrazí formulář
 * 3. Pokud session nepřijde do 6s → error state s možností zaslat nový odkaz
 *
 * @package DechBar_App
 * @subpackage Pages/Auth
 */

import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';
import { Button, Input } from '@/platform/components';
import { ErrorMessage } from '@/components/shared';
import { MESSAGES } from '@/config/messages';

type PasswordStrength = 'weak' | 'medium' | 'strong';
type SessionState = 'waiting' | 'ready' | 'error';

export function ResetPasswordPage() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');
  const [sessionState, setSessionState] = useState<SessionState>('waiting');

  // ============================================================
  // SESSION: Čekáme na PASSWORD_RECOVERY event od Supabase
  // Supabase.js zpracuje token z URL a vyšle tento event
  // ============================================================
  useEffect(() => {
    // Nejdřív zkontrolujeme, zda session již existuje (např. při F5)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionState('ready');
      }
    });

    // Posloucháme na auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionState('ready');
      } else if (event === 'SIGNED_IN' && session) {
        // Fallback: přijmeme i SIGNED_IN pokud přijde session
        setSessionState('ready');
      }
    });

    // Timeout: pokud session nepřijde do 6 sekund → odkaz expiroval nebo byl použit
    const timeout = setTimeout(() => {
      setSessionState(prev => (prev === 'waiting' ? 'error' : prev));
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Password strength
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength('weak');
      return;
    }
    let strength: PasswordStrength = 'weak';
    if (newPassword.length >= 8) {
      strength = 'medium';
      if (/\d/.test(newPassword) && /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
        strength = 'strong';
      }
    }
    setPasswordStrength(strength);
  }, [newPassword]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!newPassword || !confirmPassword) {
      setFormError(MESSAGES.error.requiredFields);
      return;
    }
    if (newPassword.length < 6) {
      setFormError(MESSAGES.error.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError(MESSAGES.error.passwordMismatch);
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';

      if (msg.includes('Auth session missing') || msg.includes('session missing')) {
        setFormError('Odkaz vypršel nebo byl již použit. Požádej o nový odkaz pro obnovení hesla.');
      } else if (msg.includes('New password should be different')) {
        setFormError('Nové heslo musí být jiné než staré.');
      } else if (msg.includes('Password should be at least')) {
        setFormError(MESSAGES.error.passwordTooShort);
      } else if (msg.includes('Invalid or expired') || msg.includes('expired')) {
        setFormError('Odkaz vypršel. Požádej o nový odkaz pro obnovení hesla.');
      } else if (msg.includes('network') || msg.includes('Failed to fetch')) {
        setFormError(MESSAGES.error.networkError);
      } else if (msg) {
        setFormError(MESSAGES.error.passwordUpdateFailed);
      } else {
        setFormError(MESSAGES.error.passwordUpdateFailed);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // LOADING STATE — čekáme na session z recovery linku
  // ============================================================
  if (sessionState === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
        <div className="modal-card max-w-md w-full">
          <div className="auth-view" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto', display: 'block', opacity: 0.6 }}>
                <circle cx="12" cy="12" r="10" stroke="#2CBEC6" strokeWidth="2" strokeDasharray="30 10" style={{ animation: 'spin 1.5s linear infinite', transformOrigin: 'center' }}>
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>
            <h2 style={{ color: '#F0F0F0', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Ověřujeme odkaz...
            </h2>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Chvilku strpení, připravujeme tvůj formulář.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE — odkaz expiroval nebo byl použit
  // ============================================================
  if (sessionState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
        <div className="modal-card max-w-md w-full">
          <div className="auth-view">
            <div className="modal-header">
              <h2 className="modal-title">Odkaz už nefunguje</h2>
              <p className="modal-subtitle">
                Odkaz pro obnovení hesla vypršel nebo byl již použit. Nic se nestalo — pošleme ti nový.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/?openAuth=reset')}
              >
                Zaslat nový odkaz →
              </Button>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => navigate('/app')}
              >
                Zpět do aplikace
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // SUCCESS STATE
  // ============================================================
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
        <div className="modal-card modal-card--success max-w-md w-full">
          <div className="auth-view">
            <div className="modal-header">
              <h2 className="modal-title">Heslo změněno</h2>
            </div>
            <p className="success-instruction">Dýchej s námi.</p>
            <p className="text-sm text-text-tertiary text-center mt-4">
              Za chvíli tě přesměrujeme...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM STATE — session navázána, zobraz formulář
  // ============================================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-4">
      <div className="modal-card max-w-md w-full">
        <div className="auth-view">
          <div className="modal-header">
            <h2 className="modal-title">{MESSAGES.auth.resetPasswordTitle}</h2>
            <p className="modal-subtitle">{MESSAGES.auth.resetPasswordSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div>
              <Input
                type="password"
                label={MESSAGES.form.password}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={MESSAGES.form.placeholders.password}
                required
                disabled={isLoading}
                helperText={MESSAGES.hints.passwordStrength}
                autoFocus
              />
              {newPassword.length > 0 && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className={`password-strength-fill ${passwordStrength}`}
                      style={{
                        width: passwordStrength === 'weak' ? '33%' :
                               passwordStrength === 'medium' ? '66%' : '100%'
                      }}
                    />
                  </div>
                  <span className={`password-strength-text ${passwordStrength}`}>
                    {passwordStrength === 'weak' ? 'Slabé heslo' :
                     passwordStrength === 'medium' ? 'Střední heslo' : 'Silné heslo'}
                  </span>
                </div>
              )}
            </div>

            <Input
              type="password"
              label={MESSAGES.form.passwordConfirm}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={MESSAGES.form.placeholders.passwordConfirm}
              required
              disabled={isLoading}
            />

            {formError && <ErrorMessage message={formError} />}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? MESSAGES.buttons.loading.saving : MESSAGES.buttons.setPassword}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
