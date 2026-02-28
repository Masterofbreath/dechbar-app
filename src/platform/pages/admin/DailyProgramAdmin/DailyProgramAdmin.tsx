/**
 * DailyProgramAdmin — Správa denního programu (custom audio override)
 *
 * Umožňuje naplánovat speciální audio nahrávku do sekce "Denní program"
 * na konkrétní časové období. Záznamy se ukládají do platform_daily_override.
 *
 * Priority logika (v TodaysChallengeButton):
 *   1. Pinnutý program uživatele
 *   2. Aktivní override z této stránky  ← TATO STRÁNKA
 *   3. platform_featured_program (akademie program)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { akademieKeys } from '@/modules/akademie/api/keys';
import type { DailyOverrideData } from '@/modules/mvp0/hooks/usePlatformDailyOverride';
import './DailyProgramAdmin.css';

// --------------------------------------------------
// API helpers
// --------------------------------------------------

async function fetchAllOverrides(): Promise<DailyOverrideData[]> {
  const { data, error } = await supabase
    .from('platform_daily_override')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('active_from', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DailyOverrideData[];
}

type UpsertPayload = Omit<DailyOverrideData, 'id' | 'created_at' | 'updated_at'> & { id?: string };

async function upsertOverride(payload: UpsertPayload): Promise<void> {
  const { id, ...rest } = payload;
  if (id) {
    const { error } = await supabase
      .from('platform_daily_override')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('platform_daily_override')
      .insert(rest);
    if (error) throw error;
  }
}

async function deleteOverride(id: string): Promise<void> {
  const { error } = await supabase
    .from('platform_daily_override')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Converts local datetime-local input value to UTC ISO string */
function localToUTC(localDT: string): string {
  return new Date(localDT).toISOString();
}

/** Converts UTC ISO string to datetime-local input value (local time) */
function utcToLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isActiveNow(o: DailyOverrideData): boolean {
  const now = Date.now();
  const from = new Date(o.active_from).getTime();
  const until = o.active_until ? new Date(o.active_until).getTime() : Infinity;
  return o.is_active && from <= now && now < until;
}

// --------------------------------------------------
// Form state
// --------------------------------------------------

interface FormState {
  id?: string;
  title: string;
  subtitle: string;
  audio_url: string;
  duration_seconds: number;
  cover_image_url: string;
  active_from: string;    // datetime-local value
  active_until: string;   // datetime-local value (empty = no limit)
  is_active: boolean;
  sort_order: number;
  force_priority: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  subtitle: '',
  audio_url: '',
  duration_seconds: 0,
  cover_image_url: '',
  active_from: utcToLocal(new Date().toISOString()),
  active_until: '',
  is_active: true,
  sort_order: 10,
  force_priority: false,
};

function overrideToForm(o: DailyOverrideData): FormState {
  return {
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    audio_url: o.audio_url,
    duration_seconds: o.duration_seconds,
    cover_image_url: o.cover_image_url ?? '',
    active_from: utcToLocal(o.active_from),
    active_until: utcToLocal(o.active_until),
    is_active: o.is_active,
    sort_order: o.sort_order,
    force_priority: o.force_priority,
  };
}

// --------------------------------------------------
// Form component
// --------------------------------------------------

interface OverrideFormProps {
  initial: FormState;
  onSave: (payload: UpsertPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function OverrideForm({ initial, onSave, onCancel, isSaving }: OverrideFormProps) {
  const [form, setForm] = useState<FormState>(initial);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpsertPayload = {
      id: form.id,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      audio_url: form.audio_url.trim(),
      duration_seconds: Number(form.duration_seconds),
      cover_image_url: form.cover_image_url.trim() || null,
      active_from: localToUTC(form.active_from),
      active_until: form.active_until ? localToUTC(form.active_until) : null,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
      force_priority: form.force_priority,
    };
    onSave(payload);
  }

  const durationMin = form.duration_seconds > 0
    ? `${Math.floor(form.duration_seconds / 60)}:${String(form.duration_seconds % 60).padStart(2, '0')} min`
    : '';

  return (
    <form className="daily-admin__form" onSubmit={handleSubmit}>
      <h3 className="daily-admin__form-title">
        {form.id ? 'Upravit záznam' : 'Nový záznam'}
      </h3>

      <div className="daily-admin__form-grid">
        {/* Title */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Název (title)</label>
          <input
            className="daily-admin__input"
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Dechpresso"
            required
          />
          <span className="daily-admin__hint">Hlavní nadpis na kartě</span>
        </div>

        {/* Subtitle */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Podtitulek (subtitle)</label>
          <input
            className="daily-admin__input"
            type="text"
            value={form.subtitle}
            onChange={e => set('subtitle', e.target.value)}
            placeholder="Ochutnávka · 7 min"
            required
          />
          <span className="daily-admin__hint">Zobrazí se pod názvem, např. "Dechpresso · 7 min"</span>
        </div>

        {/* Audio URL */}
        <div className="daily-admin__field daily-admin__field--full">
          <label className="daily-admin__label">Audio URL</label>
          <input
            className="daily-admin__input"
            type="url"
            value={form.audio_url}
            onChange={e => set('audio_url', e.target.value)}
            placeholder="https://dechbar-cdn.b-cdn.net/audio/tracks/..."
            required
          />
          <span className="daily-admin__hint">Přímý odkaz na MP3 soubor (Bunny CDN nebo jiný)</span>
        </div>

        {/* Duration */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Délka (sekundy)</label>
          <input
            className="daily-admin__input"
            type="number"
            min={0}
            value={form.duration_seconds}
            onChange={e => set('duration_seconds', Number(e.target.value))}
            required
          />
          {durationMin && (
            <span className="daily-admin__hint daily-admin__hint--ok">= {durationMin}</span>
          )}
        </div>

        {/* Cover image URL */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Cover obrázek URL (volitelné)</label>
          <input
            className="daily-admin__input"
            type="url"
            value={form.cover_image_url}
            onChange={e => set('cover_image_url', e.target.value)}
            placeholder="https://dechbar-cdn.b-cdn.net/images/covers/..."
          />
          <span className="daily-admin__hint">Thumbnail na kartě; bez obrázku zobrazí play ikonu</span>
        </div>

        {/* Active from */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Aktivní od</label>
          <input
            className="daily-admin__input"
            type="datetime-local"
            value={form.active_from}
            onChange={e => set('active_from', e.target.value)}
            required
          />
          <span className="daily-admin__hint">Datum a čas zobrazení (tvůj lokální čas)</span>
        </div>

        {/* Active until */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Aktivní do (volitelné)</label>
          <input
            className="daily-admin__input"
            type="datetime-local"
            value={form.active_until}
            onChange={e => set('active_until', e.target.value)}
          />
          <span className="daily-admin__hint">Prázdné = bez omezení (zobrazuje se dokud ručně nevypneš)</span>
        </div>

        {/* Sort order */}
        <div className="daily-admin__field">
          <label className="daily-admin__label">Priorita (sort_order)</label>
          <input
            className="daily-admin__input"
            type="number"
            min={1}
            value={form.sort_order}
            onChange={e => set('sort_order', Number(e.target.value))}
          />
          <span className="daily-admin__hint">Nižší číslo = vyšší priorita (pokud více aktivních)</span>
        </div>

        {/* Is active */}
        <div className="daily-admin__field daily-admin__field--checkbox">
          <label className="daily-admin__label daily-admin__label--inline">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="daily-admin__checkbox"
            />
            Zapnuto (is_active)
          </label>
          <span className="daily-admin__hint">Odškrtni pro rychlé dočasné vypnutí bez mazání</span>
        </div>

        {/* Force priority */}
        <div className="daily-admin__field daily-admin__field--checkbox">
          <label className="daily-admin__label daily-admin__label--inline">
            <input
              type="checkbox"
              checked={form.force_priority}
              onChange={e => set('force_priority', e.target.checked)}
              className="daily-admin__checkbox"
            />
            Absolutní priorita (force_priority)
          </label>
          <span className="daily-admin__hint daily-admin__hint--warning">
            Zobrazí se VŠEM uživatelům — i těm s pinnutým vlastním programem. Používej výjimečně.
          </span>
        </div>
      </div>

      {/* Preview */}
      {form.audio_url && (
        <div className="daily-admin__preview">
          <span className="daily-admin__preview-label">Náhled audia:</span>
          <audio controls src={form.audio_url} className="daily-admin__audio-player" />
        </div>
      )}

      <div className="daily-admin__form-actions">
        <button type="button" className="daily-admin__btn daily-admin__btn--secondary" onClick={onCancel}>
          Zrušit
        </button>
        <button type="submit" className="daily-admin__btn daily-admin__btn--primary" disabled={isSaving}>
          {isSaving ? 'Ukládám...' : (form.id ? 'Uložit změny' : 'Vytvořit')}
        </button>
      </div>
    </form>
  );
}

// --------------------------------------------------
// Main page
// --------------------------------------------------

export default function DailyProgramAdmin() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<FormState | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: akademieKeys.dailyOverride(),
    queryFn: fetchAllOverrides,
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: upsertOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: akademieKeys.dailyOverride() });
      setFormState(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: akademieKeys.dailyOverride() });
      setDeleteId(null);
    },
  });

  function handleEdit(o: DailyOverrideData) {
    setFormState(overrideToForm(o));
  }

  function handleNew() {
    setFormState({ ...EMPTY_FORM });
  }

  return (
    <div className="daily-admin">
      <div className="daily-admin__header">
        <div>
          <h1 className="daily-admin__title">Denní program</h1>
          <p className="daily-admin__desc">
            Naplánuj speciální audio nahrávku do sekce "Denní program" pro všechny uživatele
            bez vlastního pinnutého programu.
          </p>
        </div>
        {!formState && (
          <button className="daily-admin__btn daily-admin__btn--primary" onClick={handleNew}>
            + Nový záznam
          </button>
        )}
      </div>

      {/* How it works */}
      <div className="daily-admin__info-box">
        <strong>Jak to funguje:</strong>
        <ol className="daily-admin__info-list">
          <li>Uživatel, který nemá pinnutý vlastní program, uvidí <strong>první aktivní záznam</strong> (nejnižší sort_order) jehož časové okno platí.</li>
          <li>Po uplynutí "Aktivní do" se automaticky zobrazí záložní Program z Akademie (platform_featured_program).</li>
          <li>Múltiple záznamů = naplánuj celý kalendář dopředu.</li>
        </ol>
      </div>

      {/* Form */}
      {formState && (
        <OverrideForm
          initial={formState}
          onSave={(payload) => saveMutation.mutate(payload)}
          onCancel={() => setFormState(null)}
          isSaving={saveMutation.isPending}
        />
      )}

      {/* Table */}
      <div className="daily-admin__table-wrap">
        <h2 className="daily-admin__section-title">Záznamy</h2>

        {isLoading ? (
          <div className="daily-admin__loading">Načítám...</div>
        ) : overrides.length === 0 ? (
          <div className="daily-admin__empty">
            Žádné záznamy. Klikni "Nový záznam" pro přidání.
          </div>
        ) : (
          <table className="daily-admin__table">
            <thead>
              <tr>
                <th>Stav</th>
                <th>Název</th>
                <th>Podtitulek</th>
                <th>Délka</th>
                <th>Aktivní od</th>
                <th>Aktivní do</th>
                <th>Priorita</th>
                <th>Přehrání</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {overrides.map(o => {
                const active = isActiveNow(o);
                return (
                  <tr key={o.id} className={active ? 'daily-admin__row--active' : ''}>
                    <td>
                      <span className={`daily-admin__badge ${active ? 'daily-admin__badge--green' : (o.is_active ? 'daily-admin__badge--yellow' : 'daily-admin__badge--grey')}`}>
                        {active ? '● Aktivní' : (o.is_active ? '○ Plánováno' : '✕ Vypnuto')}
                      </span>
                    </td>
                    <td className="daily-admin__cell-title">{o.title}</td>
                    <td className="daily-admin__cell-subtitle">{o.subtitle}</td>
                    <td>{o.duration_seconds > 0 ? `${Math.round(o.duration_seconds / 60)} min` : '—'}</td>
                    <td>{formatDateTime(o.active_from)}</td>
                    <td>{formatDateTime(o.active_until)}</td>
                    <td>
                      {o.sort_order}
                      {o.force_priority && (
                        <span className="daily-admin__badge daily-admin__badge--force" title="Absolutní priorita — zobrazí se i uživatelům s pinnutým programem">
                          {' '}⚡
                        </span>
                      )}
                    </td>
                    <td className="daily-admin__cell-play-count">{o.play_count}</td>
                    <td>
                      <div className="daily-admin__row-actions">
                        <button
                          className="daily-admin__btn daily-admin__btn--sm daily-admin__btn--secondary"
                          onClick={() => handleEdit(o)}
                        >
                          Upravit
                        </button>
                        <button
                          className="daily-admin__btn daily-admin__btn--sm daily-admin__btn--danger"
                          onClick={() => setDeleteId(o.id)}
                        >
                          Smazat
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteId && (
        <div className="daily-admin__modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="daily-admin__modal" onClick={e => e.stopPropagation()}>
            <h3>Smazat záznam?</h3>
            <p>Tato akce je nevratná. Záznam bude trvale odstraněn.</p>
            <div className="daily-admin__modal-actions">
              <button className="daily-admin__btn daily-admin__btn--secondary" onClick={() => setDeleteId(null)}>
                Zrušit
              </button>
              <button
                className="daily-admin__btn daily-admin__btn--danger"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Mažu...' : 'Smazat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
