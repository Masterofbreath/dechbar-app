/**
 * BackgroundMusicManager
 *
 * Admin component for managing background_tracks table.
 * Lists existing tracks, allows adding new ones (with CDN upload), toggling active state, deleting.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/ExercisesAdmin
 * @since 2.48.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService, slugify } from '@/platform/services/upload/uploadService';
import type { BackgroundTrack } from '@/modules/mvp0/types/audio';

const TIER_LABELS: Record<string, string> = {
  ZDARMA: 'Zdarma',
  SMART: 'SMART',
  AI_COACH: 'AI Coach',
};

const CATEGORY_OPTIONS = [
  { value: 'nature',   label: 'Příroda' },
  { value: 'binaural', label: 'Binaurální' },
  { value: 'tibetan',  label: 'Tibetské' },
  { value: 'yogic',    label: 'Jógické' },
];

const TIER_OPTIONS = [
  { value: 'ZDARMA',   label: 'Zdarma' },
  { value: 'SMART',    label: 'SMART' },
  { value: 'AI_COACH', label: 'AI Coach' },
];

interface FormState {
  name: string;
  slug: string;
  category: string;
  required_tier: string;
  sort_order: string;
  is_active: boolean;
  file: File | null;
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  category: 'nature',
  required_tier: 'ZDARMA',
  sort_order: '0',
  is_active: true,
  file: null,
};

export function BackgroundMusicManager() {
  const [tracks, setTracks] = useState<BackgroundTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleToggleActive = async (track: BackgroundTrack) => {
    try {
      await adminApi.backgroundMusic.update(track.id, { is_active: !track.is_active });
      setTracks(prev => prev.map(t =>
        t.id === track.id ? { ...t, is_active: !t.is_active } : t
      ));
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

    if (!form.file) {
      setError('Vyberte audio soubor');
      return;
    }
    if (!form.slug) {
      setError('Název nesmí být prázdný');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const cdnUrl = await uploadService.uploadSessionAudio(
        form.file,
        'background',
        form.slug,
        ({ percent }) => setUploadProgress(percent),
      );

      await adminApi.backgroundMusic.create({
        name: form.name,
        slug: form.slug,
        category: form.category as BackgroundTrack['category'],
        cdn_url: cdnUrl,
        required_tier: form.required_tier as BackgroundTrack['required_tier'],
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order, 10) || 0,
      });

      setForm(EMPTY_FORM);
      setShowForm(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchTracks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="exercises-manager">
      {/* Header row */}
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
          <form onSubmit={handleSubmit} className="exercises-manager__form">
            <div className="exercises-manager__field">
              <label className="exercises-manager__label">Název</label>
              <input
                className="exercises-manager__input"
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Tibetské mísy — Ráno"
                required
              />
            </div>

            <div className="exercises-manager__field">
              <label className="exercises-manager__label">Slug (auto)</label>
              <input
                className="exercises-manager__input"
                type="text"
                value={form.slug}
                onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="tibetske-misy-rano"
                required
              />
            </div>

            <div className="exercises-manager__field">
              <label className="exercises-manager__label">Kategorie</label>
              <select
                className="exercises-manager__select"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="exercises-manager__field">
              <label className="exercises-manager__label">Tier</label>
              <select
                className="exercises-manager__select"
                value={form.required_tier}
                onChange={e => setForm(prev => ({ ...prev, required_tier: e.target.value }))}
              >
                {TIER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="exercises-manager__field">
              <label className="exercises-manager__label">Sort order</label>
              <input
                className="exercises-manager__input"
                type="number"
                value={form.sort_order}
                onChange={e => setForm(prev => ({ ...prev, sort_order: e.target.value }))}
                min="0"
              />
            </div>

            <div className="exercises-manager__field" style={{ alignSelf: 'flex-end' }}>
              <label className="exercises-manager__toggle">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                Aktivní
              </label>
            </div>

            <div className="exercises-manager__field exercises-manager__form-full">
              <label className="exercises-manager__label">Audio soubor (.aac, .mp3, .m4a)</label>
              <input
                ref={fileInputRef}
                className="exercises-manager__input"
                type="file"
                accept=".aac,.mp3,.m4a,.wav"
                onChange={e => setForm(prev => ({ ...prev, file: e.target.files?.[0] ?? null }))}
                required
              />
              {isUploading && (
                <span className="exercises-manager__progress">
                  Nahrávám... {uploadProgress}%
                </span>
              )}
            </div>

            <div className="exercises-manager__form-full exercises-manager__actions">
              <button
                type="submit"
                className="exercises-manager__btn exercises-manager__btn--primary"
                disabled={isUploading}
              >
                {isUploading ? `Nahrávám ${uploadProgress}%...` : 'Uložit track'}
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
              {tracks.map(track => (
                <tr key={track.id}>
                  <td>{track.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{track.slug}</td>
                  <td>
                    <span className="exercises-manager__badge">
                      {CATEGORY_OPTIONS.find(c => c.value === track.category)?.label ?? track.category}
                    </span>
                  </td>
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
                      <button
                        className="exercises-manager__btn"
                        onClick={() => handleToggleActive(track)}
                      >
                        {track.is_active ? 'Deaktivovat' : 'Aktivovat'}
                      </button>
                      <button
                        className="exercises-manager__btn exercises-manager__btn--danger"
                        onClick={() => handleDelete(track.id)}
                      >
                        Smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
