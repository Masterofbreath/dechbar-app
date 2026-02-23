/**
 * ContactPage - Kontakt
 *
 * Route: /kontakt
 * Design: Apple premium, méně je více, neutrální tón.
 * Backend: Supabase Edge Function `notify-contact` → Ecomail notifikace + DB záznam
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Pages
 */

import { useState, useEffect, type FormEvent } from 'react';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';
import { env } from '@/config/environment';

type FormType = 'podpora' | 'spoluprace' | 'jine';
type FormState = 'idle' | 'sending' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  type: FormType;
  message: string;
}

const EDGE_FUNCTION_URL = `${env.supabase.url}/functions/v1/notify-contact`;

export function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    type: 'podpora',
    message: '',
  });
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.title = 'Kontakt | DechBar';
    window.scrollTo(0, 0);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormState('sending');
    setErrorMessage('');

    try {
      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Nepodařilo se odeslat zprávu.');
      }

      setFormState('success');
      setFormData({ name: '', email: '', type: 'podpora', message: '' });
    } catch (err: unknown) {
      setFormState('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Nepodařilo se odeslat zprávu. Zkus to znovu.'
      );
    }
  }

  return (
    <div className="contact-page">
      <Header />

      <main className="contact-main">
        <div className="contact-container">

          {/* Header */}
          <header className="contact-header">
            <h1 className="contact-title">Kontakt</h1>
            <p className="contact-subtitle">
              Napiš nám. Odpovíme do 48 hodin.
            </p>
          </header>

          {/* Form or Success state */}
          {formState === 'success' ? (
            <div className="contact-success">
              <div className="contact-success__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="M7.5 12l3 3 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="contact-success__title">Zpráva odeslána</h2>
              <p className="contact-success__text">
                Děkujeme za tvoji zprávu. Ozveme se ti na zadaný e-mail do 48 hodin.
              </p>
              <button
                type="button"
                className="contact-success__back"
                onClick={() => setFormState('idle')}
              >
                Odeslat další zprávu
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-name">
                  Jméno nebo firma
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  className="contact-input"
                  placeholder="Jakub Novák"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={formState === 'sending'}
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-email">
                  E-mail
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="contact-input"
                  placeholder="jakub@example.cz"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={formState === 'sending'}
                  autoComplete="email"
                />
              </div>

              {/* Type */}
              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-type">
                  Typ dotazu
                </label>
                <div className="contact-select-wrapper">
                  <select
                    id="contact-type"
                    name="type"
                    className="contact-select"
                    value={formData.type}
                    onChange={handleChange}
                    disabled={formState === 'sending'}
                  >
                    <option value="podpora">Zákaznická podpora</option>
                    <option value="spoluprace">Spolupráce / B2B</option>
                    <option value="jine">Jiné</option>
                  </select>
                  <svg
                    className="contact-select-arrow"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="contact-field">
                <label className="contact-label" htmlFor="contact-message">
                  Zpráva
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="contact-textarea"
                  placeholder="Napiš nám, co potřebuješ…"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={formState === 'sending'}
                />
              </div>

              {/* Error message */}
              {formState === 'error' && errorMessage && (
                <p className="contact-error" role="alert">
                  {errorMessage}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="contact-submit"
                disabled={formState === 'sending'}
              >
                {formState === 'sending' ? (
                  <span className="contact-submit__loading">
                    <svg
                      className="contact-submit__spinner"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="32"
                        strokeDashoffset="12"
                      />
                    </svg>
                    Odesílám…
                  </span>
                ) : (
                  'Odeslat zprávu'
                )}
              </button>

              {/* GDPR note */}
              <p className="contact-gdpr">
                Odesláním souhlasíš s{' '}
                <a href="/ochrana-osobnich-udaju">Ochranou osobních údajů</a>.
              </p>
            </form>
          )}

          {/* Alternate contact */}
          <div className="contact-alternate">
            <p>
              Nebo napiš přímo na{' '}
              <a href="mailto:info@dechbar.cz" className="contact-email-link">
                info@dechbar.cz
              </a>
            </p>
            <a
              href="https://www.instagram.com/jakub_rozdycha_cesko/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-instagram"
              aria-label="Instagram DechBar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
              <span>@jakub_rozdycha_cesko</span>
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
