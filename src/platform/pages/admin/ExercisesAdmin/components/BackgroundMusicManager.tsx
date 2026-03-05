/**
 * BackgroundMusicManager
 *
 * Admin component for managing background_tracks + background_categories tables.
 * Tab-based: Tracky | Kategorie
 * - Tracky: tabulka, přidání (aa-upload-area), inline editace + upload nového souboru
 * - Kategorie: CRUD správa kategorií (slug, název, pořadí, aktivní)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/ExercisesAdmin
 * @since 2.48.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService, slugify } from '@/platform/services/upload/uploadService';
import type { BackgroundTrack } from '@/modules/mvp0/types/audio';
import type { BackgroundCategory } from '@/platform/services/admin/types';

const TIER_LABELS: Record<string, string> = {
  ZDARMA: 'Zdarma',
  SMART: 'SMART',
  AI_COACH: 'AI Coach',
};

const TIER_OPTIONS = [
  { value: 'ZDARMA',   label: 'Zdarma' },
  { value: 'SMART',    label: 'SMART' },
  { value: 'AI_COACH', label: 'AI Coach' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Close Icon SVG
// ─────────────────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadArea — aa-upload-area design
// ─────────────────────────────────────────────────────────────────────────────

interface UploadAreaProps {
  file: File | null;
  onChange: (file: File | null) => void;
  uploading?: boolean;
  progress?: number;
  label?: string;
}

function UploadArea({ file, onChange, uploading, progress, label = 'Vyberte audio soubor' }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="aa-upload-area" onClick={() => !uploading && inputRef.current?.click()} style={{ cursor: uploading ? 'default' : 'pointer' }}>
      <input
        ref={inputRef}
        type="file"
        accept=".aac,.mp3,.m4a,.wav"
        style={{ display: 'none' }}
        onChange={e => onChange(e.target.files?.[0] ?? null)}
        disabled={uploading}
      />
      {uploading ? (
        <div style={{ width: '100%' }}>
          <p className="aa-upload-area__text">Nahrávám…</p>
          <div className="aa-progress-bar">
            <div className="aa-progress-bar__fill" style={{ width: `${progress ?? 0}%` }} />
          </div>
          <p className="aa-upload-area__hint">{progress ?? 0}%</p>
        </div>
      ) : file ? (
        <div>
          <p className="aa-upload-area__text">{file.name}</p>
          <p className="aa-upload-area__hint">{(file.size / 1024 / 1024).toFixed(2)} MB — klik pro změnu</p>
        </div>
      ) : (
        <div>
          <p className="aa-upload-area__text">{label}</p>
          <p className="aa-upload-area__hint">.mp3 / .aac / .m4a / .wav</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TracksTab
// ─────────────────────────────────────────────────────────────────────────────

interface TracksTabProps {
  categories: BackgroundCategory[];
}

interface TrackFormState {
  name: string;
  slug: string;
  category: string;
  required_tier: string;
  sort_order: string;
  is_active: boolean;
  file: File | null;
}

interface TrackEditState {
  name: string;
  slug: string;
  category: string;
  required_tier: string;
  sort_order: string;
  is_active: boolean;
  replaceFile: File | null;
}

const EMPTY_TRACK_FORM: TrackFormState = {
  name: '',
  slug: '',
  category: 'nature',
  required_tier: 'ZDARMA',
  sort_order: '0',
  is_active: true,
  file: null,
};

function TracksTab({ categories }: TracksTabProps) {
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TrackFormState>(EMPTY_TRACK_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<BackgroundTrack | null>(null);
  const [editState, setEditState] = useState<TrackEditState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);
  const [editUploadProgress, setEditUploadProgress] = useState(0);

  const categoryOptions = categories.length > 0
    ? categories
    : [
        { slug: 'nature', name: 'Příroda' },
        { slug: 'binaural', name: 'Binaurální' },
        { slug: 'tibetan', name: 'Tibetské' },
        { slug: 'yogic', name: 'Jógické' },
      ];

  const fetchTracks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.backgroundMusic.getAll();
      setTracks(data as BackgroundTrack[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTracks(); }, [fetchTracks]);

  const handleToggleActive = async (track: BackgroundTrack) => {
    try {
      await adminApi.backgroundMusic.update(track.id, { is_active: !track.is_active });
      setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_active: !t.is_active } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při aktualizaci');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu smazat tento track?')) return;
    try {
      await adminApi.backgroundMusic.delete(id);
      setTracks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) { setError('Vyberte audio soubor'); return; }
    if (!form.slug) { setError('Název nesmí být prázdný'); return; }

    try {
      setIsUploading(true);
      setError(null);

      const cdnUrl = await uploadService.uploadSessionAudio(
        form.file, 'background', form.slug,
        ({ percent }) => setUploadProgress(percent),
      );

      await adminApi.backgroundMusic.create({
        name: form.name,
        slug: form.slug,
        category: form.category,
        cdn_url: cdnUrl,
        required_tier: form.required_tier as BackgroundTrack['required_tier'],
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      });

      setForm(EMPTY_TRACK_FORM);
      setShowForm(false);
      setUploadProgress(0);
      await fetchTracks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsUploading(false);
    }
  };

  const openEdit = (track: BackgroundTrack) => {
    setEditingTrack(track);
    setEditState({
      name: track.name,
      slug: track.slug,
      category: track.category,
      required_tier: track.required_tier,
      sort_order: String(track.sort_order ?? 0),
      is_active: track.is_active,
      replaceFile: null,
    });
  };

  const closeEdit = () => {
    setEditingTrack(null);
    setEditState(null);
    setIsUploadingEdit(false);
    setEditUploadProgress(0);
  };

  const handleEditSave = async () => {
    if (!editingTrack || !editState) return;
    try {
      setIsSavingEdit(true);
      let newCdnUrl: string | undefined;

      // Upload nového souboru pokud byl vybrán
      if (editState.replaceFile) {
        setIsUploadingEdit(true);
        newCdnUrl = await uploadService.uploadSessionAudio(
          editState.replaceFile, 'background', editState.slug,
          ({ percent }) => setEditUploadProgress(percent),
        );
        setIsUploadingEdit(false);
      }

      await adminApi.backgroundMusic.update(editingTrack.id, {
        name: editState.name,
        slug: editState.slug,
        category: editState.category,
        required_tier: editState.required_tier as BackgroundTrack['required_tier'],
        sort_order: parseInt(editState.sort_order, 10) || 0,
        is_active: editState.is_active,
        ...(newCdnUrl ? { cdn_url: newCdnUrl } : {}),
      });

      setTracks(prev => prev.map(t =>
        t.id === editingTrack.id
          ? {
              ...t,
              name: editState.name,
              slug: editState.slug,
              category: editState.category,
              required_tier: editState.required_tier as BackgroundTrack['required_tier'],
              sort_order: parseInt(editState.sort_order, 10) || 0,
              is_active: editState.is_active,
              ...(newCdnUrl ? { cdn_url: newCdnUrl } : {}),
            }
          : t
      ));
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="exercises-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="exercises-manager__section-title" style={{ margin: 0 }}>
          Background tracky ({tracks.length})
        </h2>
        <button
          className="exercises-manager__btn exercises-manager__btn--primary"
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? 'Zrušit' : '+ Přidat track'}
        </button>
      </div>

      {error && <div className="exercises-manager__error">{error}</div>}

      {/* Add form */}
      {showForm && (
        <div className="exercises-manager__section">
          <h3 className="exercises-manager__section-title">Nový background track</h3>
          <form onSubmit={handleSubmit} className="aa-form">
            <div className="aa-form-row">
              <div className="aa-field">
                <label className="aa-field__label aa-field__label--required">Název</label>
                <input
                  className="aa-input"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="Tibetské mísy — Ráno"
                  required
                />
              </div>
              <div className="aa-field">
                <label className="aa-field__label">Slug (auto)</label>
                <input
                  className="aa-input aa-input--slug"
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="tibetske-misy-rano"
                  required
                />
              </div>
            </div>

            <div className="aa-form-row">
              <div className="aa-field">
                <label className="aa-field__label">Kategorie</label>
                <select className="aa-input" value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}>
                  {categoryOptions.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="aa-field">
                <label className="aa-field__label">Tier</label>
                <select className="aa-input" value={form.required_tier}
                  onChange={e => setForm(prev => ({ ...prev, required_tier: e.target.value }))}>
                  {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="aa-form-row">
              <div className="aa-field">
                <label className="aa-field__label">Sort order</label>
                <input className="aa-input" type="number" min="0"
                  value={form.sort_order}
                  onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))} />
              </div>
              <div className="aa-field" style={{ justifyContent: 'flex-end' }}>
                <label className="aa-checkbox-row" style={{ marginTop: '1.5rem' }}>
                  <input type="checkbox" checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                  <span>Aktivní</span>
                </label>
              </div>
            </div>

            <div className="aa-field">
              <label className="aa-field__label aa-field__label--required">Audio soubor</label>
              <UploadArea
                file={form.file}
                onChange={f => setForm(prev => ({ ...prev, file: f }))}
                uploading={isUploading}
                progress={uploadProgress}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="aa-btn aa-btn--ghost"
                onClick={() => { setShowForm(false); setForm(EMPTY_TRACK_FORM); }}>
                Zrušit
              </button>
              <button type="submit" className="aa-btn aa-btn--primary" disabled={isUploading}>
                {isUploading ? `Nahrávám ${uploadProgress}%…` : 'Uložit track'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tracks table */}
      <div className="exercises-manager__section">
        {isLoading ? (
          <p className="exercises-manager__empty">Načítám...</p>
        ) : tracks.length === 0 ? (
          <p className="exercises-manager__empty">Žádné tracky. Přidej první.</p>
        ) : (
          <table className="exercises-manager__table">
            <thead>
              <tr>
                <th>Název</th>
                <th>Slug</th>
                <th>Kategorie</th>
                <th>Tier</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map(track => {
                const catName = categories.find(c => c.slug === track.category)?.name ?? track.category;
                return (
                  <tr key={track.id}>
                    <td>{track.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{track.slug}</td>
                    <td><span className="exercises-manager__badge">{catName}</span></td>
                    <td>
                      <span className={`exercises-manager__badge exercises-manager__badge--${track.required_tier === 'SMART' ? 'smart' : track.required_tier === 'AI_COACH' ? 'ai-coach' : ''}`}>
                        {TIER_LABELS[track.required_tier] ?? track.required_tier}
                      </span>
                    </td>
                    <td>
                      <span className={`exercises-manager__badge exercises-manager__badge--${track.is_active ? 'active' : 'inactive'}`}>
                        {track.is_active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td>
                      <div className="exercises-manager__actions">
                        <button className="exercises-manager__btn" onClick={() => openEdit(track)}>Upravit</button>
                        <button className="exercises-manager__btn" onClick={() => handleToggleActive(track)}>
                          {track.is_active ? 'Deaktivovat' : 'Aktivovat'}
                        </button>
                        <button className="exercises-manager__btn exercises-manager__btn--danger" onClick={() => handleDelete(track.id)}>Smazat</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editingTrack && editState && (
        <div className="aa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="aa-modal">
            <div className="aa-modal__header">
              <span className="aa-modal__title">Upravit track</span>
              <button className="aa-btn aa-btn--icon" onClick={closeEdit} aria-label="Zavřít"><CloseIcon /></button>
            </div>
            <div className="aa-modal__body">
              <div className="aa-form">
                <div className="aa-form-row">
                  <div className="aa-field">
                    <label className="aa-field__label aa-field__label--required">Název</label>
                    <input className="aa-input" type="text" value={editState.name}
                      onChange={e => setEditState(prev => prev ? { ...prev, name: e.target.value, slug: slugify(e.target.value) } : prev)} />
                  </div>
                  <div className="aa-field">
                    <label className="aa-field__label">Slug</label>
                    <input className="aa-input aa-input--slug" type="text" value={editState.slug}
                      onChange={e => setEditState(prev => prev ? { ...prev, slug: e.target.value } : prev)} />
                  </div>
                </div>

                <div className="aa-form-row">
                  <div className="aa-field">
                    <label className="aa-field__label">Kategorie</label>
                    <select className="aa-input" value={editState.category}
                      onChange={e => setEditState(prev => prev ? { ...prev, category: e.target.value } : prev)}>
                      {categoryOptions.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="aa-field">
                    <label className="aa-field__label">Tier</label>
                    <select className="aa-input" value={editState.required_tier}
                      onChange={e => setEditState(prev => prev ? { ...prev, required_tier: e.target.value } : prev)}>
                      {TIER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="aa-form-row">
                  <div className="aa-field">
                    <label className="aa-field__label">Sort order</label>
                    <input className="aa-input" type="number" min="0" value={editState.sort_order}
                      onChange={e => setEditState(prev => prev ? { ...prev, sort_order: e.target.value } : prev)} />
                  </div>
                  <div className="aa-field" style={{ justifyContent: 'flex-end' }}>
                    <label className="aa-checkbox-row" style={{ marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={editState.is_active}
                        onChange={e => setEditState(prev => prev ? { ...prev, is_active: e.target.checked } : prev)} />
                      <span>Aktivní</span>
                    </label>
                  </div>
                </div>

                <div className="aa-field">
                  <label className="aa-field__label">Nahradit audio soubor (volitelné)</label>
                  <UploadArea
                    file={editState.replaceFile}
                    onChange={f => setEditState(prev => prev ? { ...prev, replaceFile: f } : prev)}
                    uploading={isUploadingEdit}
                    progress={editUploadProgress}
                    label="Klik pro nahrání nového souboru"
                  />
                  {!editState.replaceFile && (
                    <p className="aa-field__hint">Ponech prázdné pro zachování stávajícího souboru.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="aa-modal__footer">
              <button className="aa-btn aa-btn--ghost" onClick={closeEdit} disabled={isSavingEdit}>Zrušit</button>
              <button className="aa-btn aa-btn--primary" onClick={handleEditSave} disabled={isSavingEdit || isUploadingEdit}>
                {isSavingEdit ? 'Ukládám...' : 'Uložit změny'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CategoriesTab
// ─────────────────────────────────────────────────────────────────────────────

interface CategoriesTabProps {
  categories: BackgroundCategory[];
  onRefresh: () => void;
}

function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formSort, setFormSort] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [editingCat, setEditingCat] = useState<BackgroundCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editSort, setEditSort] = useState('');
  const [editActive, setEditActive] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlug || !formName) { setError('Vyplňte název i slug'); return; }
    try {
      setIsSaving(true);
      await adminApi.backgroundCategories.create({
        slug: formSlug,
        name: formName,
        sort_order: parseInt(formSort, 10) || 0,
      });
      setFormName(''); setFormSlug(''); setFormSort('0'); setShowForm(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: BackgroundCategory) => {
    if (!confirm(`Smazat kategorii "${cat.name}"? Tracky v této kategorii zůstanou, ale nebudou přiřazeny.`)) return;
    try {
      await adminApi.backgroundCategories.delete(cat.id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání');
    }
  };

  const openEditCat = (cat: BackgroundCategory) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditSort(String(cat.sort_order));
    setEditActive(cat.is_active);
  };

  const handleEditSaveCat = async () => {
    if (!editingCat) return;
    try {
      setIsSaving(true);
      await adminApi.backgroundCategories.update(editingCat.id, {
        name: editName,
        sort_order: parseInt(editSort, 10) || 0,
        is_active: editActive,
      });
      setEditingCat(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="exercises-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="exercises-manager__section-title" style={{ margin: 0 }}>
          Kategorie ({categories.length})
        </h2>
        <button className="exercises-manager__btn exercises-manager__btn--primary"
          onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Zrušit' : '+ Nová kategorie'}
        </button>
      </div>

      {error && <div className="exercises-manager__error">{error}</div>}

      {showForm && (
        <div className="exercises-manager__section">
          <h3 className="exercises-manager__section-title">Nová kategorie</h3>
          <form onSubmit={handleCreate} className="aa-form">
            <div className="aa-form-row">
              <div className="aa-field">
                <label className="aa-field__label aa-field__label--required">Název</label>
                <input className="aa-input" type="text" value={formName}
                  onChange={e => { setFormName(e.target.value); setFormSlug(slugify(e.target.value)); }}
                  placeholder="Tibetské" required />
              </div>
              <div className="aa-field">
                <label className="aa-field__label">Slug</label>
                <input className="aa-input aa-input--slug" type="text" value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  placeholder="tibetan" required />
              </div>
            </div>
            <div className="aa-field" style={{ maxWidth: 160 }}>
              <label className="aa-field__label">Sort order</label>
              <input className="aa-input" type="number" min="0" value={formSort}
                onChange={e => setFormSort(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="aa-btn aa-btn--ghost"
                onClick={() => { setShowForm(false); setFormName(''); setFormSlug(''); }}>
                Zrušit
              </button>
              <button type="submit" className="aa-btn aa-btn--primary" disabled={isSaving}>
                {isSaving ? 'Ukládám...' : 'Vytvořit'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="exercises-manager__section">
        {categories.length === 0 ? (
          <p className="exercises-manager__empty">Žádné kategorie.</p>
        ) : (
          <table className="exercises-manager__table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Název</th>
                <th>Pořadí</th>
                <th>Stav</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{cat.slug}</td>
                  <td>{cat.name}</td>
                  <td>{cat.sort_order}</td>
                  <td>
                    <span className={`exercises-manager__badge exercises-manager__badge--${cat.is_active ? 'active' : 'inactive'}`}>
                      {cat.is_active ? 'Aktivní' : 'Neaktivní'}
                    </span>
                  </td>
                  <td>
                    <div className="exercises-manager__actions">
                      <button className="exercises-manager__btn" onClick={() => openEditCat(cat)}>Upravit</button>
                      <button className="exercises-manager__btn exercises-manager__btn--danger" onClick={() => handleDelete(cat)}>Smazat</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit category modal */}
      {editingCat && (
        <div className="aa-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setEditingCat(null); }}>
          <div className="aa-modal">
            <div className="aa-modal__header">
              <span className="aa-modal__title">Upravit kategorii</span>
              <button className="aa-btn aa-btn--icon" onClick={() => setEditingCat(null)} aria-label="Zavřít"><CloseIcon /></button>
            </div>
            <div className="aa-modal__body">
              <div className="aa-form">
                <div className="aa-field">
                  <label className="aa-field__label">Slug <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(nelze měnit)</span></label>
                  <input className="aa-input aa-input--slug" value={editingCat.slug} disabled />
                </div>
                <div className="aa-field">
                  <label className="aa-field__label aa-field__label--required">Název</label>
                  <input className="aa-input" type="text" value={editName}
                    onChange={e => setEditName(e.target.value)} />
                </div>
                <div className="aa-form-row">
                  <div className="aa-field">
                    <label className="aa-field__label">Sort order</label>
                    <input className="aa-input" type="number" min="0" value={editSort}
                      onChange={e => setEditSort(e.target.value)} />
                  </div>
                  <div className="aa-field" style={{ justifyContent: 'flex-end' }}>
                    <label className="aa-checkbox-row" style={{ marginTop: '1.5rem' }}>
                      <input type="checkbox" checked={editActive}
                        onChange={e => setEditActive(e.target.checked)} />
                      <span>Aktivní</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="aa-modal__footer">
              <button className="aa-btn aa-btn--ghost" onClick={() => setEditingCat(null)} disabled={isSaving}>Zrušit</button>
              <button className="aa-btn aa-btn--primary" onClick={handleEditSaveCat} disabled={isSaving}>
                {isSaving ? 'Ukládám...' : 'Uložit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BackgroundMusicManager (root)
// ─────────────────────────────────────────────────────────────────────────────

export function BackgroundMusicManager() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'categories'>('tracks');
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminApi.backgroundCategories.getAll();
      setCategories(data);
    } catch {
      // categories fall back to defaults in children
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return (
    <div className="exercises-manager">
      {/* Inner tab row */}
      <div className="bg-manager__tabs">
        <button
          className={`bg-manager__tab ${activeTab === 'tracks' ? 'aktive' : ''}`}
          onClick={() => setActiveTab('tracks')}
        >
          Tracky
        </button>
        <button
          className={`bg-manager__tab ${activeTab === 'categories' ? 'aktive' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Kategorie
        </button>
      </div>

      {activeTab === 'tracks' && <TracksTab categories={categories} />}
      {activeTab === 'categories' && <CategoriesTab categories={categories} onRefresh={fetchCategories} />}
    </div>
  );
}
