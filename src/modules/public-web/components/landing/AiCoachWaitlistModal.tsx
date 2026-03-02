/**
 * AiCoachWaitlistModal
 *
 * Modal pro zápis do čekací listiny na AI Coach tarif.
 * Ukládá kontakt do ecomail_sync_queue → zpracuje Edge Function.
 *
 * UX:
 *   - Email input (předvyplněný pokud je uživatel přihlášen)
 *   - Submit → success state
 *   - Validace emailu
 *
 * @package DechBar_App
 */

import { createPortal } from 'react-dom';
import { useState, useCallback } from 'react';
import { useAuthStore } from '@/platform/auth/authStore';
import { addContact } from '@/platform/api/ecomail';
import './AiCoachWaitlistModal.css';

// ============================================================
// Props
// ============================================================

interface AiCoachWaitlistModalProps {
  onClose: () => void;
}

// ============================================================
// Component
// ============================================================

export function AiCoachWaitlistModal({ onClose }: AiCoachWaitlistModalProps) {
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState(user?.email ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = useCallback(async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setErrorMsg('Zadej prosím platný e-mail.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    const result = await addContact('AI_COACH_WAITLIST', {
      email: trimmed,
      tags: ['ai_coach_waitlist'],
    });

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg('Nepodařilo se uložit e-mail. Zkus to prosím znovu.');
    }
  }, [email]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const content = (
    <div
      className="acwm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acwm-title"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="acwm-card">
        {/* Close button — global .close-button styles from close-button.css */}
        <button
          type="button"
          className="close-button"
          aria-label="Zavřít"
          onClick={onClose}
        >
          <svg
            className="close-button__icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === 'success' ? (
          /* ── Success state ── */
          <div className="acwm-success">
            <div className="acwm-success__icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="acwm-headline" id="acwm-title">Zapsáno</h2>
            <p className="acwm-subline">
              Brzy ti dáme vědět.
            </p>
            <button type="button" className="acwm-cta" onClick={onClose}>
              Zavřít
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Badge */}
            <div className="acwm-badge-row">
              <span className="acwm-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
                Brzy dostupné
              </span>
              <span className="acwm-badge acwm-badge--ai">AI Coach</span>
            </div>

            {/* Headline */}
            <div>
              <h2 className="acwm-headline" id="acwm-title">
                Buď první, kdo vyzkouší AI COACHe
              </h2>
              <p className="acwm-subline">
                Tvůj osobní AI trenér dechu. Nech nám svůj e-mail a my ti dáme vědět,
                jakmile AI trenéra spustíme.
              </p>
            </div>

            {/* Perks */}
            <ul className="acwm-perks" aria-label="Co získáš s AI Coach">
              {[
                { title: 'Osobní AI trenér 24/7', desc: 'Odpovídá na tvoje dotazy kdykoliv.' },
                { title: 'Analýza dýchání', desc: 'Pokročilé sledování a doporučení.' },
                { title: 'Neomezené zprávy', desc: 'Bez limitů, bez přerušení.' },
              ].map((perk) => (
                <li key={perk.title} className="acwm-perk">
                  <span className="acwm-perk__dot" aria-hidden="true" />
                  <span className="acwm-perk__text">
                    <strong>{perk.title}</strong> — {perk.desc}
                  </span>
                </li>
              ))}
            </ul>

            {/* Email form */}
            <div className="acwm-form">
              <label htmlFor="acwm-email" className="acwm-form__label">
                Tvůj e-mail
              </label>
              <input
                id="acwm-email"
                type="email"
                className={`acwm-form__input ${errorMsg ? 'acwm-form__input--error' : ''}`}
                placeholder="jmeno@email.cz"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                autoFocus={!user?.email}
                autoComplete="email"
                disabled={status === 'loading'}
              />
              {errorMsg && (
                <p className="acwm-form__error" role="alert">{errorMsg}</p>
              )}
            </div>

            <button
              type="button"
              className="acwm-cta"
              onClick={handleSubmit}
              disabled={status === 'loading'}
              aria-busy={status === 'loading'}
            >
              {status === 'loading' ? 'Ukládám…' : 'Zapsat se na čekací listinu →'}
            </button>

            <p className="gdpr-notice">
              Zadáním e-mailu souhlasíš s{' '}
              <a href="/obchodni-podminky" target="_blank" rel="noopener noreferrer">
                obchodními podmínkami
              </a>{' '}
              a{' '}
              <a href="/ochrana-osobnich-udaju" target="_blank" rel="noopener noreferrer">
                ochranou osobních údajů
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
