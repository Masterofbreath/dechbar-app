/**
 * UcetPage - User Account Page
 *
 * Dedicated fullscreen page at /app/ucet.
 * Apple premium style — calm, minimal, functional.
 *
 * ⚠️ APPLE APP STORE RULE: NO CTA buttons for subscription
 * upgrade/change/cancel. Info text only.
 *
 * Sections:
 * 1. Můj plán — membership tier badge + info text
 * 2. Moje programy — owned lifetime/subscription modules (hidden if empty)
  * 3. Zabezpečení — email change (inline) + change password + delete account
 *
 * @package DechBar_App
 * @subpackage Modules/MVP0/Pages
 * @since 0.4.0
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/platform/auth/authStore';
import { useUserState, isMembershipTrial } from '@/platform/user/userStateStore';
import { useAccountData } from '@/platform/api/useAccountData';
import { PageLayout } from '@/platform/layouts/PageLayout';
import { supabase } from '@/platform/api/supabase';

// ============================================================
// Helpers
// ============================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return '–';
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

/**
 * Datum "Aktivní od" pro trial membership.
 * Speciální akce byla spuštěna 1. 3. 2026 — uživatelé registrovaní před tímto datem
 * by viděli matoucí starší datum. Zobrazíme MAX(purchasedAt, 2026-03-01).
 * Platící uživatelé (non-trial) dostanou vždy reálný datum platby.
 */
const TRIAL_LAUNCH_DATE = new Date('2026-03-01T00:00:00+01:00');

function getDisplayActiveSince(purchasedAt: string, isTrial: boolean): string {
  if (!isTrial) return formatDate(purchasedAt);
  const purchased = new Date(purchasedAt);
  const effective = purchased < TRIAL_LAUNCH_DATE ? TRIAL_LAUNCH_DATE : purchased;
  return formatDate(effective.toISOString());
}

/**
 * Text pro řádek "Přístup do" u admin/CEO uživatelů.
 * Místo expiračního data zobrazíme větu odpovídající jejich roli.
 */
function getAdminAccessLabel(roles: string[]): string {
  if (roles.includes('ceo')) return 'Aktivní po dobu tvého působení v DechBaru jako CEO';
  return 'Aktivní po dobu tvého působení v DechBaru jako administrátor';
}

/** Czech declension: 1 den / 2–4 dny / 5+ dní */
function formatDaysRemaining(days: number): string {
  if (days <= 0) return 'dnes vyprší';
  if (days === 1) return 'Zbývá 1 den';
  if (days <= 4) return `Zbývá ${days} dny`;
  return `Zbývá ${days} dní`;
}

/** Returns urgency modifier: 'ok' | 'warning' | 'urgent' */
function daysUrgency(days: number): 'ok' | 'warning' | 'urgent' {
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'ok';
}

type PasswordState = 'idle' | 'loading' | 'success' | 'error';
type EmailChangeState = 'idle' | 'expanded' | 'loading' | 'success' | 'error';
type DeleteState = 'idle' | 'confirm' | 'loading' | 'error';

// ============================================================
// Plan Card subcomponent
// ============================================================

interface PlanInfo {
  label: string;
  subtitle: string;
  modifier: string;
}

function getModuleDeepLink(moduleId: string): string {
  if (moduleId.startsWith('membership-')) return '/app?tab=akademie';
  return `/app?module=${moduleId}`;
}

function getPlanInfo(plan: string, trial = false): PlanInfo {
  switch (plan) {
    case 'SMART':
      return { label: 'SMART', subtitle: trial ? 'Speciální akce' : '249 Kč / měsíc', modifier: 'smart' };
    case 'AI_COACH':
      return { label: 'AI COACH', subtitle: trial ? 'Speciální akce' : '490 Kč / měsíc', modifier: 'ai-coach' };
    default:
      return { label: 'Zdarma', subtitle: 'Základní přístup', modifier: 'zdarma' };
  }
}

// ============================================================
// Component
// ============================================================

export function UcetPage() {
  const navigate = useNavigate();
  const { user, resetPassword, deleteAccount } = useAuthStore();
  const { membership, roles } = useUserState();
  const { ownedModules, isLoading: modulesLoading } = useAccountData();

  const [passwordState, setPasswordState] = useState<PasswordState>('idle');
  const [emailChangeState, setEmailChangeState] = useState<EmailChangeState>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');

  // ── Change email ──────────────────────────────────────────
  const handleEmailChange = useCallback(async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (trimmed === user?.email) {
      setEmailChangeState('error');
      return;
    }
    setEmailChangeState('loading');
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      setEmailChangeState('success');
      setNewEmail('');
    } catch {
      setEmailChangeState('error');
    }
  }, [newEmail, user?.email]);

  const handleEmailChangeCancel = useCallback(() => {
    setEmailChangeState('idle');
    setNewEmail('');
  }, []);

  // ── Delete account ────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    setDeleteState('loading');
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch {
      setDeleteState('error');
    }
  }, [deleteAccount, navigate]);

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = useCallback(async () => {
    if (!user?.email) return;
    setPasswordState('loading');
    try {
      await resetPassword(user.email);
      setPasswordState('success');
      // Auto-reset success message after 3s
      setTimeout(() => setPasswordState('idle'), 3000);
    } catch {
      setPasswordState('error');
    }
  }, [user?.email, resetPassword]);

  // ── Derived ───────────────────────────────────────────────
  const trial = isMembershipTrial(membership);
  const planInfo = getPlanInfo(membership?.plan ?? 'ZDARMA', trial);
  const isPremium = membership && membership.plan !== 'ZDARMA';

  // Countdown — pouze pro trial
  const trialDaysRemaining = trial && membership?.expiresAt
    ? Math.ceil((new Date(membership.expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <PageLayout title="Účet" onBack={() => navigate(-1)} className="ucet-page">

      {/* ─── MŮJ PLÁN ─────────────────────────────────────── */}
      <section className="ucet-section">
        <h2 className="ucet-section__label">Můj plán</h2>

        <div className={`ucet-plan-card ucet-plan-card--${planInfo.modifier}`}>
          {/* Plan icon */}
          <span className="ucet-plan-card__icon" aria-hidden="true">
            {planInfo.modifier === 'zdarma' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
            ) : planInfo.modifier === 'smart' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            )}
          </span>

          <div className="ucet-plan-card__content">
            <p className="ucet-plan-card__name">
              {planInfo.modifier !== 'zdarma' ? `Tarif ${planInfo.label}` : planInfo.label}
            </p>
            <p className="ucet-plan-card__subtitle">{planInfo.subtitle}</p>

            {/* Active since / expiry / cancelled */}
            {isPremium && membership && (
              <div className="ucet-plan-card__details">
                {trial && (
                  <p className="ucet-plan-card__detail ucet-plan-card__detail--trial">
                    Máš předplatné zdarma v rámci speciální akce
                  </p>
                )}
                {trial && trialDaysRemaining !== null && trialDaysRemaining <= 14 && (
                  <p className={`ucet-plan-card__detail ucet-plan-card__countdown ucet-plan-card__countdown--${daysUrgency(trialDaysRemaining)}`}>
                    {formatDaysRemaining(trialDaysRemaining)}
                  </p>
                )}
                {membership.purchasedAt && (
                  <p className="ucet-plan-card__detail">
                    Aktivní od: {getDisplayActiveSince(membership.purchasedAt, trial)}
                  </p>
                )}
                {membership.type === 'subscription' && membership.expiresAt && !trial && (
                  <p className={`ucet-plan-card__detail${membership.status === 'cancelled' ? ' ucet-plan-card__detail--cancelled' : ''}`}>
                    {membership.status === 'cancelled'
                      ? `Zrušeno, aktivní do: ${formatDate(membership.expiresAt)}`
                      : membership.billingInterval === 'annual'
                        ? `Roční předplatné, obnoví se: ${formatDate(membership.expiresAt)}`
                        : `Další platba: ${formatDate(membership.expiresAt)}`}
                  </p>
                )}
                {trial && membership.expiresAt && membership.status !== 'cancelled' && (
                  <p className="ucet-plan-card__detail">
                    {roles.includes('admin') || roles.includes('ceo')
                      ? getAdminAccessLabel(roles)
                      : `Přístup do: ${formatDate(membership.expiresAt)}`}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ⚠️ APPLE APP STORE: info text + external link only, NO in-app CTA */}
        <p className="ucet-plan-card__web-note">
          {!isPremium ? 'Chceš více funkcí? ' : 'Správu předplatného najdeš '}
          <a
            href="https://www.dechbar.cz/muj-ucet"
            target="_blank"
            rel="noopener noreferrer"
            className="ucet-plan-card__web-link"
            aria-label={!isPremium ? 'Upgrade tarifu na dechbar.cz' : 'Správa předplatného na dechbar.cz'}
          >
            {!isPremium ? 'Upgrade na dechbar.cz' : 'na dechbar.cz'}
          </a>
        </p>

        {/* Subscription management deeplink — Apple compliant, skipped for trial */}
        {isPremium && !trial && membership?.type === 'subscription' && membership.status !== 'cancelled' && (
          <a
            href="https://www.dechbar.cz/muj-ucet"
            target="_blank"
            rel="noopener noreferrer"
            className="ucet-plan-card__manage-btn"
            aria-label="Spravovat nebo zrušit předplatné na dechbar.cz"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Spravovat předplatné
          </a>
        )}
      </section>

      {/* ─── MÉ PROGRAMY ───────────────────────────────────── */}
      {!modulesLoading && ownedModules.length > 0 && (
        <section className="ucet-section">
          <h2 className="ucet-section__label">
            Mé programy
            <span className="ucet-section__label-count">{ownedModules.length}</span>
          </h2>

          <ul className="ucet-modules-grid" role="list">
            {ownedModules.map((mod) => {
              // Determine thumbnail: use module color or teal fallback
              const thumbColor = mod.color ?? 'var(--color-primary)';
              // Determine thumbnail display: use icon if it's a single emoji, else first letter
              const iconValue = mod.icon ?? '';
              const isEmoji = iconValue.length <= 2 && /\p{Emoji}/u.test(iconValue);
              const thumbLabel = isEmoji ? iconValue : mod.name.charAt(0).toUpperCase();

              return (
                <li key={mod.module_id} className="ucet-module-card">
                  <button
                    type="button"
                    className="ucet-module-card__btn"
                    onClick={() => navigate(getModuleDeepLink(mod.module_id))}
                    aria-label={`Otevřít program ${mod.name}`}
                  >
                    {/* Thumbnail — cover image if available, else colored placeholder */}
                    <div
                      className="ucet-module-card__thumb"
                      style={{ '--module-color': thumbColor } as React.CSSProperties}
                      aria-hidden="true"
                    >
                      {mod.cover_image_url ? (
                        <img
                          src={mod.cover_image_url}
                          alt=""
                          className="ucet-module-card__thumb-img"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="ucet-module-card__thumb-label">{thumbLabel}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="ucet-module-card__info">
                      <p className="ucet-module-card__name">{mod.name}</p>
                      <p className="ucet-module-card__type">
                        {mod.purchase_type === 'lifetime' ? 'Doživotní přístup' : 'Předplatné'}
                      </p>
                      <p className="ucet-module-card__date">
                        Zakoupeno {formatDate(mod.purchased_at)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ─── ZABEZPEČENÍ ───────────────────────────────────── */}
      <section className="ucet-section">
        <h2 className="ucet-section__label">Zabezpečení</h2>

        {/* Email — inline change */}
        <div className="ucet-security__email">
          <div className="ucet-security__field-row">
            <div className="ucet-security__field-info">
              <span className="ucet-security__field-label">Email</span>
              <span className="ucet-security__field-value">{user?.email ?? '–'}</span>
            </div>
            {emailChangeState === 'idle' && (
              <button
                type="button"
                className="ucet-security__inline-btn"
                onClick={() => setEmailChangeState('expanded')}
              >
                Změnit
              </button>
            )}
          </div>

          {/* Expandable input form */}
          {(emailChangeState === 'expanded' || emailChangeState === 'loading' || emailChangeState === 'error') && (
            <div className="ucet-security__email-form">
              <input
                type="email"
                className="ucet-security__email-input"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Nový e-mail"
                autoComplete="email"
                disabled={emailChangeState === 'loading'}
                autoFocus
              />
              <div className="ucet-security__email-actions">
                <button
                  type="button"
                  className="ucet-security__confirm-btn"
                  onClick={handleEmailChange}
                  disabled={emailChangeState === 'loading' || !newEmail.trim()}
                >
                  {emailChangeState === 'loading' ? 'Odesílám...' : 'Odeslat'}
                </button>
                <button
                  type="button"
                  className="ucet-security__cancel-btn"
                  onClick={handleEmailChangeCancel}
                  disabled={emailChangeState === 'loading'}
                >
                  Zrušit
                </button>
              </div>
              {emailChangeState === 'error' && (
                <p className="ucet-security__feedback ucet-security__feedback--error">
                  Nepodařilo se odeslat. Zkontroluj formát emailu nebo zkus jiný.
                </p>
              )}
            </div>
          )}

          {emailChangeState === 'success' && (
            <p className="ucet-security__feedback ucet-security__feedback--success">
              Potvrzovací odkaz odeslán na nový email.
            </p>
          )}
        </div>

        {/* Change password */}
        <button
          type="button"
          className="ucet-security__password-btn"
          onClick={handleChangePassword}
          disabled={passwordState === 'loading' || passwordState === 'success'}
        >
          {passwordState === 'loading' ? 'Odesílám...' : 'Změnit heslo'}
        </button>

        {/* Password feedback */}
        {passwordState === 'success' && (
          <p className="ucet-security__feedback ucet-security__feedback--success">
            Odkaz byl odeslán na tvůj email
          </p>
        )}
        {passwordState === 'error' && (
          <p className="ucet-security__feedback ucet-security__feedback--error">
            Nepodařilo se odeslat, zkus to znovu
          </p>
        )}
      </section>

      {/* ─── SMAZAT ÚČET ───────────────────────────────────── */}
      <section className="ucet-danger-section" aria-label="Smazat účet">
        {deleteState === 'idle' && (
          <button
            type="button"
            className="ucet-danger__delete-btn"
            onClick={() => setDeleteState('confirm')}
          >
            Smazat účet
          </button>
        )}

        {(deleteState === 'confirm' || deleteState === 'loading' || deleteState === 'error') && (
          <div className="ucet-danger__confirm" role="alertdialog" aria-labelledby="delete-account-title">
            <p id="delete-account-title" className="ucet-danger__confirm-title">Smazat účet?</p>
            <p className="ucet-danger__confirm-text">
              Tento krok je nevratný. Tvůj účet a všechna data budou trvale odstraněna.
              {membership && membership.type === 'subscription' && membership.status === 'active' && (
                <> Aktivní předplatné bude zrušeno na konci aktuálního zaplaceného období.</>
              )}
            </p>

            {deleteState === 'error' && (
              <p className="ucet-security__feedback ucet-security__feedback--error">
                Smazání se nezdařilo. Kontaktuj nás na podpora@dechbar.cz
              </p>
            )}

            <div className="ucet-danger__confirm-actions">
              <button
                type="button"
                className="ucet-danger__confirm-cancel"
                onClick={() => setDeleteState('idle')}
                disabled={deleteState === 'loading'}
              >
                Zrušit
              </button>
              <button
                type="button"
                className="ucet-danger__confirm-delete"
                onClick={handleDeleteConfirm}
                disabled={deleteState === 'loading'}
              >
                {deleteState === 'loading' ? 'Mazání...' : 'Smazat navždy'}
              </button>
            </div>
          </div>
        )}
      </section>
    </PageLayout>
  );
}
