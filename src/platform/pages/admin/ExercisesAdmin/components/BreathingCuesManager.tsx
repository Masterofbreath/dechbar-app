/**
 * BreathingCuesManager
 *
 * Admin component for managing breathing_cues table.
 * Always shows exactly 5 rows (one per phase). Allows uploading replacement audio files.
 * DELETE is intentionally absent — there must always be 5 active cues.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/ExercisesAdmin
 * @since 2.48.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService } from '@/platform/services/upload/uploadService';
import type { BreathingCueRecord } from '@/platform/services/admin/types';

const PHASE_LABELS: Record<string, string> = {
  inhale:     'Nádech',
  hold:       'Zádrž',
  exhale:     'Výdech',
  start_bell: 'Start Bell',
  end_bell:   'End Bell',
};

const PHASE_ORDER = ['inhale', 'hold', 'exhale', 'start_bell', 'end_bell'];

export function BreathingCuesManager() {
  const [cues, setCues] = useState<BreathingCueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchCues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.breathingCues.getAll();
      // Sort by defined phase order
      const sorted = [...data].sort(
        (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase)
      );
      setCues(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCues();
  }, [fetchCues]);

  const handlePreview = (url: string) => {
    if (previewUrl === url) {
      audioRef.current?.pause();
      setPreviewUrl(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => null);
    setPreviewUrl(url);
    audio.addEventListener('ended', () => setPreviewUrl(null), { once: true });
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handleReplace = async (cue: BreathingCueRecord, file: File) => {
    try {
      setUploadingId(cue.id);
      setUploadProgress(0);
      setError(null);

      const cdnUrl = await uploadService.uploadSessionAudio(
        file,
        'cue',
        cue.phase,
        ({ percent }) => setUploadProgress(percent),
      );

      await adminApi.breathingCues.update(cue.id, { cdn_url: cdnUrl });

      setCues(prev => prev.map(c =>
        c.id === cue.id ? { ...c, cdn_url: cdnUrl } : c
      ));
      setReplacingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při nahrávání');
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
      if (fileInputsRef.current[cue.id]) {
        fileInputsRef.current[cue.id]!.value = '';
      }
    }
  };

  return (
    <div className="exercises-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="exercises-manager__section-title" style={{ margin: 0 }}>
          Dechové audio cues
        </h2>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
        Pět pevných audio signálů pro fáze dechu. Pokud <code>CDN URL</code> není vyplněno,
        systém generuje Solfeggio tón přes Web Audio API.
      </p>

      {error && <div className="exercises-manager__error">{error}</div>}

      <div className="exercises-manager__section">
        {isLoading ? (
          <p className="exercises-manager__empty">Načítám...</p>
        ) : (
          cues.map(cue => (
            <div key={cue.id} className="exercises-manager__cue-row">
              {/* Phase label */}
              <div>
                <div className="exercises-manager__cue-phase">
                  {PHASE_LABELS[cue.phase] ?? cue.phase}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  {cue.generate_hz ? `${cue.generate_hz} Hz` : 'Bell'} · {cue.playback_rate}× rate
                </div>
              </div>

              {/* Current URL */}
              <div className="exercises-manager__cue-url" title={cue.cdn_url ?? 'Web Audio (generovaný tón)'}>
                {cue.cdn_url
                  ? cue.cdn_url.replace('https://dechbar-cdn.b-cdn.net/', '…/')
                  : <em style={{ color: 'var(--color-text-secondary)' }}>Web Audio fallback</em>
                }
              </div>

              {/* Preview */}
              {cue.cdn_url && (
                <button
                  className="exercises-manager__btn"
                  onClick={() => handlePreview(cue.cdn_url!)}
                  title="Přehrát preview"
                >
                  {previewUrl === cue.cdn_url ? '⏹' : '▶'}
                </button>
              )}

              {/* Replace action */}
              {replacingId === cue.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    ref={el => { fileInputsRef.current[cue.id] = el; }}
                    type="file"
                    accept=".aac,.mp3,.m4a,.wav"
                    className="exercises-manager__input"
                    style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleReplace(cue, file);
                    }}
                    disabled={uploadingId === cue.id}
                  />
                  {uploadingId === cue.id && (
                    <span className="exercises-manager__progress">{uploadProgress}%</span>
                  )}
                  <button
                    className="exercises-manager__btn exercises-manager__btn--danger"
                    onClick={() => setReplacingId(null)}
                  >
                    Zrušit
                  </button>
                </div>
              ) : (
                <button
                  className="exercises-manager__btn"
                  onClick={() => setReplacingId(cue.id)}
                >
                  Nahradit soubor
                </button>
              )}

              {/* Active status */}
              <span className={`exercises-manager__badge exercises-manager__badge--${cue.is_active ? 'active' : 'inactive'}`}>
                {cue.is_active ? 'Aktivní' : 'Neaktivní'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
