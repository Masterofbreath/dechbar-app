/**
 * TrackForm Component
 * 
 * Modal form for creating/editing tracks with upload functionality.
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
import { TagSelect } from './TagSelect';
import type { Track, Album } from '@/platform/components/AudioPlayer/types';
import type { TrackInput } from '@/platform/services/admin/types';
import './TrackForm.css';

interface TrackFormProps {
  track: Track | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export function TrackForm({ track, onSubmit, onCancel }: TrackFormProps) {
  const [formData, setFormData] = useState<Partial<TrackInput>>({
    title: '',
    album_id: null,
    artist: null,
    album: null,
    duration: 0,
    audio_url: '',
    cover_url: null,
    duration_category: null,
    mood_category: null,
    difficulty_level: null,
    kp_suitability: null,
    media_type: 'audio',
    exercise_format: null,
    intensity_level: null,
    narration_type: null,
    tags: [],
    description: '',
    track_order: 0,
    is_published: false,
  });
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);

  // Load albums for dropdown
  useEffect(() => {
    loadAlbums();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title,
        album_id: track.album_id,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        audio_url: track.audio_url,
        cover_url: track.cover_url,
        duration_category: track.duration_category,
        mood_category: track.mood_category,
        difficulty_level: track.difficulty_level,
        kp_suitability: track.kp_suitability,
        media_type: track.media_type,
        exercise_format: track.exercise_format,
        intensity_level: track.intensity_level,
        narration_type: track.narration_type,
        tags: track.tags || [],
        description: track.description,
        track_order: track.track_order,
        waveform_peaks: track.waveform_peaks,
        is_published: track.is_published,
      });
    }
  }, [track]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const loadAlbums = async () => {
    try {
      const data = await adminApi.albums.getAll();
      setAlbums(data);
    } catch (err) {
      console.error('Failed to load albums:', err);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/wav'];
    if (!validTypes.includes(file.type)) {
      alert('Neplatný formát! Povolené: MP3, M4A, WAV');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Extract metadata first
      const metadata = await uploadService.extractAudioMetadata(file);
      handleChange('duration', metadata.duration);

      // Upload file
      const cdnUrl = await uploadService.uploadAudio(file, metadata.duration, (progress) => {
        setUploadProgress(progress.percent);
      });

      // Update form
      handleChange('audio_url', cdnUrl);
      alert('✅ Audio nahráno na CDN!');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se nahrát audio');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

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
      const cdnUrl = await uploadService.uploadImage(file, 'cover');
      handleChange('cover_url', cdnUrl);
      alert('✅ Cover nahrán na CDN!');
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Nepodařilo se nahrát cover');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioUrlBlur = async () => {
    const url = formData.audio_url;
    if (!url || formData.duration > 0) return;

    try {
      setIsExtractingMetadata(true);
      const metadata = await uploadService.extractAudioMetadata(url);
      handleChange('duration', metadata.duration);
    } catch (err) {
      console.error('Failed to extract metadata:', err);
    } finally {
      setIsExtractingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (track) {
        await adminApi.tracks.update(track.id, formData as Partial<TrackInput>);
      } else {
        await adminApi.tracks.create(formData as TrackInput);
      }
      onSubmit();
    } catch (err) {
      console.error('Form submit error:', err);
      setError(err instanceof Error ? err.message : 'Nepodařilo se uložit track');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof TrackInput, value: string | number | boolean | string[]) => {
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
          {track ? 'Upravit track' : 'Nový track'}
        </FullscreenModal.Title>
        <FullscreenModal.CloseButton onClick={onCancel} />
      </FullscreenModal.TopBar>

      <FullscreenModal.ContentZone>
        <form className="track-form" onSubmit={handleSubmit}>
          {/* SEKCE 1: ZÁKLADNÍ INFORMACE */}
          <h3 className="track-form__section-title">
            <svg className="track-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 2a1 1 0 0 1 1 1v2h4V3a1 1 0 1 1 2 0v2h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2V3a1 1 0 0 1 1-1z" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="4" y1="9" x2="20" y2="9" strokeLinecap="round"/>
            </svg>
            Základní informace
          </h3>

          <div className="track-form__field">
            <label htmlFor="title">Název *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="např. Ranní probuzení"
            />
          </div>

          <div className="track-form__field">
            <label htmlFor="album_id">Album</label>
            <select
              id="album_id"
              value={formData.album_id || ''}
              onChange={(e) => handleChange('album_id', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Bez alba</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.name}
                </option>
              ))}
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="audio_url">Audio soubor *</label>
            <div className="track-form__file-input">
              <input
                id="audio_file"
                type="file"
                accept="audio/mp3,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav"
                onChange={handleAudioFileUpload}
                disabled={isSubmitting || isUploading}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="track-form__upload-btn"
                onClick={() => document.getElementById('audio_file')?.click()}
                disabled={isSubmitting || isUploading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isUploading ? `Nahrávám... ${uploadProgress}%` : 'Nahrát audio'}
              </button>
            </div>

            {isUploading && (
              <div className="track-form__progress-bar">
                <div className="track-form__progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <input
              id="audio_url"
              type="url"
              value={formData.audio_url}
              onChange={(e) => handleChange('audio_url', e.target.value)}
              onBlur={handleAudioUrlBlur}
              placeholder="Nebo vlož URL ručně..."
              required
              disabled={isSubmitting || isUploading}
            />
            {isExtractingMetadata && (
              <span className="track-form__metadata-hint">Načítám délku z URL...</span>
            )}
          </div>

          <div className="track-form__field">
            <label htmlFor="cover_url">Cover obrázek</label>
            <div className="track-form__file-input">
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
                className="track-form__upload-btn"
                onClick={() => document.getElementById('cover_file')?.click()}
                disabled={isSubmitting || isUploading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Nahrát cover
              </button>
            </div>

            <input
              id="cover_url"
              type="url"
              value={formData.cover_url || ''}
              onChange={(e) => handleChange('cover_url', e.target.value)}
              placeholder="Nebo vlož URL ručně..."
              disabled={isSubmitting || isUploading}
            />
          </div>

          <div className="track-form__field track-form__field--full">
            <label htmlFor="description">Popis</label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              disabled={isSubmitting}
              placeholder="Krátký popis cvičení..."
            />
          </div>

          {/* SEKCE 2: KATEGORIZACE CVIČENÍ */}
          <h3 className="track-form__section-title">
            <svg className="track-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Kategorizace cvičení
          </h3>

          <div className="track-form__field">
            <label htmlFor="exercise_format">Typ cvičení</label>
            <select
              id="exercise_format"
              value={formData.exercise_format || ''}
              onChange={(e) => handleChange('exercise_format', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Není určeno</option>
              <option value="dechpresso">Dechpresso (krátké intenzivní)</option>
              <option value="meditace">Meditace (delší funkční)</option>
              <option value="breathwork">Breathwork (dlouhé transformační)</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="intensity_level">Fyzická intenzita</label>
            <select
              id="intensity_level"
              value={formData.intensity_level || ''}
              onChange={(e) => handleChange('intensity_level', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Není určena</option>
              <option value="jemna">Jemná (relaxační)</option>
              <option value="stredni">Střední (udržovací)</option>
              <option value="vysoka">Vysoká (náročné)</option>
              <option value="extremni">Extrémní (profesionálové)</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="difficulty_level">Obtížnost cvičení</label>
            <select
              id="difficulty_level"
              value={formData.difficulty_level || ''}
              onChange={(e) => handleChange('difficulty_level', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Neurčeno</option>
              <option value="easy">Snadné (začátečníci)</option>
              <option value="medium">Střední (pokročilí)</option>
              <option value="hard">Náročné (experti)</option>
              <option value="extreme">Extrémní (profíci)</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="narration_type">Styl narace</label>
            <select
              id="narration_type"
              value={formData.narration_type || ''}
              onChange={(e) => handleChange('narration_type', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Není určen</option>
              <option value="pribeh">Příběh (příběhové vedení)</option>
              <option value="bez-pribehu">Bez příběhu (jen pokyny)</option>
              <option value="guided">Guided (detailní vedení)</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="mood_category">Kategorie nálady</label>
            <select
              id="mood_category"
              value={formData.mood_category || ''}
              onChange={(e) => handleChange('mood_category', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Žádná</option>
              <option value="Ráno">Ráno</option>
              <option value="Energie">Energie</option>
              <option value="Klid">Klid</option>
              <option value="Soustředění">Soustředění</option>
              <option value="Večer">Večer</option>
              <option value="Special">Special</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="duration_category">Kategorie délky</label>
            <select
              id="duration_category"
              value={formData.duration_category || ''}
              onChange={(e) => handleChange('duration_category', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Žádná</option>
              <option value="3-9">3-9 minut</option>
              <option value="10-25">10-25 minut</option>
              <option value="26-60">26-60 minut</option>
              <option value="kurz">Kurz</option>
              <option value="reels">Reels</option>
            </select>
          </div>

          <div className="track-form__field track-form__field--full">
            <label htmlFor="kp_suitability">Vhodnost podle KP</label>
            <select
              id="kp_suitability"
              value={formData.kp_suitability || ''}
              onChange={(e) => handleChange('kp_suitability', e.target.value || null)}
              disabled={isSubmitting}
            >
              <option value="">Není specifikováno</option>
              <option value="pod-10s">Pod 10s (nízké KP, začátečníci)</option>
              <option value="11s-20s">11-20s (průměrné KP)</option>
              <option value="20s-30s">20-30s (dobré KP, pokročilí)</option>
              <option value="nad-30s">Nad 30s (výborné KP, experti)</option>
            </select>
            <span className="track-form__hint">
              Po měření KP doporučíme uživateli vhodné cvičení podle tohoto nastavení
            </span>
          </div>

          {/* SEKCE 3: TAGY & METADATA */}
          <h3 className="track-form__section-title">
            <svg className="track-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Tagy & metadata
          </h3>

          <div className="track-form__field track-form__field--full">
            <label>Tagy (multi-select)</label>
            <TagSelect
              selectedTags={formData.tags || []}
              availableTags={[
                'Ráno',
                'Energie',
                'Klid',
                'Soustředění',
                'Večer',
                'Special',
                'Focus',
                'Spánek',
                'Probuzení',
                'Relaxace'
              ]}
              onChange={(tags) => handleChange('tags', tags)}
              disabled={isSubmitting}
            />
          </div>

          <div className="track-form__field">
            <label htmlFor="media_type">Typ média</label>
            <select
              id="media_type"
              value={formData.media_type || 'audio'}
              onChange={(e) => handleChange('media_type', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="duration">Délka (sekundy) *</label>
            <input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', Number(e.target.value))}
              required
              disabled={isSubmitting}
              min="0"
              placeholder="např. 300"
            />
          </div>

          {/* SEKCE 4: PUBLIKACE */}
          <h3 className="track-form__section-title">
            <svg className="track-form__section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 2l7.586 7.586" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
            Publikace
          </h3>

          <div className="track-form__field track-form__field--checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => handleChange('is_published', e.target.checked)}
                disabled={isSubmitting}
              />
              Publikováno (viditelné pro uživatele)
            </label>
          </div>

          {error && <div className="track-form__error">{error}</div>}
        </form>
      </FullscreenModal.ContentZone>

      <FullscreenModal.BottomBar>
        <button
          type="submit"
          form="track-form-id"
          className="track-form__btn track-form__btn--submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Ukládám...' : track ? 'Uložit' : 'Vytvořit'}
        </button>
      </FullscreenModal.BottomBar>
    </FullscreenModal>
  );
}
