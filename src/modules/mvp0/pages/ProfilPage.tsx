/**
 * ProfilPage - User Profile Page
 *
 * Dedicated fullscreen page at /app/profil.
 * Apple premium style — calm, minimal, functional.
 *
 * Sections:
 * 1. Hero — avatar, VIP badge, name, nickname, email, role badge + edit mode
 * 2. Zdravotní data — KP stats grid + measure button
 * 3. Pozvat přítele — referral code + copy/share + stats
 *
 * @package DechBar_App
 * @subpackage Modules/MVP0/Pages
 * @since 0.4.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/platform/auth/authStore';
import { useUserState } from '@/platform/user/userStateStore';
import { useNavigation } from '@/platform/hooks/useNavigation';
import { useProfile, checkNicknameAvailable } from '@/platform/api/useProfile';
import { useReferral } from '@/platform/api/useReferral';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { usePersonalRecords, formatMinutes } from '@/platform/analytics';
import { getDisplayRole, isVIPMember } from '@/utils/profile';
import { PageLayout } from '@/platform/layouts/PageLayout';

// ============================================================
// Types
// ============================================================

interface EditState {
  full_name: string;
  nickname: string;
  vocative_override: string;
  avatarFile: File | null;
  avatarPreview: string | null;
}

// ============================================================
// Helpers
// ============================================================

function formatKPValue(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '–';
  return `${seconds}s`;
}

function formatJoinDate(isoString: string): string {
  const date = new Date(isoString);
  // Czech locale needs a day present to output the genitive month form ("ledna" not "leden").
  // We include the day, then strip it: "1. ledna 2026" → "ledna 2026".
  const withDay = date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
  return withDay.replace(/^\d+\.\s*/, '');
}

// ============================================================
// Component
// ============================================================

export function ProfilPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { roles } = useUserState();
  const { openKPDetail } = useNavigation();
  const { profile, isLoading: profileLoading, updateProfile, isUpdating, uploadAvatar } = useProfile();
  const { referralLink, totalReferred, copyCode, shareCode, canShare } = useReferral();
  const { currentKP, bestKP, totalMeasurements } = useKPMeasurements();
  const { records } = usePersonalRecords(user?.id);

  // ── Edit mode state ───────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    full_name: '',
    nickname: '',
    vocative_override: '',
    avatarFile: null,
    avatarPreview: null,
  });
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nicknameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Enter edit mode ───────────────────────────────────────
  const handleEditStart = useCallback(() => {
    setEditState({
      full_name: profile?.full_name ?? '',
      nickname: profile?.nickname ?? '',
      vocative_override: profile?.vocative_override ?? '',
      avatarFile: null,
      avatarPreview: null,
    });
    setNicknameError(null);
    setSaveError(null);
    setIsEditMode(true);
  }, [profile]);

  // ── Cancel edit mode ──────────────────────────────────────
  const handleEditCancel = useCallback(() => {
    setIsEditMode(false);
    setNicknameError(null);
    setSaveError(null);
    if (editState.avatarPreview) {
      URL.revokeObjectURL(editState.avatarPreview);
    }
  }, [editState.avatarPreview]);

  // ── Nickname debounce check ───────────────────────────────
  const handleNicknameChange = useCallback(
    (value: string) => {
      setEditState((prev) => ({ ...prev, nickname: value }));
      setNicknameError(null);

      if (nicknameDebounceRef.current) clearTimeout(nicknameDebounceRef.current);
      if (!value.trim() || !user?.id) return;

      setNicknameChecking(true);
      nicknameDebounceRef.current = setTimeout(async () => {
        try {
          const available = await checkNicknameAvailable(value.trim(), user.id);
          if (!available) {
            setNicknameError('Přezdívka je obsazena, zkus jinou');
          }
        } finally {
          setNicknameChecking(false);
        }
      }, 500);
    },
    [user?.id]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (nicknameDebounceRef.current) clearTimeout(nicknameDebounceRef.current);
    };
  }, []);

  // ── Avatar file pick ──────────────────────────────────────
  const handleAvatarClick = useCallback(() => {
    if (isEditMode) fileInputRef.current?.click();
  }, [isEditMode]);

  const handleAvatarFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (editState.avatarPreview) URL.revokeObjectURL(editState.avatarPreview);
      const preview = URL.createObjectURL(file);
      setEditState((prev) => ({ ...prev, avatarFile: file, avatarPreview: preview }));
    },
    [editState.avatarPreview]
  );

  // ── Save ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (nicknameError || nicknameChecking) return;
    setSaveError(null);

    try {
      // Upload avatar first if changed
      if (editState.avatarFile) {
        await uploadAvatar(editState.avatarFile);
      }

      // Update profile data
      await updateProfile({
        full_name: editState.full_name.trim() || undefined,
        nickname: editState.nickname,
        vocative_override: editState.vocative_override,
      });

      setIsEditMode(false);
      if (editState.avatarPreview) URL.revokeObjectURL(editState.avatarPreview);
    } catch {
      setSaveError('Uložení selhalo, zkus to znovu');
    }
  }, [editState, nicknameError, nicknameChecking, updateProfile, uploadAvatar]);

  // ── Copy code toast ───────────────────────────────────────
  const handleCopy = useCallback(async () => {
    await copyCode();
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  }, [copyCode]);

  // ── Derived values ────────────────────────────────────────
  const displayName = profile?.full_name ?? user?.full_name ?? user?.email ?? '';
  const displayNickname = profile?.nickname ?? null;
  const displayEmail = profile?.email ?? user?.email ?? '';
  const avatarUrl = editState.avatarPreview ?? profile?.avatar_url ?? user?.avatar_url ?? null;
  const initials = displayName
    ? displayName
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';
  const displayRole = getDisplayRole(roles);
  const vipBadge = isVIPMember(roles);

  // ── Right action for PageLayout ───────────────────────────
  const rightAction = isEditMode
    ? {
        label: 'Uložit',
        onClick: handleSave,
        variant: 'primary' as const,
        loading: isUpdating,
        disabled: !!nicknameError || nicknameChecking,
      }
    : {
        label: 'Upravit',
        onClick: handleEditStart,
        variant: 'ghost' as const,
      };

  if (profileLoading) {
    return (
      <PageLayout title="Profil" onBack={() => navigate(-1)}>
        <div className="profil-loading" aria-label="Načítám profil">
          <span className="profil-loading__spinner" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Profil"
      onBack={() => navigate(-1)}
      rightAction={rightAction}
      className="profil-page"
    >
      {/* ─── HERO SECTION ─────────────────────────────────── */}
      <section className="profil-hero">

        {/* Avatar */}
        <div className="profil-avatar-wrapper">
          <button
            className={`profil-avatar${avatarUrl ? '' : ' profil-avatar--placeholder'}${isEditMode ? ' profil-avatar--editable' : ''}`}
            onClick={handleAvatarClick}
            type="button"
            aria-label={isEditMode ? 'Změnit profilový obrázek' : undefined}
            disabled={!isEditMode}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="profil-avatar__img"
              />
            ) : (
              <span className="profil-avatar__initials" aria-hidden="true">
                {initials}
              </span>
            )}

            {/* Edit overlay */}
            {isEditMode && (
              <span className="profil-avatar__upload-overlay" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </span>
            )}
          </button>

          {/* VIP badge — gold crown */}
          {vipBadge && (
            <span className="profil-avatar__vip-badge" aria-label="VIP člen">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M3 18l3-9 6 4.5L18 9l3 9H3z"/>
                <circle cx="3" cy="11" r="2" fill="currentColor"/>
                <circle cx="21" cy="11" r="2" fill="currentColor"/>
                <circle cx="12" cy="6" r="2" fill="currentColor"/>
              </svg>
            </span>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="profil-avatar__file-input"
            onChange={handleAvatarFileChange}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {/* View mode info */}
        {!isEditMode ? (
          <div className="profil-hero__info">
            <p className="profil-hero__name">{displayName}</p>
            {displayNickname && (
              <p className="profil-hero__nickname">@{displayNickname}</p>
            )}
            <p className="profil-hero__email">{displayEmail}</p>
            {displayRole && (
              <span className="profil-hero__role-badge">{displayRole}</span>
            )}
            {user?.created_at && (
              <p className="profil-hero__joined">Člen od {formatJoinDate(user.created_at)}</p>
            )}
          </div>
        ) : (
          /* Edit mode fields */
          <div className="profil-edit-fields">
            {/* Full name */}
            <div className="profil-edit-field">
              <label className="profil-edit-field__label" htmlFor="profil-full-name">
                Jméno a příjmení
              </label>
              <input
                id="profil-full-name"
                type="text"
                className="profil-edit-field__input"
                value={editState.full_name}
                onChange={(e) => setEditState((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Zadej jméno a příjmení"
                maxLength={80}
                autoComplete="name"
              />
            </div>

            {/* Nickname */}
            <div className="profil-edit-field">
              <label className="profil-edit-field__label" htmlFor="profil-nickname">
                Přezdívka <span className="profil-edit-field__optional">(volitelná)</span>
              </label>
              <div className="profil-edit-field__input-wrapper">
                <input
                  id="profil-nickname"
                  type="text"
                  className={`profil-edit-field__input${nicknameError ? ' profil-edit-field__input--error' : ''}`}
                  value={editState.nickname}
                  onChange={(e) => handleNicknameChange(e.target.value)}
                  placeholder="Tvůj alias v žebříčku"
                  maxLength={30}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {nicknameChecking && (
                  <span className="profil-edit-field__checking" aria-label="Ověřuji přezdívku" />
                )}
              </div>
              {nicknameError ? (
                <p className="profil-edit-field__error">{nicknameError}</p>
              ) : (
                <p className="profil-edit-field__helper">
                  Max. 30 znaků. Použito v žebříčku nejlepších dýchačů.
                </p>
              )}
            </div>

            {/* Vocative override */}
            <div className="profil-edit-field">
              <label className="profil-edit-field__label" htmlFor="profil-vocative">
                Oslovení <span className="profil-edit-field__optional">(volitelné)</span>
              </label>
              <input
                id="profil-vocative"
                type="text"
                className="profil-edit-field__input"
                value={editState.vocative_override}
                onChange={(e) => setEditState((p) => ({ ...p, vocative_override: e.target.value }))}
                placeholder="Např. Martine, Jano, Karle..."
                maxLength={40}
                autoComplete="off"
              />
              <p className="profil-edit-field__helper">
                Jak tě oslovit? Nechej prázdné pro automatické.
              </p>
            </div>

            {/* Save error */}
            {saveError && (
              <p className="profil-edit-field__error profil-edit-field__error--global">{saveError}</p>
            )}

            {/* Cancel button */}
            <button
              type="button"
              className="profil-edit__cancel-btn"
              onClick={handleEditCancel}
              disabled={isUpdating}
            >
              Zrušit
            </button>
          </div>
        )}
      </section>

      {/* ─── KP SECTION ───────────────────────────────────── */}
      {!isEditMode && (
        <section className="profil-section profil-kp-section">
          <h2 className="profil-section__label">Zdravotní data</h2>

          {/* 3 stat tiles */}
          <div className="profil-kp-grid">
            <div className="profil-kp-tile">
              <span className="profil-kp-value">{formatKPValue(currentKP)}</span>
              <span className="profil-kp-label">Aktuální KP</span>
            </div>
            <div className="profil-kp-tile profil-kp-tile--best">
              <span className="profil-kp-value">{formatKPValue(bestKP > 0 ? bestKP : null)}</span>
              <span className="profil-kp-label">Nejlepší KP</span>
            </div>
            <div className="profil-kp-tile">
              <span className="profil-kp-value">{totalMeasurements > 0 ? String(totalMeasurements) : '–'}</span>
              <span className="profil-kp-label">Měření</span>
            </div>
          </div>

          {/* Measure KP button */}
          <button
            type="button"
            className="profil-kp-measure-btn"
            onClick={openKPDetail}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Změřit KP
          </button>

          {/* Osobní rekordy */}
          {records && (
            <div className="profil-records">
              <div className="profil-records__label">Osobní rekordy</div>
              <div className="profil-records__grid">
                <div className="profil-records__tile">
                  <span className="profil-records__desc">Nejdelší streak</span>
                  <span className="profil-records__value">
                    {records.longestStreak}{' '}
                    <span className="profil-records__unit">dní</span>
                  </span>
                </div>
                <div className="profil-records__tile">
                  <span className="profil-records__desc">Nejlepší den</span>
                  <span className="profil-records__value">{formatMinutes(records.bestDayMinutes)}</span>
                </div>
                <div className="profil-records__tile">
                  <span className="profil-records__desc">Nejdelší sezení</span>
                  <span className="profil-records__value">{formatMinutes(records.bestSessionMinutes)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Health questionnaire placeholder ────────────── */}
          {/* TODO: wire up to real questionnaire component when built */}
          <div className="profil-kp-questionnaire" aria-label="Zdravotní dotazník — brzy dostupné">
            <div className="profil-kp-questionnaire__icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="profil-kp-questionnaire__info">
              <p className="profil-kp-questionnaire__title">Zdravotní dotazník</p>
              <p className="profil-kp-questionnaire__status">Nevyplněno</p>
            </div>
            <span className="profil-kp-questionnaire__badge">Připravujeme</span>
          </div>
        </section>
      )}

      {/* ─── ÚČET & PŘEDPLATNÉ ────────────────────────────── */}
      {!isEditMode && (
        <section className="profil-section profil-account-section">
          <h2 className="profil-section__label">Předplatné a programy</h2>
          <p className="profil-account__note">
            Informace o svém předplatném a zakoupených programech najdeš na stránce Účet.
          </p>
          <button
            type="button"
            className="profil-account__btn"
            onClick={() => navigate('/app/ucet')}
          >
            <span>Přejít na Účet</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </section>
      )}

      {/* ─── REFERRAL SECTION ─────────────────────────────── */}
      {!isEditMode && (
        <section className="profil-section profil-referral-section">
          <h2 className="profil-section__label">Pozvat přítele</h2>

          {/* Code display + full link */}
          {referralLink ? (
            <>
              {/* Referral link — the only thing user needs to share */}
              <div className="profil-referral__link-box">
                <p className="profil-referral__link-url" aria-label="Tvůj referral odkaz">
                  {referralLink}
                </p>
              </div>

              {/* Actions */}
              <div className="profil-referral__actions">
                <button
                  type="button"
                  className="profil-referral__action-btn"
                  onClick={handleCopy}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  {copyToast ? 'Zkopírováno!' : 'Kopírovat odkaz'}
                </button>

                {canShare && (
                  <button
                    type="button"
                    className="profil-referral__action-btn profil-referral__action-btn--ghost"
                    onClick={shareCode}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Sdílet
                  </button>
                )}
              </div>

              {/* Stats — only count shown, revenue is internal data */}
              <div className="profil-referral__stats">
                {totalReferred === 0 ? (
                  <p className="profil-referral__stats-empty">
                    Zatím nikdo. Pošli odkaz příteli!
                  </p>
                ) : (
                  <p className="profil-referral__stat">
                    Pozváno přátel: <strong>{totalReferred}</strong>
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="profil-referral__loading">Načítám odkaz...</p>
          )}
        </section>
      )}
    </PageLayout>
  );
}
