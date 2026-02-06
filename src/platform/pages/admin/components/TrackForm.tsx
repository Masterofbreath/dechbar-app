/**
 * TrackForm Component
 * 
 * Modal form for creating/editing tracks.
 * Handles form state, validation, and API calls.
 * 
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/Components
 * @since 2.44.0
 */

import { useState, useEffect } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { Track } from '@/platform/components/AudioPlayer/types';
import type { TrackInput } from '@/platform/services/admin/types';
import './TrackForm.css';

interface TrackFormProps {
  track: Track | null; // null = create, Track = edit
  onSubmit: () => void;
  onCancel: () => void;
}

export function TrackForm({ track, onSubmit, onCancel }: TrackFormProps) {
  const [formData, setFormData] = useState<Partial<TrackInput>>({
    title: '',
    album_id: null,
    duration: 0,
    audio_url: '',
    cover_url: null,
    category: 'Ráno',
    tags: [],
    description: '',
    track_order: 0,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing existing track
  useEffect(() => {
    if (track) {
      setFormData({
        title: track.title,
        album_id: track.album_id,
        duration: track.duration,
        audio_url: track.audio_url,
        cover_url: track.cover_url,
        category: track.category,
        tags: track.tags || [],
        description: track.description,
        track_order: track.track_order,
        waveform_peaks: track.waveform_peaks,
      });
    }
  }, [track]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (track) {
        // Update existing track
        await adminApi.tracks.update(track.id, formData as Partial<TrackInput>);
      } else {
        // Create new track
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

  const handleChange = (field: keyof TrackInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="track-form-modal">
      <div className="track-form-modal__overlay" onClick={onCancel} />
      
      <div className="track-form-modal__content">
        <div className="track-form-modal__header">
          <h2>{track ? 'Upravit track' : 'Nový track'}</h2>
          <button
            className="track-form-modal__close"
            onClick={onCancel}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>

        <form className="track-form" onSubmit={handleSubmit}>
          <div className="track-form__field">
            <label htmlFor="title">Název *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="track-form__field">
            <label htmlFor="audio_url">Audio URL *</label>
            <input
              id="audio_url"
              type="url"
              value={formData.audio_url}
              onChange={(e) => handleChange('audio_url', e.target.value)}
              placeholder="https://dechbar-cdn.b-cdn.net/..."
              required
              disabled={isSubmitting}
            />
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
            />
          </div>

          <div className="track-form__field">
            <label htmlFor="category">Kategorie</label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Žádná</option>
              <option value="Ráno">Ráno</option>
              <option value="Klid">Klid</option>
              <option value="Energie">Energie</option>
              <option value="Večer">Večer</option>
            </select>
          </div>

          <div className="track-form__field">
            <label htmlFor="cover_url">Cover URL</label>
            <input
              id="cover_url"
              type="url"
              value={formData.cover_url || ''}
              onChange={(e) => handleChange('cover_url', e.target.value)}
              placeholder="https://..."
              disabled={isSubmitting}
            />
          </div>

          <div className="track-form__field">
            <label htmlFor="track_order">Pořadí</label>
            <input
              id="track_order"
              type="number"
              value={formData.track_order}
              onChange={(e) => handleChange('track_order', Number(e.target.value))}
              disabled={isSubmitting}
              min="0"
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
            />
          </div>

          {error && (
            <div className="track-form__error">
              ❌ {error}
            </div>
          )}

          <div className="track-form__actions">
            <button
              type="button"
              className="track-form__btn track-form__btn--cancel"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="track-form__btn track-form__btn--submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Ukládám...' : track ? 'Uložit' : 'Vytvořit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
