/**
 * MujUcetPage — Web Account Management Page
 *
 * dechbar.cz/muj-ucet
 * Protected by webAuthLoader — unauthenticated users are redirected to /.
 *
 * Sections (in order):
 *   1. Identita         — avatar, name, email, member since
 *   2. Tvůj plán        — ZDARMA (upgrade cards) | active | cancelled
 *   3. Fakturace        — last 5 paid Stripe invoices (subscription only)
 *   4. Profil           — inline edit full_name
 *   5. Zabezpečení      — email change + password reset
 *   6. Zóna nebezpečí   — delete account
 *
 * Apple App Store note: this page is the ONLY place with subscription upgrade/
 * cancel CTAs — intentionally NOT in the mobile app.
 *
 * @package DechBar_App
 * @subpackage Modules/PublicWeb/Pages
 * @since 2026-03-01
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/api/supabase';
import { useAuthStore } from '@/platform/auth/authStore';
import { useProfile, checkNicknameAvailable } from '@/platform/api/useProfile';
import { useAccountData } from '@/platform/api/useAccountData';
import { useManageSubscription, MEMBERSHIP_QUERY_KEY } from '@/platform/payments/useManageSubscription';
import { isMembershipTrial } from '@/platform/user/userStateStore';
import { Header } from '../components/landing/Header';
import { Footer } from '../components/landing/Footer';
import { BillingToggle } from '../components/landing/BillingToggle';
import { PricingCard } from '../components/landing/PricingCard';
import { AiCoachWaitlistModal } from '../components/landing/AiCoachWaitlistModal';
import { EmailInputModal } from '@/platform';
import { PaymentModal } from '@/platform/payments';
import { useLandingPricingCheckout } from '../components/landing/useLandingPricingCheckout';
import { CheckoutThankYouModal } from '../components/landing/CheckoutThankYouModal';
import { PRICE_IDS, SMART_FEATURES } from '../components/landing/pricingConstants';
import type { BillingInterval } from '../components/landing/BillingToggle';
import './MujUcetPage.css';

// ============================================================
// Types
// ============================================================

interface MembershipFull {
  plan: 'ZDARMA' | 'SMART' | 'AI_COACH';
  status: 'active' | 'cancelled' | 'expired';
  type: 'lifetime' | 'subscription';
  purchasedAt: string;
  expiresAt: string | null;
  metadata: Record<string, unknown> | null;
}

type NameEditState = 'idle' | 'editing' | 'saving' | 'success' | 'error';
type NicknameEditState = 'idle' | 'editing' | 'checking' | 'saving' | 'success' | 'error';
type EmailChangeState = 'idle' | 'expanded' | 'loading' | 'success' | 'error';
type PasswordState = 'idle' | 'loading' | 'success' | 'error';
type DeleteState = 'idle' | 'confirm' | 'loading' | 'error';
type CancelSubState = 'idle' | 'confirm' | 'loading' | 'error';

// ============================================================
// Helpers
// ============================================================

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '–';
  return new Date(dateString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(czk: number): string {
  return `${czk.toLocaleString('cs-CZ')} Kč`;
}

function getPlanBadgeModifier(plan: string): string {
  if (plan === 'SMART') return 'smart';
  if (plan === 'AI_COACH') return 'ai-coach';
  return 'zdarma';
}

function getPlanLabel(plan: string): string {
  if (plan === 'SMART') return 'SMART';
  if (plan === 'AI_COACH') return 'AI COACH';
  return 'Zdarma';
}

function getModuleDeepLink(moduleId: string): string {
  if (moduleId.startsWith('membership-')) return '/app?tab=akademie';
  return `/app?module=${moduleId}`;
}

function getBillingLabel(membership: MembershipFull | null): string {
  if (!membership || membership.type !== 'subscription' || !membership.expiresAt) return '';

  if (isMembershipTrial(membership)) {
    return `${getPlanLabel(membership.plan)} · Speciální akce – zdarma`;
  }

  const msToExpiry = new Date(membership.expiresAt).getTime() - Date.now();
  const daysToExpiry = msToExpiry / (1000 * 60 * 60 * 24);

  if (daysToExpiry > 35) {
    const monthlyEq = membership.plan === 'SMART' ? '125 Kč/měsíc' : '245 Kč/měsíc';
    const annual = membership.plan === 'SMART' ? '1 500 Kč' : '2 940 Kč';
    return `${getPlanLabel(membership.plan)} · ${monthlyEq} · účtováno ročně (${annual})`;
  }

  const monthlyPrice = membership.plan === 'SMART' ? '249 Kč/měsíc' : '490 Kč/měsíc';
  return `${getPlanLabel(membership.plan)} · ${monthlyPrice}`;
}

// ============================================================
// Fetch membership (includes cancelled, unlike userStateStore)
// ============================================================

async function fetchMembershipFull(userId: string): Promise<MembershipFull | null> {
  const { data, error } = await supabase
    .from('memberships')
    .select('plan, status, type, purchased_at, expires_at, metadata')
    .eq('user_id', userId)
    .in('status', ['active', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    plan: data.plan,
    status: data.status,
    type: data.type,
    purchasedAt: data.purchased_at,
    expiresAt: data.expires_at ?? null,
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
  };
}

// ============================================================
// Main Component
// ============================================================

export function MujUcetPage() {
  const navigate = useNavigate();
  const { user, resetPassword, deleteAccount } = useAuthStore();
  const { profile, isLoading: profileLoading, updateProfile, isUpdating } = useProfile();
  const { ownedModules, isLoading: modulesLoading } = useAccountData();
  const {
    cancelSubscription,
    reactivateSubscription,
    invoices,
    isLoadingInvoices,
    fetchInvoices,
    cancelState,
    reactivateState,
    error: subError,
    clearError: clearSubError,
  } = useManageSubscription();

  // Membership — own query (includes cancelled status)
  const userId = user?.id ?? '';
  const { data: membership } = useQuery({
    queryKey: MEMBERSHIP_QUERY_KEY(userId),
    queryFn: () => fetchMembershipFull(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Local UI state ─────────────────────────────────────────
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [nameEditState, setNameEditState] = useState<NameEditState>('idle');
  const [nameValue, setNameValue] = useState('');
  const [nicknameEditState, setNicknameEditState] = useState<NicknameEditState>('idle');
  const [nicknameValue, setNicknameValue] = useState('');
  const [nicknameErrMsg, setNicknameErrMsg] = useState('');
  const [emailChangeState, setEmailChangeState] = useState<EmailChangeState>('idle');
  const [newEmail, setNewEmail] = useState('');
  const [passwordState, setPasswordState] = useState<PasswordState>('idle');
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
  const [cancelSubState, setCancelSubState] = useState<CancelSubState>('idle');

  // Sdílený checkout pro SMART (stejný flow jako na landing; uživatel je vždy přihlášen → bez email modalu)
  const {
    emailModalOpen,
    setEmailModalOpen,
    paymentOpen,
    clientSecret,
    loadingEmail,
    thankYouModalOpen,
    closeThankYouModal,
    openCheckout,
    handleEmailSubmit,
    handlePaymentClose,
    handlePaymentComplete,
  } = useLandingPricingCheckout();

  // Sync name input when profile loads
  useEffect(() => {
    if (profile?.full_name && nameEditState === 'idle') {
      setNameValue(profile.full_name);
    }
  }, [profile?.full_name, nameEditState]);

  // Sync nickname input when profile loads
  useEffect(() => {
    if (nicknameEditState === 'idle') {
      setNicknameValue(profile?.nickname ?? '');
    }
  }, [profile?.nickname, nicknameEditState]);

  // Fetch invoices when subscription section is visible
  const isPremiumSubscription =
    membership?.type === 'subscription' &&
    (membership.status === 'active' || membership.status === 'cancelled');

  useEffect(() => {
    if (isPremiumSubscription) {
      fetchInvoices();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremiumSubscription]);

  // ── Handlers ───────────────────────────────────────────────

  const handleSaveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (!trimmed) return;
    setNameEditState('saving');
    try {
      await updateProfile({ full_name: trimmed });
      setNameEditState('success');
      setTimeout(() => setNameEditState('idle'), 2000);
    } catch {
      setNameEditState('error');
    }
  }, [nameValue, updateProfile]);

  const handleCancelNameEdit = useCallback(() => {
    setNameEditState('idle');
    setNameValue(profile?.full_name ?? '');
  }, [profile?.full_name]);

  const handleSaveNickname = useCallback(async () => {
    const trimmed = nicknameValue.trim();
    // No change — just close
    if (trimmed === (profile?.nickname ?? '')) {
      setNicknameEditState('idle');
      return;
    }
    setNicknameErrMsg('');
    setNicknameEditState('checking');
    try {
      const available = await checkNicknameAvailable(trimmed, user?.id ?? '');
      if (!available) {
        setNicknameErrMsg('Tato přezdívka je již obsazena. Zkus jinou.');
        setNicknameEditState('error');
        return;
      }
      setNicknameEditState('saving');
      await updateProfile({ nickname: trimmed });
      setNicknameEditState('success');
      setTimeout(() => setNicknameEditState('idle'), 2000);
    } catch {
      setNicknameErrMsg('Nepodařilo se uložit. Zkus to znovu.');
      setNicknameEditState('error');
    }
  }, [nicknameValue, profile?.nickname, user?.id, updateProfile]);

  const handleCancelNicknameEdit = useCallback(() => {
    setNicknameEditState('idle');
    setNicknameValue(profile?.nickname ?? '');
    setNicknameErrMsg('');
  }, [profile?.nickname]);

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

  const handleChangePassword = useCallback(async () => {
    if (!user?.email) return;
    setPasswordState('loading');
    try {
      await resetPassword(user.email);
      setPasswordState('success');
      setTimeout(() => setPasswordState('idle'), 3000);
    } catch {
      setPasswordState('error');
    }
  }, [user?.email, resetPassword]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteState('loading');
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch {
      setDeleteState('error');
    }
  }, [deleteAccount, navigate]);

  const handleCancelSub = useCallback(async () => {
    setCancelSubState('loading');
    clearSubError();
    await cancelSubscription();
    if (subError) {
      setCancelSubState('error');
    } else {
      setCancelSubState('idle');
    }
  }, [cancelSubscription, clearSubError, subError]);

  if (!user) return null;

  // Derive
  const isPremium = membership && membership.plan !== 'ZDARMA';
  const isActiveSub = isPremium && membership?.status === 'active';
  const isCancelledSub = isPremium && membership?.status === 'cancelled';
  const trial = isMembershipTrial(membership);
  const displayName = profile?.full_name ?? user.email ?? '–';
  const avatarInitial = (profile?.full_name ?? user.email ?? '?')[0].toUpperCase();

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="muj-ucet-page">
      <Header />

      <main className="muj-ucet-main">
        <div className="muj-ucet-container">

          {/* ─── 1. IDENTITA ─────────────────────────────────── */}
          <section className="muj-ucet-section" aria-label="Identita">
            <p className="muj-ucet-section__label">Můj účet</p>

            {profileLoading ? (
              <div className="muj-ucet-skeleton">
                <div className="muj-ucet-skeleton__line" style={{ width: '60%' }} />
                <div className="muj-ucet-skeleton__line" style={{ width: '80%' }} />
                <div className="muj-ucet-skeleton__line" style={{ width: '45%' }} />
              </div>
            ) : (
              <>
                {/* ── Display block ── */}
                <div className="muj-ucet-identity">
                  <div className="muj-ucet-identity__avatar" aria-hidden="true">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="muj-ucet-identity__avatar-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="muj-ucet-identity__avatar-placeholder">
                        {avatarInitial}
                      </div>
                    )}
                  </div>

                  <div className="muj-ucet-identity__info">
                    <p className="muj-ucet-identity__name">{displayName}</p>
                    <p className="muj-ucet-identity__email">{user.email}</p>
                    {user.created_at && (
                      <p className="muj-ucet-identity__since">
                        Člen od: {formatDate(user.created_at)}
                      </p>
                    )}
                  </div>
                </div>

                <hr className="muj-ucet-section__divider" />

                {/* ── Celé jméno ── */}
                <div className="muj-ucet-profile__field">
                  <div className="muj-ucet-profile__field-info">
                    <span className="muj-ucet-profile__field-label">Celé jméno</span>
                    {(nameEditState === 'idle' || nameEditState === 'success') && (
                      <span className={`muj-ucet-profile__field-value ${!profile?.full_name ? 'muj-ucet-profile__field-value--empty' : ''}`}>
                        {profile?.full_name ?? '–'}
                      </span>
                    )}
                  </div>
                  {nameEditState === 'idle' && (
                    <button
                      type="button"
                      className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                      onClick={() => { setNameValue(profile?.full_name ?? ''); setNameEditState('editing'); }}
                    >
                      Upravit
                    </button>
                  )}
                  {nameEditState === 'success' && (
                    <span className="muj-ucet-feedback muj-ucet-feedback--success" style={{ margin: 0 }}>
                      Uloženo
                    </span>
                  )}
                </div>

                {(nameEditState === 'editing' || nameEditState === 'saving' || nameEditState === 'error') && (
                  <div className="muj-ucet-profile__edit-form">
                    <input
                      type="text"
                      className="muj-ucet-profile__input"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      placeholder="Celé jméno"
                      autoComplete="name"
                      disabled={nameEditState === 'saving' || isUpdating}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelNameEdit();
                      }}
                    />
                    {nameEditState === 'error' && (
                      <p className="muj-ucet-feedback muj-ucet-feedback--error">
                        Nepodařilo se uložit. Zkus to znovu.
                      </p>
                    )}
                    <div className="muj-ucet-profile__edit-actions">
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--primary muj-ucet-btn--sm"
                        onClick={handleSaveName}
                        disabled={nameEditState === 'saving' || isUpdating || !nameValue.trim()}
                      >
                        {nameEditState === 'saving' || isUpdating ? 'Ukládám...' : 'Uložit'}
                      </button>
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                        onClick={handleCancelNameEdit}
                        disabled={nameEditState === 'saving' || isUpdating}
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Přezdívka ── */}
                <div className="muj-ucet-profile__field">
                  <div className="muj-ucet-profile__field-info">
                    <span className="muj-ucet-profile__field-label">Přezdívka</span>
                    {(nicknameEditState === 'idle' || nicknameEditState === 'success') && (
                      <span className={`muj-ucet-profile__field-value ${!profile?.nickname ? 'muj-ucet-profile__field-value--empty' : ''}`}>
                        {profile?.nickname ?? '–'}
                      </span>
                    )}
                  </div>
                  {nicknameEditState === 'idle' && (
                    <button
                      type="button"
                      className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                      onClick={() => { setNicknameValue(profile?.nickname ?? ''); setNicknameEditState('editing'); setNicknameErrMsg(''); }}
                    >
                      {profile?.nickname ? 'Upravit' : 'Nastavit'}
                    </button>
                  )}
                  {nicknameEditState === 'success' && (
                    <span className="muj-ucet-feedback muj-ucet-feedback--success" style={{ margin: 0 }}>
                      Uloženo
                    </span>
                  )}
                </div>

                {(nicknameEditState === 'editing' || nicknameEditState === 'checking' || nicknameEditState === 'saving' || nicknameEditState === 'error') && (
                  <div className="muj-ucet-profile__edit-form">
                    <input
                      type="text"
                      className="muj-ucet-profile__input"
                      value={nicknameValue}
                      onChange={(e) => { setNicknameValue(e.target.value); setNicknameErrMsg(''); }}
                      placeholder="Přezdívka (nepovinné)"
                      autoComplete="nickname"
                      disabled={nicknameEditState === 'checking' || nicknameEditState === 'saving' || isUpdating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNickname();
                        if (e.key === 'Escape') handleCancelNicknameEdit();
                      }}
                    />
                    {nicknameErrMsg && (
                      <p className="muj-ucet-feedback muj-ucet-feedback--error">{nicknameErrMsg}</p>
                    )}
                    <div className="muj-ucet-profile__edit-actions">
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--primary muj-ucet-btn--sm"
                        onClick={handleSaveNickname}
                        disabled={nicknameEditState === 'checking' || nicknameEditState === 'saving' || isUpdating}
                      >
                        {nicknameEditState === 'checking' ? 'Kontroluji...' : nicknameEditState === 'saving' || isUpdating ? 'Ukládám...' : 'Uložit'}
                      </button>
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                        onClick={handleCancelNicknameEdit}
                        disabled={nicknameEditState === 'checking' || nicknameEditState === 'saving' || isUpdating}
                      >
                        Zrušit
                      </button>
                    </div>
                  </div>
                )}

                {/* ── E-mail ── */}
                <div className="muj-ucet-security__item">
                  <div className="muj-ucet-security__row">
                    <div className="muj-ucet-security__field-info">
                      <span className="muj-ucet-security__field-label">E-mail</span>
                      <span className="muj-ucet-security__field-value">{user.email}</span>
                    </div>
                    {emailChangeState === 'idle' && (
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                        onClick={() => setEmailChangeState('expanded')}
                      >
                        Změnit
                      </button>
                    )}
                  </div>

                  {(emailChangeState === 'expanded' || emailChangeState === 'loading' || emailChangeState === 'error') && (
                    <div className="muj-ucet-security__email-form">
                      <input
                        type="email"
                        className="muj-ucet-security__email-input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Nový e-mail"
                        autoComplete="email"
                        disabled={emailChangeState === 'loading'}
                        autoFocus
                      />
                      {emailChangeState === 'error' && (
                        <p className="muj-ucet-feedback muj-ucet-feedback--error">
                          Nepodařilo se odeslat. Zkontroluj formát nebo zkus jiný email.
                        </p>
                      )}
                      <div className="muj-ucet-security__email-actions">
                        <button
                          type="button"
                          className="muj-ucet-btn muj-ucet-btn--primary muj-ucet-btn--sm"
                          onClick={handleEmailChange}
                          disabled={emailChangeState === 'loading' || !newEmail.trim()}
                        >
                          {emailChangeState === 'loading' ? 'Odesílám...' : 'Odeslat'}
                        </button>
                        <button
                          type="button"
                          className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                          onClick={() => { setEmailChangeState('idle'); setNewEmail(''); }}
                          disabled={emailChangeState === 'loading'}
                        >
                          Zrušit
                        </button>
                      </div>
                    </div>
                  )}

                  {emailChangeState === 'success' && (
                    <p className="muj-ucet-feedback muj-ucet-feedback--success">
                      Potvrzovací odkaz byl odeslán na nový email.
                    </p>
                  )}
                </div>

                {/* ── Heslo ── */}
                <div className="muj-ucet-security__item">
                  <button
                    type="button"
                    className="muj-ucet-security__password-btn"
                    onClick={handleChangePassword}
                    disabled={passwordState === 'loading' || passwordState === 'success'}
                  >
                    {passwordState === 'loading' ? 'Odesílám...' : 'Změnit heslo'}
                  </button>
                  {passwordState === 'success' && (
                    <p className="muj-ucet-feedback muj-ucet-feedback--success">
                      Odkaz byl odeslán na tvůj email.
                    </p>
                  )}
                  {passwordState === 'error' && (
                    <p className="muj-ucet-feedback muj-ucet-feedback--error">
                      Nepodařilo se odeslat, zkus to znovu.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ─── 2. TVŮJ PLÁN ────────────────────────────────── */}
          <section className="muj-ucet-section" aria-label="Tvůj plán">
            <p className="muj-ucet-section__label">Tvůj plán</p>

            {/* ── Varianta A: ZDARMA ── */}
            {!isPremium && (
              <>
                <div className="muj-ucet-plan__header">
                  <span className="muj-ucet-plan__badge muj-ucet-plan__badge--zdarma">
                    Zdarma
                  </span>
                  <span className="muj-ucet-plan__billing-label">Základní přístup</span>
                </div>

                <p className="muj-ucet-plan__upgrade-label" style={{ marginTop: '16px' }}>
                  Chceš odemknout víc? Vyber si tarif:
                </p>

                <BillingToggle
                  value={billingInterval}
                  onChange={setBillingInterval}
                />

                <div className="muj-ucet-plan__upgrade-cards">
                  <PricingCard
                    moduleId="smart"
                    priceId={billingInterval === 'annual' ? PRICE_IDS.smart.annual : PRICE_IDS.smart.monthly}
                    billingInterval={billingInterval}
                    title="SMART"
                    subtitle="Inteligentní doporučení"
                    badge="OBLÍBENÉ"
                    price={billingInterval === 'annual' ? '125 Kč' : '249 Kč'}
                    period="měsíc"
                    priceAnnual={billingInterval === 'annual' ? '125 Kč/měsíc' : undefined}
                    savingsBadge={billingInterval === 'annual' ? 'Ušetříš 1 494 Kč ročně' : undefined}
                    features={[...SMART_FEATURES]}
                    ctaText="Aktivovat →"
                    ctaVariant="primary"
                    highlighted
                    onPaidCTAClick={(priceId, interval, moduleId, title, price) =>
                      openCheckout({ priceId, billingInterval: interval, moduleId, title, price })
                    }
                  />
                  <PricingCard
                    moduleId="ai-coach"
                    priceId={billingInterval === 'annual' ? PRICE_IDS.aiCoach.annual : PRICE_IDS.aiCoach.monthly}
                    billingInterval={billingInterval}
                    title="AI COACH"
                    subtitle="Tvůj osobní AI trenér"
                    badge="PREMIUM"
                    price={billingInterval === 'annual' ? '245 Kč' : '490 Kč'}
                    period="měsíc"
                    priceAnnual={billingInterval === 'annual' ? '245 Kč/měsíc' : undefined}
                    savingsBadge={billingInterval === 'annual' ? 'Ušetříš 2 940 Kč ročně' : undefined}
                    features={[
                      'Osobní AI trenér 24/7',
                      'Neomezený počet zpráv s AI',
                      'Pokročilá analýza dýchání',
                    ]}
                    ctaText="Získat AI Coache →"
                    ctaVariant="primary"
                    highlighted={false}
                  />
                </div>
              </>
            )}

            {/* ── Varianta B: Aktivní předplatné ── */}
            {isActiveSub && membership && (
              <>
                <div className="muj-ucet-plan__header">
                  <span className={`muj-ucet-plan__badge muj-ucet-plan__badge--${getPlanBadgeModifier(membership.plan)}`}>
                    {getPlanLabel(membership.plan)}
                  </span>
                  {trial && (
                    <span className="muj-ucet-plan__badge muj-ucet-plan__badge--trial">
                      Speciální akce
                    </span>
                  )}
                </div>

                <div className="muj-ucet-plan__details">
                  {/* Pro trial nezobrazujeme billing label — info jsou v badges a datech níže */}
                  {!trial && (
                    <p className="muj-ucet-plan__detail muj-ucet-plan__detail--strong">
                      {getBillingLabel(membership)}
                    </p>
                  )}
                  {membership.purchasedAt && (
                    <p className="muj-ucet-plan__detail">
                      Aktivní od: {formatDate(membership.purchasedAt)}
                    </p>
                  )}
                  {membership.expiresAt && (
                    <p className="muj-ucet-plan__detail">
                      {trial
                        ? `Přístup aktivní do: ${formatDate(membership.expiresAt)}`
                        : `Další platba: ${formatDate(membership.expiresAt)}`}
                    </p>
                  )}
                  {trial && (
                    <p className="muj-ucet-plan__detail muj-ucet-plan__detail--trial-note">
                      Toto předplatné ti bylo přiděleno zdarma. Žádné platební údaje nebyly
                      zadány. Po skončení bude třeba předplatné obnovit.
                    </p>
                  )}
                </div>

                {/* ── Trial: upgrade karty ── */}
                {trial && (
                  <div className="muj-ucet-plan__trial-upgrade">
                    <hr className="muj-ucet-section__divider" />
                    <p className="muj-ucet-plan__upgrade-label">
                      Zachovej přístup a vyber si tarif:
                    </p>
                    <BillingToggle
                      value={billingInterval}
                      onChange={setBillingInterval}
                    />
                    <div className="muj-ucet-plan__upgrade-cards">
                      <PricingCard
                        moduleId="smart"
                        priceId={billingInterval === 'annual' ? PRICE_IDS.smart.annual : PRICE_IDS.smart.monthly}
                        billingInterval={billingInterval}
                        title="SMART"
                        subtitle="Inteligentní doporučení"
                        badge="OBLÍBENÉ"
                        price="249 Kč"
                        period="měsíc"
                        priceAnnual={billingInterval === 'annual' ? '125 Kč/měsíc' : undefined}
                        savingsBadge={billingInterval === 'annual' ? 'Ušetříš 1 494 Kč ročně' : undefined}
                        features={[...SMART_FEATURES]}
                        ctaText="Zachovat přístup →"
                        ctaVariant="primary"
                        highlighted
                        onPaidCTAClick={(priceId, interval, moduleId, title, price) =>
                          openCheckout({ priceId, billingInterval: interval, moduleId, title, price })
                        }
                      />
                      <PricingCard
                        moduleId="ai-coach"
                        priceId={billingInterval === 'annual' ? PRICE_IDS.aiCoach.annual : PRICE_IDS.aiCoach.monthly}
                        billingInterval={billingInterval}
                        title="AI COACH"
                        subtitle="Tvůj osobní AI trenér"
                        badge="PREMIUM"
                        price="490 Kč"
                        period="měsíc"
                        priceAnnual={billingInterval === 'annual' ? '245 Kč/měsíc' : undefined}
                        savingsBadge={billingInterval === 'annual' ? 'Ušetříš 2 940 Kč ročně' : undefined}
                        features={[
                          'Osobní AI trenér 24/7',
                          'Neomezený počet zpráv s AI',
                          'Pokročilá analýza dýchání',
                          'Prioritní podpora',
                        ]}
                        ctaText="Zachovat přístup →"
                        ctaVariant="primary"
                        highlighted={false}
                        comingSoon
                        onComingSoonCTA={() => setShowWaitlistModal(true)}
                      />
                    </div>
                  </div>
                )}

                {/* "Zrušit předplatné" skryto pro trial — uživatel nic neplatí */}
                {!trial && (
                  <div className="muj-ucet-plan__actions">
                    {cancelSubState === 'idle' && (
                      <button
                        type="button"
                        className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                        onClick={() => setCancelSubState('confirm')}
                      >
                        Zrušit předplatné
                      </button>
                    )}

                    {(cancelSubState === 'confirm' || cancelSubState === 'loading' || cancelSubState === 'error') && (
                      <div className="muj-ucet-cancel-confirm" role="alertdialog" aria-labelledby="cancel-sub-title">
                        <p id="cancel-sub-title" className="muj-ucet-cancel-confirm__title">
                          Opravdu zrušit předplatné?
                        </p>
                        <p className="muj-ucet-cancel-confirm__text">
                          Předplatné zůstane aktivní do konce zaplaceného období
                          {membership.expiresAt && ` (${formatDate(membership.expiresAt)})`}.
                          Poté přijdeš o prémiové funkce.
                        </p>
                        {(cancelSubState === 'error' || subError) && (
                          <p className="muj-ucet-feedback muj-ucet-feedback--error" role="alert">
                            {subError ?? 'Nepodařilo se zrušit. Zkus to znovu nebo nás kontaktuj.'}
                          </p>
                        )}
                        <div className="muj-ucet-cancel-confirm__actions">
                          <button
                            type="button"
                            className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                            onClick={() => { setCancelSubState('idle'); clearSubError(); }}
                            disabled={cancelSubState === 'loading' || cancelState === 'loading'}
                          >
                            Ponechat předplatné
                          </button>
                          <button
                            type="button"
                            className="muj-ucet-btn muj-ucet-btn--danger muj-ucet-btn--sm"
                            onClick={handleCancelSub}
                            disabled={cancelSubState === 'loading' || cancelState === 'loading'}
                          >
                            {cancelSubState === 'loading' || cancelState === 'loading'
                              ? 'Ruším...'
                              : 'Potvrdit zrušení'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Varianta C: Zrušené předplatné ── */}
            {isCancelledSub && membership && (
              <>
                <div className="muj-ucet-plan__header">
                  <span className={`muj-ucet-plan__badge muj-ucet-plan__badge--${getPlanBadgeModifier(membership.plan)}`}>
                    {getPlanLabel(membership.plan)}
                  </span>
                  <span className="muj-ucet-plan__badge muj-ucet-plan__badge--cancelled">
                    Zrušeno
                  </span>
                </div>

                <div className="muj-ucet-plan__details">
                  {membership.expiresAt && (
                    <p className="muj-ucet-plan__detail muj-ucet-plan__detail--cancelled">
                      Přístup aktivní do: {formatDate(membership.expiresAt)}
                    </p>
                  )}
                </div>

                <div className="muj-ucet-plan__actions">
                  <button
                    type="button"
                    className="muj-ucet-btn muj-ucet-btn--primary muj-ucet-btn--sm"
                    onClick={reactivateSubscription}
                    disabled={reactivateState === 'loading'}
                  >
                    {reactivateState === 'loading' ? 'Obnovuji...' : 'Obnovit předplatné'}
                  </button>
                </div>

                {subError && reactivateState === 'error' && (
                  <p className="muj-ucet-feedback muj-ucet-feedback--error" role="alert">
                    {subError}
                  </p>
                )}
              </>
            )}
          </section>

          {/* ─── 3. FAKTURACE — skryto pro trial (žádné faktury neexistují) ── */}
          {isPremiumSubscription && !trial && (
            <section className="muj-ucet-section" aria-label="Fakturace">
              <p className="muj-ucet-section__label">Fakturace</p>

              {isLoadingInvoices ? (
                <div className="muj-ucet-invoice-skeleton">
                  <div className="muj-ucet-invoice-skeleton__row" style={{ width: '100%' }} />
                  <div className="muj-ucet-invoice-skeleton__row" style={{ width: '92%' }} />
                  <div className="muj-ucet-invoice-skeleton__row" style={{ width: '80%' }} />
                </div>
              ) : invoices.length === 0 ? (
                <p className="muj-ucet-invoices__empty">Zatím žádné faktury.</p>
              ) : (
                <div className="muj-ucet-invoice-table" role="list">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="muj-ucet-invoice-row" role="listitem">
                      <span className="muj-ucet-invoice-row__date">
                        {formatDate(inv.date)}
                      </span>
                      <span className="muj-ucet-invoice-row__desc">
                        {inv.description}
                      </span>
                      <span className="muj-ucet-invoice-row__amount">
                        {formatAmount(inv.amount_czk)}
                      </span>
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="muj-ucet-invoice-row__pdf"
                          aria-label={`Stáhnout fakturu z ${formatDate(inv.date)}`}
                        >
                          PDF
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 3 }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ─── 4. MOJE PROGRAMY ────────────────────────────── */}
          {!modulesLoading && ownedModules.length > 0 && (
            <section className="muj-ucet-section" aria-label="Moje programy">
              <p className="muj-ucet-section__label">
                Moje programy
                <span className="muj-ucet-section__count">{ownedModules.length}</span>
              </p>
              <ul className="muj-ucet-modules-grid" role="list">
                {ownedModules.map((mod) => {
                  const thumbColor = mod.color ?? 'var(--color-primary)';
                  const iconValue = mod.icon ?? '';
                  const isEmoji = iconValue.length <= 2 && /\p{Emoji}/u.test(iconValue);
                  const thumbLabel = isEmoji ? iconValue : mod.name.charAt(0).toUpperCase();
                  return (
                    <li key={mod.module_id} className="muj-ucet-module-card" role="listitem">
                      <button
                        type="button"
                        className="muj-ucet-module-card__btn"
                        onClick={() => navigate(getModuleDeepLink(mod.module_id))}
                        aria-label={`Otevřít program ${mod.name}`}
                      >
                        <div
                          className="muj-ucet-module-card__thumb"
                          style={{ '--module-color': thumbColor } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          {mod.cover_image_url ? (
                            <img
                              src={mod.cover_image_url}
                              alt=""
                              className="muj-ucet-module-card__thumb-img"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="muj-ucet-module-card__thumb-label">{thumbLabel}</span>
                          )}
                        </div>
                        <div className="muj-ucet-module-card__info">
                          <p className="muj-ucet-module-card__name">{mod.name}</p>
                          <p className="muj-ucet-module-card__meta">
                            {mod.purchase_type === 'lifetime' ? 'Doživotní přístup' : 'Předplatné'}
                            {' · '}
                            {formatDate(mod.purchased_at)}
                          </p>
                        </div>
                        <svg
                          className="muj-ucet-module-card__arrow"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ─── 5. ZÓNA NEBEZPEČÍ (vždy poslední) ──────────── */}
          <section className="muj-ucet-danger-section" aria-label="Smazat účet">
            {deleteState === 'idle' && (
              <button
                type="button"
                className="muj-ucet-btn muj-ucet-btn--danger muj-ucet-btn--sm"
                onClick={() => setDeleteState('confirm')}
              >
                Smazat účet
              </button>
            )}

            {(deleteState === 'confirm' || deleteState === 'loading' || deleteState === 'error') && (
              <div className="muj-ucet-danger__confirm" role="alertdialog" aria-labelledby="delete-account-title">
                <p id="delete-account-title" className="muj-ucet-danger__confirm-title">
                  Smazat účet?
                </p>
                <p className="muj-ucet-danger__confirm-text">
                  Tento krok je nevratný. Tvůj účet a všechna data budou trvale odstraněna.
                  {membership?.type === 'subscription' && membership.status === 'active' && (
                    <> Aktivní předplatné bude zrušeno na konci zaplaceného období.</>
                  )}
                </p>
                {deleteState === 'error' && (
                  <p className="muj-ucet-feedback muj-ucet-feedback--error">
                    Smazání se nezdařilo. Kontaktuj nás na podpora@dechbar.cz
                  </p>
                )}
                <div className="muj-ucet-danger__confirm-actions">
                  <button
                    type="button"
                    className="muj-ucet-btn muj-ucet-btn--ghost muj-ucet-btn--sm"
                    onClick={() => setDeleteState('idle')}
                    disabled={deleteState === 'loading'}
                  >
                    Zrušit
                  </button>
                  <button
                    type="button"
                    className="muj-ucet-btn muj-ucet-btn--destructive muj-ucet-btn--sm"
                    onClick={handleDeleteConfirm}
                    disabled={deleteState === 'loading'}
                  >
                    {deleteState === 'loading' ? 'Mazání...' : 'Smazat navždy'}
                  </button>
                </div>
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />

      {/* AI Coach Waitlist Modal */}
      {showWaitlistModal && (
        <AiCoachWaitlistModal onClose={() => setShowWaitlistModal(false)} />
      )}

      {/* SMART checkout (sdílený flow jako na landing; uživatel je přihlášen → email modal se nezobrazí) */}
      <EmailInputModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSubmit={handleEmailSubmit}
        isLoading={loadingEmail}
      />
      <PaymentModal
        isOpen={paymentOpen}
        onClose={handlePaymentClose}
        onPaymentComplete={handlePaymentComplete}
        clientSecret={clientSecret}
      />

      <CheckoutThankYouModal
        isOpen={thankYouModalOpen}
        onClose={() => {
          closeThankYouModal();
          navigate('/');
        }}
      />
    </div>
  );
}
