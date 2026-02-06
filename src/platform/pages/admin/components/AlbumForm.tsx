/**
 * AlbumForm Component
 * 
 * Modal form for creating/editing albums.
 * Uses FullscreenModal for consistent Apple premium style.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.47.0
 */

import { useState, useEffect } from 'react';
import { FullscreenModal } from '@/components/shared';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService } from '@/platform/services/upload/uploadService';
import type { Album } from '@/platform/components/AudioPlayer/types';
import type { AlbumInput } from '@/platform/services/admin/types';
import './AlbumForm.css';

interface AlbumFormProps {
  album: Album | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AlbumForm({ album, onSubmit, onCancel }: AlbumFormProps) {
  const [formData, setFormData] = useState<Partial<AlbumInput>>({
    name: '',
    description: '',
    cover_url: '',
    type: 'decharna',
    difficulty: 'medium',
    is_locked: false,
    required_tier: 'FREE',
    points: 0,
    start_date: null,
    end_date: null,
    day_count: null,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (album) {
      setFormData({
        name: album.name,
        description: album.description,
        cover_url: album.cover_url,
        type: album.type,
        difficulty: album.difficulty,
        is_locked: album.is_locked,
        required_tier: album.required_tier,
        points: album.points,
        start_date: album.start_date,
        end_date: album.end_date,
        day_count: album.day_count,
      });
    }
  }, [album]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Neplatný formát! Povolené: JPG, PNG, WebP');
      return;
    }

    try {
      setIsUploading(true);
      const cdnUrl = await uploadService.uploadImage(file, 'cover', (progress) => {
        setUploadProgress(progress.percent);
      });
      handleChange('cover_url', cdnUrl);
      alert('✅ Cover nahrán na CDN!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Nepodařilo se nahrát cover');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (album) {
        await adminApi.albums.update(album.id, formData as Partial<AlbumInput>);
      } else {
        await adminApi.albums.create(formData as AlbumInput);
      }
      onSubmit();
    } catch (err) {
      console.error('Form submit error:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit album');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof AlbumInput, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FullscreenModal 
      isOpen={true} 
      onClose={onCancel}
      className="fullscreen-modal--form fullscreen-modal--wide"
    >
      <FullscreenModal.TopBar>
        <FullscreenModal.Title>
          {album ? 'Upravit album' : 'Nové album'}
        </FullscreenModal.Title>
        <FullscreenModal.CloseButton onClick={onCancel} />
      </FullscreenModal.TopBar>

      <FullscreenModal.ContentZone>
        <form className="album-form" onSubmit={handleSubmit}>
          {/* SEKCE 1: ZÁKLADNÍ INFORMACE */}
          <h3 className="album-form__section-title">
            <svg className="album-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeLinecap="round"/>
            </svg>
            Základní informace
          </h3>

          <div className="album-form__field">
            <label htmlFor="name">Název *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="např. 21denní výzva"
            />
          </div>

          <div className="album-form__field">
            <label htmlFor="type">Typ *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="decharna">Dechárna</option>
              <option value="challenge">Výzva</option>
              <option value="course">Kurz</option>
              <option value="training">Trénink</option>
            </select>
          </div>

          <div className="album-form__field album-form__field--full">
            <label htmlFor="cover_url">Cover obrázek</label>
            <div className="album-form__file-input">
              <input
                id="cover_file"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverFileUpload}
                disabled={isSubmitting || isUploading}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="album-form__upload-btn"
                onClick={() => document.getElementById('cover_file')?.click()}
                disabled={isSubmitting || isUploading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isUploading ? `Nahrávám... ${uploadProgress}%` : 'Nahrát cover'}
              </button>
            </div>

            {isUploading && (
              <div className="album-form__progress-bar">
                <div className="album-form__progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <input
              id="cover_url"
              type="url"
              value={formData.cover_url || ''}
              onChange={(e) => handleChange('cover_url', e.target.value)}
              placeholder="Nebo vlož URL ručně..."
              disabled={isSubmitting || isUploading}
            />
          </div>

          <div className="album-form__field album-form__field--full">
            <label htmlFor="description">Popis</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              disabled={isSubmitting}
              placeholder="Krátký popis alba..."
            />
          </div>

          {/* SEKCE 2: NASTAVENÍ ALBA */}
          <h3 className="album-form__section-title">
            <svg className="album-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 1v6m0 6v6M3 12h6m6 0h6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Nastavení alba
          </h3>

          <div className="album-form__field">
            <label htmlFor="difficulty">Obtížnost</label>
            <select
              id="difficulty"
              value={formData.difficulty}
              onChange={(e) => handleChange('difficulty', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="easy">Snadné (začátečníci)</option>
              <option value="medium">Střední (pokročilí)</option>
              <option value="hard">Náročné (experti)</option>
              <option value="extreme">Extrémní (profíci)</option>
            </select>
          </div>

          <div className="album-form__field">
            <label htmlFor="required_tier">Požadovaný tier</label>
            <select
              id="required_tier"
              value={formData.required_tier}
              onChange={(e) => handleChange('required_tier', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="FREE">FREE</option>
              <option value="SMART">SMART</option>
              <option value="AI_COACH">AI COACH</option>
            </select>
          </div>

          <div className="album-form__field">
            <label htmlFor="points">Body</label>
            <input
              id="points"
              type="number"
              value={formData.points}
              onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
              min="0"
              disabled={isSubmitting}
              placeholder="např. 100"
            />
          </div>

          {formData.type === 'challenge' && (
            <div className="album-form__field">
              <label htmlFor="day_count">Počet dní *</label>
              <input
                id="day_count"
                type="number"
                value={formData.day_count || ''}
                onChange={(e) => handleChange('day_count', parseInt(e.target.value) || null)}
                required
                min="1"
                disabled={isSubmitting}
                placeholder="např. 21"
              />
            </div>
          )}

          <div className="album-form__field">
            <label htmlFor="start_date">Začátek (volitelné)</label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value || null)}
              disabled={isSubmitting}
            />
          </div>

          <div className="album-form__field">
            <label htmlFor="end_date">Konec (volitelné)</label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => handleChange('end_date', e.target.value || null)}
              disabled={isSubmitting}
            />
          </div>

          <div className="album-form__field album-form__field--full">
            <span className="album-form__hint">
              Pro naplánované výzvy můžeš nastavit datum začátku a konce
            </span>
          </div>

          {/* SEKCE 3: PŘÍSTUP */}
          <h3 className="album-form__section-title">
            <svg className="album-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Přístup
          </h3>

          <div className="album-form__field album-form__field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.is_locked}
                onChange={(e) => handleChange('is_locked', e.target.checked)}
                disabled={isSubmitting}
              />
              Zamčeno (vyžaduje předplatné)
            </label>
          </div>

          {error && <div className="album-form__error">{error}</div>}
        </form>
      </FullscreenModal.ContentZone>

      <FullscreenModal.BottomBar>
        <button
          type="submit"
          form="album-form-id"
          className="album-form__btn album-form__btn--submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Ukládám...' : album ? 'Uložit' : 'Vytvořit'}
        </button>
      </FullscreenModal.BottomBar>
    </FullscreenModal>
  );
}
