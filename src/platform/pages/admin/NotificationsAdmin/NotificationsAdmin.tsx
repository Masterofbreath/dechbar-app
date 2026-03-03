/**
 * NotificationsAdmin — Admin sekce pro správu notifikací
 *
 * Tři taby:
 *  1. Přehled     — tabulka odeslaných notifikací + read rate
 *  2. Nová zpráva — formulář pro vytvoření a odeslání notifikace
 *  3. Automatické — správa auto-triggerů (zapnout/vypnout, edit textu)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/NotificationsAdmin
 */

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadService } from '@/platform/services/upload/uploadService';
import { renderMessageMarkdown } from '@/utils/renderMessageMarkdown';
import {
  getNotifications,
  createNotification,
  sendScheduledNotification,
  getAutoTriggers,
  updateAutoTrigger,
  getAkademieCategoriesForAdmin,
  getAkademieProgramsForAdmin,
  getAvailableRoles,
  adminDeleteNotification,
  adminUpdateNotification,
  type UpdateNotificationPayload,
} from '@/platform/services/admin/notificationsAdminApi';
import type {
  AdminNotification,
  CreateNotificationPayload,
  NotificationAutoTrigger,
  NotificationType,
  NotificationTargetAudience,
  NotificationTier,
} from '@/platform/api/notificationTypes';
import './NotificationsAdmin.css';

type Tab = 'overview' | 'compose' | 'auto';

// Czech labels for auto-triggers
const TRIGGER_LABELS: Record<string, string> = {
  kp_record: 'KP rekord',
  purchase: 'Potvrzení nákupu',
  streak_7: 'Streak 7 dní',
  streak_21: 'Streak 21 dní',
  daily_reminder: 'Denní připomenutí',
};

const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO DechBaru',
  admin: 'Administrátor',
  teacher: 'Lektor DechBaru',
  student: 'Student DechBaru',
  member: 'Člen DechBaru',
  vip_member: 'VIP Člen',
};

const TYPE_OPTIONS: { value: NotificationType; label: string }[] = [
  { value: 'system', label: 'Systémová' },
  { value: 'promo', label: 'Motivace' },
  { value: 'reminder', label: 'Upozornění' },
];

// ============================================================
// Tab: Přehled
// ============================================================

// Edit modal state type
type EditState = {
  id: string;
  title: string;
  message: string;
  action_url: string;
  action_label: string;
} | null;

function OverviewTab() {
  const queryClient = useQueryClient();
  const [editState, setEditState] = useState<EditState>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: getNotifications,
  });

  const sendNowMutation = useMutation({
    mutationFn: sendScheduledNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: adminDeleteNotification,
    onSuccess: () => {
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateNotificationPayload }) =>
      adminUpdateNotification(id, updates),
    onSuccess: () => {
      setEditState(null);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    },
  });

  const openEdit = (n: AdminNotification) => {
    setEditState({
      id: n.id,
      title: n.title,
      message: n.message,
      action_url: n.action_url ?? '',
      action_label: n.action_label ?? '',
    });
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editState) return;
    editMutation.mutate({
      id: editState.id,
      updates: {
        title: editState.title,
        message: editState.message,
        action_url: editState.action_url || null,
        action_label: editState.action_label || null,
      },
    });
  };

  if (isLoading) return <div className="notif-admin__loading">Načítám...</div>;
  if (error) return <div className="notif-admin__error">Chyba při načítání notifikací.</div>;
  if (notifications.length === 0) return <div className="notif-admin__empty">Zatím žádné zprávy</div>;

  return (
    <>
      <div className="notif-admin__table-wrap">
        <table className="notif-admin__table">
          <thead>
            <tr>
              <th>Název</th>
              <th>Typ</th>
              <th>Targeting</th>
              <th>Odesláno / Naplánováno</th>
              <th>Přečteno</th>
              <th>Prokliknutí</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n: AdminNotification) => {
              const isPending = !n.sent_at;
              const hasCta = !!n.action_url;
              const targetLabel =
                n.target_audience === 'all' ? 'Všichni' :
                n.target_audience === 'kp' ? `KP ≥ ${n.target_kp_min}s` :
                n.target_tier ?? n.target_role ?? '—';
              return (
                <tr key={n.id} className={isPending ? 'notif-admin__row--pending' : ''}>
                  <td className="notif-admin__table-title">
                    {n.is_pinned && (
                      <svg className="notif-admin__pin-icon" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-label="Pinnováno" title="Pinnováno">
                        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                      </svg>
                    )}
                    {n.title}
                  </td>
                  <td>
                    <span className={`notif-admin__badge notif-admin__badge--${n.type}`}>
                      {TYPE_OPTIONS.find((t) => t.value === n.type)?.label ?? n.type}
                    </span>
                  </td>
                  <td>{targetLabel}</td>
                  <td>
                    {isPending ? (
                      <span className="notif-admin__pending-label">
                        {n.scheduled_at
                          ? `Naplánováno: ${new Date(n.scheduled_at).toLocaleString('cs-CZ')}`
                          : 'Čeká na odeslání'}
                      </span>
                    ) : (
                      new Date(n.sent_at!).toLocaleString('cs-CZ')
                    )}
                  </td>
                  <td>
                    {!isPending && n.total_count && n.total_count > 0
                      ? `${n.read_count ?? 0} / ${n.total_count} (${Math.round(((n.read_count ?? 0) / n.total_count) * 100)} %)`
                      : '—'}
                  </td>
                  <td>
                    {hasCta && !isPending && n.total_count && n.total_count > 0
                      ? `${n.cta_clicked_count ?? 0} / ${n.total_count} (${Math.round(((n.cta_clicked_count ?? 0) / n.total_count) * 100)} %)`
                      : hasCta ? '—' : <span className="notif-admin__no-cta">bez CTA</span>}
                  </td>
                  <td className="notif-admin__row-actions">
                    {isPending && (
                      <button
                        className="notif-admin__send-now-btn"
                        onClick={() => sendNowMutation.mutate(n.id)}
                        disabled={sendNowMutation.isPending}
                        title="Odeslat ihned"
                      >
                        {sendNowMutation.isPending ? '...' : 'Odeslat nyní'}
                      </button>
                    )}
                    <button
                      className="notif-admin__action-btn notif-admin__action-btn--edit"
                      onClick={() => openEdit(n)}
                      title="Upravit notifikaci"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {deleteConfirmId === n.id ? (
                      <span className="notif-admin__delete-confirm">
                        <button
                          className="notif-admin__action-btn notif-admin__action-btn--confirm"
                          onClick={() => deleteMutation.mutate(n.id)}
                          disabled={deleteMutation.isPending}
                          title="Potvrdit smazání"
                        >
                          {deleteMutation.isPending ? '...' : 'Smazat'}
                        </button>
                        <button
                          className="notif-admin__action-btn notif-admin__action-btn--cancel"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Zrušit
                        </button>
                      </span>
                    ) : (
                      <button
                        className="notif-admin__action-btn notif-admin__action-btn--delete"
                        onClick={() => setDeleteConfirmId(n.id)}
                        title="Smazat notifikaci"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editState && (
        <div className="notif-admin__modal-overlay" onClick={() => setEditState(null)}>
          <div className="notif-admin__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="notif-admin__modal-title">Upravit notifikaci</h3>
            <p className="notif-admin__modal-hint">
              Změna se projeví všem uživatelům, kteří notifikaci ještě nesmazali.
            </p>
            <form onSubmit={submitEdit} className="notif-admin__modal-form">
              <label className="notif-admin__label">
                Název
                <input
                  className="notif-admin__input"
                  value={editState.title}
                  onChange={(e) => setEditState((s) => s && ({ ...s, title: e.target.value }))}
                  required
                  maxLength={120}
                />
              </label>
              <label className="notif-admin__label">
                Zpráva
                <textarea
                  className="notif-admin__textarea"
                  value={editState.message}
                  onChange={(e) => setEditState((s) => s && ({ ...s, message: e.target.value }))}
                  required
                  maxLength={300}
                  rows={3}
                />
              </label>
              <label className="notif-admin__label">
                CTA URL (volitelné)
                <input
                  className="notif-admin__input"
                  value={editState.action_url}
                  onChange={(e) => setEditState((s) => s && ({ ...s, action_url: e.target.value }))}
                  placeholder="/app/... nebo https://..."
                />
              </label>
              <label className="notif-admin__label">
                CTA Label (volitelné)
                <input
                  className="notif-admin__input"
                  value={editState.action_label}
                  onChange={(e) => setEditState((s) => s && ({ ...s, action_label: e.target.value }))}
                  placeholder="např. Vstup"
                  maxLength={30}
                />
              </label>
              {editMutation.isError && (
                <p className="notif-admin__error-msg">Uložení se nezdařilo. Zkus to znovu.</p>
              )}
              <div className="notif-admin__modal-actions">
                <button type="button" className="notif-admin__btn notif-admin__btn--secondary" onClick={() => setEditState(null)}>
                  Zrušit
                </button>
                <button type="submit" className="notif-admin__btn notif-admin__btn--primary" disabled={editMutation.isPending}>
                  {editMutation.isPending ? 'Ukládám...' : 'Uložit změny'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================
// Tab: Nová zpráva
// ============================================================

const EMPTY_FORM: CreateNotificationPayload = {
  type: 'system',
  title: '',
  message: '',
  action_url: null,
  action_label: null,
  image_url: null,
  is_pinned: false,
  target_audience: 'all',
  target_role: null,
  target_tier: null,
  target_kp_min: null,
  scheduled_at: null,
};

// Sekce (tabs) dostupné jako deep link
const SECTION_OPTIONS = [
  { label: 'Vybrat sekci...', value: '' },
  { label: 'Dnes', value: '/app', tab: null },
  { label: 'Cvičit', value: '/app?tab=cvicit', tab: 'cvicit' },
  { label: 'Akademie', value: '/app?tab=akademie', tab: 'akademie' },
  { label: 'Pokrok', value: '/app?tab=pokrok', tab: 'pokrok' },
  { label: '—', value: 'separator', tab: null },
  { label: 'Profil', value: '/app/profil', tab: null },
  { label: 'Účet', value: '/app/ucet', tab: null },
  { label: 'Nastavení', value: '/app/settings', tab: null },
  { label: 'O aplikaci', value: '/app/about', tab: null },
  { label: '—', value: 'separator2', tab: null },
  { label: 'Vlastní URL...', value: 'custom', tab: null },
];

// ============================================================
// URL Picker — kaskádový výběr: sekce → program (Akademie)
// ============================================================

interface UrlPickerProps {
  value: string | null;
  onChange: (url: string) => void;
}

function UrlPicker({ value, onChange }: UrlPickerProps) {
  const [section, setSection] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const isAkademie = section === '/app?tab=akademie';

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['admin-akademie-cats'],
    queryFn: getAkademieCategoriesForAdmin,
    enabled: isAkademie,
  });

  const { data: programs = [], isLoading: loadingProgs } = useQuery({
    queryKey: ['admin-akademie-progs', categoryId],
    queryFn: () => getAkademieProgramsForAdmin(categoryId),
    enabled: !!categoryId,
  });

  const handleSection = (val: string) => {
    if (val === 'custom' || val.startsWith('separator')) {
      if (val === 'custom') {
        setIsCustom(true);
        setSection('custom');
        onChange('');
      }
      return;
    }
    setIsCustom(false);
    setSection(val);
    setCategoryId('');
    if (val) onChange(val);
  };

  const handleCategory = (catId: string) => {
    setCategoryId(catId);
    // Při výběru kategorie URL zůstává na Akademii — program teprve zpřesní
    onChange('/app?tab=akademie');
  };

  const handleProgram = (moduleId: string) => {
    onChange(`/app?module=${moduleId}`);
  };

  return (
    <div className="notif-admin__url-picker">
      {/* Level 1 — Sekce */}
      <select
        className="notif-admin__select"
        value={isCustom ? 'custom' : section}
        onChange={(e) => handleSection(e.target.value)}
      >
        {SECTION_OPTIONS.map((o) =>
          o.value.startsWith('separator') ? (
            <option key={o.value} disabled>──────────</option>
          ) : (
            <option key={o.value} value={o.value}>{o.label}</option>
          )
        )}
      </select>

      {/* Level 2 — Kategorie Akademie */}
      {isAkademie && (
        <select
          className="notif-admin__select notif-admin__select--sub"
          value={categoryId}
          onChange={(e) => handleCategory(e.target.value)}
          disabled={loadingCats}
        >
          <option value="">
            {loadingCats ? 'Načítám kategorie...' : 'Všechny kategorie...'}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {/* Level 3 — Program */}
      {isAkademie && categoryId && (
        <select
          className="notif-admin__select notif-admin__select--sub"
          value=""
          onChange={(e) => handleProgram(e.target.value)}
          disabled={loadingProgs}
        >
          <option value="">
            {loadingProgs ? 'Načítám programy...' : 'Vybrat konkrétní program...'}
          </option>
          {programs.map((p) => (
            <option key={p.id} value={p.module_id}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Custom / manual URL */}
      {isCustom && (
        <input
          className="notif-admin__input"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/app/... nebo https://..."
        />
      )}

      {/* Výsledná URL — vždy editovatelná jako fallback */}
      {!isCustom && section && (
        <div className="notif-admin__url-preview">
          <span className="notif-admin__url-preview-label">URL:</span>
          <input
            className="notif-admin__input notif-admin__input--url-readonly"
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/app/..."
          />
        </div>
      )}
    </div>
  );
}

// Formát datetime-local value z ISO stringu
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ComposeTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateNotificationPayload>(EMPTY_FORM);
  const [ctaEnabled, setCtaEnabled] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Dynamické role z DB
  const { data: availableRoles = [] } = useQuery({
    queryKey: ['admin-available-roles'],
    queryFn: getAvailableRoles,
  });

  const isScheduledFuture = scheduleEnabled
    && !!form.scheduled_at
    && new Date(form.scheduled_at) > new Date();

  const mutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      const msg = isScheduledFuture
        ? 'Notifikace uložena. Odešle se v naplánovaný čas.'
        : 'Zpráva byla úspěšně odeslána.';
      setSuccessMsg(msg);
      setForm(EMPTY_FORM);
      setCtaEnabled(false);
      setScheduleEnabled(false);
      setImageUploadProgress(0);
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: () => {
      setErrorMsg('Nepodařilo se odeslat zprávu. Zkus to znovu.');
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setImageUploadProgress(0);
    try {
      const url = await uploadService.uploadNotificationImage(file, ({ percent }) => {
        setImageUploadProgress(percent);
      });
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch {
      setErrorMsg('Nepodařilo se nahrát obrázek. Zkus to znovu.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    const payload: CreateNotificationPayload = {
      ...form,
      action_url: ctaEnabled ? form.action_url : null,
      action_label: ctaEnabled ? form.action_label : null,
      scheduled_at: scheduleEnabled ? form.scheduled_at : null,
    };
    mutation.mutate(payload);
  };

  return (
    <form className="notif-admin__form" onSubmit={handleSubmit} noValidate>
      {/* Název */}
      <div className="notif-admin__field">
        <label className="notif-admin__label" htmlFor="notif-title">Název</label>
        <input
          id="notif-title"
          className="notif-admin__input"
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Název notifikace"
          maxLength={100}
          required
        />
      </div>

      {/* Zpráva */}
      <div className="notif-admin__field">
        <label className="notif-admin__label" htmlFor="notif-message">
          Zpráva
          <span className="notif-admin__counter">{form.message.length} / 300</span>
        </label>
        <textarea
          id="notif-message"
          className="notif-admin__textarea"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 300) })}
          placeholder="Text zprávy..."
          rows={4}
          required
        />
        <p className="notif-admin__format-hint">
          Formátování: <code>**tučně**</code> · <code>*kurzíva*</code> · nový řádek = Enter
        </p>
        {form.message && (
          <div className="notif-admin__message-preview">
            <span className="notif-admin__message-preview-label">Náhled:</span>
            <p className="notif-admin__message-preview-text">
              {renderMessageMarkdown(form.message)}
            </p>
          </div>
        )}
      </div>

      {/* Typ */}
      <div className="notif-admin__field">
        <label className="notif-admin__label" htmlFor="notif-type">Typ</label>
        <select
          id="notif-type"
          className="notif-admin__select"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as NotificationType })}
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Pinnovat */}
      <div className="notif-admin__field notif-admin__field--inline">
        <label className="notif-admin__toggle-label">
          <span className="notif-admin__toggle-wrapper">
            <input
              type="checkbox"
              className="notif-admin__toggle-input"
              checked={form.is_pinned ?? false}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
            />
            <span className="notif-admin__pin-toggle" aria-hidden="true">
              <span className="notif-admin__pin-toggle-knob" />
            </span>
          </span>
          <span className="notif-admin__toggle-text">
            <strong>Pinnovat notifikaci</strong>
            <span className="notif-admin__toggle-hint">
              Pinnované notifikace se zobrazují vždy nahoře a nikdy se automaticky nemažou
            </span>
          </span>
        </label>
      </div>

      {/* Obrázek notifikace (volitelné) */}
      <div className="notif-admin__field">
        <span className="notif-admin__label">Obrázek (volitelné)</span>
        <div className="notif-admin__image-upload">
          {form.image_url ? (
            <div className="notif-admin__image-preview">
              <img src={form.image_url} alt="Náhled notifikace" />
              <button
                type="button"
                className="notif-admin__image-remove"
                onClick={() => {
                  setForm((prev) => ({ ...prev, image_url: null }));
                  if (imageInputRef.current) imageInputRef.current.value = '';
                }}
              >
                Odebrat
              </button>
            </div>
          ) : (
            <label className="notif-admin__image-label">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="notif-admin__image-input"
                onChange={handleImageSelect}
                disabled={imageUploading}
              />
              <span className="notif-admin__image-btn">
                {imageUploading
                  ? `Nahrávám… ${imageUploadProgress} %`
                  : 'Vybrat obrázek (JPG / PNG / WebP)'}
              </span>
            </label>
          )}
          <p className="notif-admin__schedule-hint">
            Obrázek nahradí ikonu v seznamu notifikací. Ideální rozměry: 1:1, min. 200 × 200 px. Ukládá se do Bunny.net CDN na <code>images/notifications/</code>
          </p>
        </div>
      </div>

      {/* Targeting */}
      <div className="notif-admin__field">
        <span className="notif-admin__label">Příjemci</span>
        <div className="notif-admin__radio-group">
          {(['all', 'tier', 'role', 'kp'] as NotificationTargetAudience[]).map((val) => (
            <label key={val} className="notif-admin__radio-label">
              <input
                type="radio"
                name="target_audience"
                value={val}
                checked={form.target_audience === val}
                onChange={() => setForm({
                  ...form,
                  target_audience: val,
                  target_role: null,
                  target_tier: null,
                  target_kp_min: null,
                })}
              />
              {val === 'all' ? 'Všichni uživatelé' :
               val === 'tier' ? 'Podle tarifu' :
               val === 'role' ? 'Podle role' :
               'Podle KP'}
            </label>
          ))}
        </div>

        {form.target_audience === 'tier' && (
          <select
            className="notif-admin__select notif-admin__select--sub"
            value={form.target_tier ?? ''}
            onChange={(e) => setForm({ ...form, target_tier: e.target.value as NotificationTier })}
          >
            <option value="" disabled>Vybrat tarif</option>
            <option value="ZDARMA">ZDARMA (zdarma)</option>
            <option value="SMART">SMART</option>
            <option value="AI_COACH">AI_COACH</option>
          </select>
        )}

        {form.target_audience === 'role' && (
          <select
            className="notif-admin__select notif-admin__select--sub"
            value={form.target_role ?? ''}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
          >
            <option value="" disabled>Vybrat roli</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
            ))}
          </select>
        )}

        {form.target_audience === 'kp' && (
          <div className="notif-admin__kp-fields">
            <label className="notif-admin__kp-label" htmlFor="notif-kp-min">
              KP minimálně (vteřiny)
            </label>
            <input
              id="notif-kp-min"
              className="notif-admin__input notif-admin__input--kp"
              type="number"
              min="1"
              max="300"
              value={form.target_kp_min ?? ''}
              onChange={(e) => setForm({
                ...form,
                target_kp_min: e.target.value ? parseInt(e.target.value, 10) : null,
              })}
              placeholder="např. 25"
            />
            <p className="notif-admin__schedule-hint">
              Notifikace dostane každý, kdo má alespoň jednu validní hodnotu KP ≥ {form.target_kp_min ?? '?'}s
            </p>
          </div>
        )}
      </div>

      {/* CTA (volitelné) */}
      <div className="notif-admin__field">
        <label className="notif-admin__radio-label">
          <input
            type="checkbox"
            checked={ctaEnabled}
            onChange={(e) => setCtaEnabled(e.target.checked)}
          />
          Přidat CTA tlačítko (volitelné)
        </label>

        {ctaEnabled && (
          <div className="notif-admin__cta-fields">
            <input
              className="notif-admin__input"
              type="text"
              value={form.action_label ?? ''}
              onChange={(e) => setForm({ ...form, action_label: e.target.value })}
              placeholder="Popisek tlačítka (např. Otevřít, Zobrazit)"
              maxLength={60}
            />
            <UrlPicker
              value={form.action_url}
              onChange={(url) => setForm({ ...form, action_url: url })}
            />
          </div>
        )}
      </div>

      {/* Plánování */}
      <div className="notif-admin__field">
        <label className="notif-admin__radio-label">
          <input
            type="checkbox"
            checked={scheduleEnabled}
            onChange={(e) => {
              setScheduleEnabled(e.target.checked);
              if (!e.target.checked) setForm({ ...form, scheduled_at: null });
            }}
          />
          Naplánovat odeslání na konkrétní čas
        </label>

        {scheduleEnabled && (
          <div className="notif-admin__schedule-fields">
            <input
              className="notif-admin__input notif-admin__input--datetime"
              type="datetime-local"
              value={toDatetimeLocal(form.scheduled_at)}
              onChange={(e) => {
                // datetime-local vrací "2026-03-03T16:30" bez timezone info.
                // new Date("2026-03-03T16:30") interpretuje jako UTC — špatně.
                // Místo toho parsujeme ručně a tvoříme Date z lokálního času.
                if (!e.target.value) {
                  setForm({ ...form, scheduled_at: null });
                  return;
                }
                const [datePart, timePart] = e.target.value.split('T');
                const [year, month, day] = datePart.split('-').map(Number);
                const [hour, minute] = timePart.split(':').map(Number);
                const localDate = new Date(year, month - 1, day, hour, minute, 0);
                setForm({ ...form, scheduled_at: localDate.toISOString() });
              }}
              min={toDatetimeLocal(new Date().toISOString())}
            />
            {isScheduledFuture && (
              <p className="notif-admin__schedule-hint">
                Notifikace se odešle {new Date(form.scheduled_at!).toLocaleString('cs-CZ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Chybové / úspěšné zprávy */}
      {errorMsg && <p className="notif-admin__error-msg">{errorMsg}</p>}
      {successMsg && <p className="notif-admin__success-msg">{successMsg}</p>}

      <button
        type="submit"
        className="notif-admin__submit"
        disabled={mutation.isPending || !form.title.trim() || !form.message.trim()}
      >
        {mutation.isPending
          ? 'Ukládám...'
          : isScheduledFuture
          ? 'Naplánovat zprávu'
          : 'Odeslat zprávu'}
      </button>
    </form>
  );
}

// ============================================================
// Tab: Automatické
// ============================================================

function AutoTab() {
  const queryClient = useQueryClient();
  const { data: triggers = [], isLoading, error } = useQuery({
    queryKey: ['admin-auto-triggers'],
    queryFn: getAutoTriggers,
  });

  const [editState, setEditState] = useState<Record<string, Partial<NotificationAutoTrigger>>>({});
  const [savingTrigger, setSavingTrigger] = useState<string | null>(null);

  const handleChange = (trigger: string, field: keyof NotificationAutoTrigger, value: string | boolean) => {
    setEditState((prev) => ({
      ...prev,
      [trigger]: { ...prev[trigger], [field]: value },
    }));
  };

  const handleSave = async (trigger: string) => {
    const updates = editState[trigger];
    if (!updates) return;
    setSavingTrigger(trigger);
    try {
      await updateAutoTrigger(trigger, updates);
      queryClient.invalidateQueries({ queryKey: ['admin-auto-triggers'] });
      setEditState((prev) => {
        const next = { ...prev };
        delete next[trigger];
        return next;
      });
    } finally {
      setSavingTrigger(null);
    }
  };

  const getVal = <K extends keyof NotificationAutoTrigger>(
    t: NotificationAutoTrigger,
    field: K
  ): NotificationAutoTrigger[K] => {
    return (editState[t.trigger]?.[field] as NotificationAutoTrigger[K]) ?? t[field];
  };

  if (isLoading) return <div className="notif-admin__loading">Načítám...</div>;
  if (error) return <div className="notif-admin__error">Chyba při načítání triggerů.</div>;

  return (
    <div className="notif-admin__auto-list">
      {triggers.map((t: NotificationAutoTrigger) => (
        <div key={t.trigger} className="notif-admin__auto-row">
          <div className="notif-admin__auto-row-top">
            <label className="notif-admin__toggle-label">
              <span className="notif-admin__auto-name">
                {TRIGGER_LABELS[t.trigger] ?? t.trigger}
              </span>
              <button
                type="button"
                className={`notif-admin__toggle ${getVal(t, 'enabled') ? 'notif-admin__toggle--on' : ''}`}
                onClick={() => handleChange(t.trigger, 'enabled', !getVal(t, 'enabled'))}
                aria-label={`${getVal(t, 'enabled') ? 'Vypnout' : 'Zapnout'} trigger ${t.trigger}`}
              >
                <span className="notif-admin__toggle-knob" />
              </button>
            </label>
          </div>

          <div className="notif-admin__auto-fields">
            <input
              className="notif-admin__input notif-admin__input--sm"
              type="text"
              value={String(getVal(t, 'default_title'))}
              onChange={(e) => handleChange(t.trigger, 'default_title', e.target.value)}
              placeholder="Výchozí název"
            />
            <input
              className="notif-admin__input notif-admin__input--sm"
              type="text"
              value={String(getVal(t, 'default_message'))}
              onChange={(e) => handleChange(t.trigger, 'default_message', e.target.value)}
              placeholder="Výchozí zpráva"
            />
          </div>

          {editState[t.trigger] !== undefined && (
            <button
              className="notif-admin__save-btn"
              onClick={() => handleSave(t.trigger)}
              disabled={savingTrigger === t.trigger}
            >
              {savingTrigger === t.trigger ? 'Ukládám...' : 'Uložit'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Main component
// ============================================================

export default function NotificationsAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Přehled' },
    { id: 'compose', label: 'Nová zpráva' },
    { id: 'auto', label: 'Automatické' },
  ];

  return (
    <div className="notif-admin">
      <div className="notif-admin__header">
        <div>
          <h1 className="notif-admin__title">Notifikace</h1>
          <p className="notif-admin__subtitle">Správa zpráv a automatických triggerů</p>
        </div>

        <div className="notif-admin__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`notif-admin__tab ${activeTab === tab.id ? 'aktive' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="notif-admin__content">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'compose' && <ComposeTab />}
        {activeTab === 'auto' && <AutoTab />}
      </div>
    </div>
  );
}
