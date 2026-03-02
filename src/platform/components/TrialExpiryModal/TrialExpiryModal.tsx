/**
 * TrialExpiryModal
 *
 * Zobrazuje se automaticky:
 *   - "warning":  posledních 7 dní trialu (daysRemaining 1–7)
 *   - "expired":  trial vypršel (daysRemaining <= 0)
 *
 * Dismiss logika (localStorage):
 *   - Uloží datum posledního zavření → nezobrazí se znovu ve stejný den.
 *   - "expired" stav se zobrazí každý den dokud uživatel neupgraduje.
 *
 * Personalizace:
 *   - Jméno / oslovení z profilu
 *   - Dynamický počet zbývajících dní
 *   - Datum expirace
 *
 * @package DechBar_App
 */

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUserState, isMembershipTrial } from '@/platform/user/userStateStore';
import { useAuthStore } from '@/platform/auth/authStore';
import { useProfile } from '@/platform/api/useProfile';
import './TrialExpiryModal.css';

// ============================================================
// Constants
// ============================================================

const WARN_DAYS_THRESHOLD = 7;
const DISMISS_STORAGE_KEY = (userId: string) => `tem_dismissed_${userId}`;

const WEB_ACCOUNT_URL = 'https://www.dechbar.cz/muj-ucet';

// ============================================================
// Helpers
// ============================================================

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDismissedDate(userId: string): string | null {
  try {
    return localStorage.getItem(DISMISS_STORAGE_KEY(userId));
  } catch {
    return null;
  }
}

function setDismissedToday(userId: string): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY(userId), todayKey());
  } catch { /* noop */ }
}

function formatExpiry(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getFirstName(fullName: string | null | undefined): string | null {
  if (!fullName?.trim()) return null;
  return fullName.trim().split(/\s+/)[0];
}

// ============================================================
// Benefits data
// ============================================================

const SMART_BENEFITS = [
  {
    id: 'audio',
    title: '150+ audio nahrávek',
    desc: 'Průvodci, relaxace i pokročilé dechové protokoly.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
  },
  {
    id: 'challenges',
    title: 'Všechny dechové výzvy',
    desc: 'Ranní výzva, Digitální ticho, REŽIM a další programy.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8.56 2.9A7 7 0 0 1 19 9v4"/>
        <path d="M12 12v4a1 1 0 0 0 1 1h1"/>
        <path d="M9 21h6"/>
        <path d="M12 21v-4"/>
        <circle cx="12" cy="9" r="3"/>
      </svg>
    ),
  },
  {
    id: 'smart',
    title: 'SMART cvičení na míru',
    desc: 'Personalizovaná doporučení dle tvého pokroku a KP.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
];

// ============================================================
// Component
// ============================================================

export function TrialExpiryModal() {
  const user = useAuthStore((s) => s.user);
  const { membership } = useUserState();
  const { profile } = useProfile();
  const [visible, setVisible] = useState(false);

  const userId = user?.id ?? '';
  const trial = isMembershipTrial(membership);
  const expiresAt = membership?.expiresAt ?? null;

  const daysRemaining = useMemo(() => {
    if (!expiresAt) return null;
    const now = new Date();
    return Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 86_400_000);
  }, [expiresAt]);

  const mode: 'warning' | 'expired' | null =
    !trial || daysRemaining === null
      ? null
      : daysRemaining <= 0
        ? 'expired'
        : daysRemaining <= WARN_DAYS_THRESHOLD
          ? 'warning'
          : null;

  // Decide whether to show
  useEffect(() => {
    if (!mode || !userId) return;
    const dismissed = getDismissedDate(userId);
    if (dismissed === todayKey()) return; // already shown today
    // Small delay so the app renders first
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, [mode, userId]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    if (userId) setDismissedToday(userId);
  }, [userId]);

  if (!visible || !mode || !expiresAt) return null;

  // ── Personalization ───────────────────────────────────────
  const vocative = profile?.vocative_override
    ?? getFirstName(profile?.full_name)
    ?? null;

  const greeting = vocative ? `${vocative},` : null;

  const headline =
    mode === 'expired'
      ? 'Tvůj SMART tarif skončil'
      : daysRemaining === 1
        ? 'Tvůj SMART tarif vyprší zítra'
        : `Tvůj SMART tarif vyprší za ${daysRemaining} dní`;

  const subline =
    mode === 'expired'
      ? 'Pokračuj ve svém dýchání — obnov si předplatné a zachovej přístup ke všemu, co sis oblíbil/a.'
      : `Přístup máš aktivní do ${formatExpiry(expiresAt)}. Obnov si předplatné a pokračuj bez přerušení.`;

  const ctaLabel =
    mode === 'expired' ? 'Obnovit předplatné →' : 'Pokračovat se SMART →';

  const dismissLabel =
    mode === 'expired' ? 'Pokračovat zdarma' : 'Připomenout zítra';

  const countdownUrgency = daysRemaining !== null && daysRemaining <= 3 ? 'urgent' : 'warning';

  return createPortal(
    <div
      className="tem-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tem-headline"
      onClick={(e) => { if (e.target === e.currentTarget) handleDismiss(); }}
    >
      <div className="tem-card">

        {/* ── Badge + countdown ── */}
        <div className="tem-badge-row">
          <span className={`tem-badge ${mode === 'expired' ? 'tem-badge--expired' : 'tem-badge--smart'}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            SMART
          </span>
          {mode === 'warning' && daysRemaining !== null && (
            <span className={`tem-countdown tem-countdown--${countdownUrgency}`}>
              {daysRemaining === 1 ? 'Zbývá 1 den' : daysRemaining <= 4 ? `Zbývá ${daysRemaining} dny` : `Zbývá ${daysRemaining} dní`}
            </span>
          )}
          {mode === 'expired' && (
            <span className="tem-countdown tem-countdown--urgent">Vypršel</span>
          )}
        </div>

        {/* ── Headline ── */}
        <div>
          {greeting && <p className="tem-subline" style={{ marginBottom: 4, marginTop: 0 }}>{greeting}</p>}
          <h2 id="tem-headline" className="tem-headline">{headline}</h2>
          <p className="tem-subline">{subline}</p>
        </div>

        {/* ── Benefits ── */}
        <ul className="tem-benefits" aria-label="Co zahrnuje SMART tarif">
          {SMART_BENEFITS.map((b) => (
            <li key={b.id} className="tem-benefit">
              <span className="tem-benefit__icon">{b.icon}</span>
              <span className="tem-benefit__text">
                <span className="tem-benefit__title">{b.title}</span>
                <span className="tem-benefit__desc">{b.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* ── CTA ── */}
        <a
          href={WEB_ACCOUNT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="tem-cta"
          onClick={handleDismiss}
          aria-label={`${ctaLabel} — otevře dechbar.cz`}
        >
          {ctaLabel}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>

        {/* ── Dismiss ── */}
        <button type="button" className="tem-dismiss" onClick={handleDismiss}>
          {dismissLabel}
        </button>

      </div>
    </div>,
    document.body,
  );
}
