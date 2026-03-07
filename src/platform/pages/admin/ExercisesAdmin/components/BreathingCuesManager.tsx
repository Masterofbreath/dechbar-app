/**
 * BreathingCuesManager
 *
 * Admin component for managing breathing_cues table.
 * Zobrazuje cues seskupené do dvou košů:
 *   🫁 Dechové signály  — inhale, hold, exhale
 *   🔔 Zvonky session  — start_bell, end_bell
 *
 * Každý koš zobrazuje fáze jako karty. Lze nahrát replacement audio (aa-upload-area design).
 * DELETE záměrně chybí — vždy musí existovat 5 aktivních cues.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/ExercisesAdmin
 * @since 2.48.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService } from '@/platform/services/upload/uploadService';
import type { BreathingCueRecord } from '@/platform/services/admin/types';

// ─────────────────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<string, string> = {
  inhale:     'Nádech',
  hold:       'Zádrž',
  exhale:     'Výdech',
  start_bell: 'Zvonění startu',
  end_bell:   'Zvonění konce',
};

const PHASE_HINT: Record<string, string> = {
  inhale:     '963 Hz Solfeggio',
  hold:       '639 Hz Solfeggio',
  exhale:     '396 Hz Solfeggio',
  start_bell: 'Tibetská mísa / zvoneček',
  end_bell:   'Tibetská mísa / zvoneček',
};

const BREATH_PHASES = ['inhale', 'hold', 'exhale'];
const BELL_PHASES   = ['start_bell', 'end_bell'];

// ─────────────────────────────────────────────────────────────────────────────

interface CueCardProps {
  cue: BreathingCueRecord;
  previewUrl: string | null;
  uploadingId: string | null;
  uploadProgress: number;
  replacingId: string | null;
  onPreview: (url: string) => void;
  onStartReplace: (id: string) => void;
  onCancelReplace: () => void;
  onFileSelect: (cue: BreathingCueRecord, file: File) => void;
}

function CueCard({
  cue, previewUrl, uploadingId, uploadProgress,
  replacingId, onPreview, onStartReplace, onCancelReplace, onFileSelect,
}: CueCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadingId === cue.id;
  const isReplacing = replacingId === cue.id;

  return (
    <div className="cue-card">
      <div className="cue-card__header">
        <div>
          <div className="cue-card__phase">{PHASE_LABELS[cue.phase] ?? cue.phase}</div>
          <div className="cue-card__hint">{PHASE_HINT[cue.phase] ?? ''}</div>
        </div>
        <span className={`exercises-manager__badge exercises-manager__badge--${cue.is_active ? 'active' : 'inactive'}`}>
          {cue.is_active ? 'Aktivní' : 'Neaktivní'}
        </span>
      </div>

      {/* Current file info */}
      <div className="cue-card__source">
        {cue.cdn_url ? (
          <div className="cue-card__source-row">
            <span className="cue-card__source-url" title={cue.cdn_url}>
              {cue.cdn_url.replace('https://dechbar-cdn.b-cdn.net/', '…/')}
            </span>
            <button
              className="exercises-manager__btn"
              onClick={() => onPreview(cue.cdn_url!)}
              title={previewUrl === cue.cdn_url ? 'Zastavit' : 'Přehrát'}
            >
              {previewUrl === cue.cdn_url ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>
          </div>
        ) : (
          <span className="cue-card__source-fallback">
            Web Audio API — generovaný tón ({cue.generate_hz} Hz · {cue.playback_rate}× rate)
          </span>
        )}
      </div>

      {/* Replace area */}
      {isReplacing ? (
        <div className="cue-card__replace">
          {isUploading ? (
            <div className="aa-upload-area" style={{ cursor: 'default' }}>
              <div style={{ width: '100%' }}>
                <p className="aa-upload-area__text">Nahrávám…</p>
                <div className="aa-progress-bar">
                  <div className="aa-progress-bar__fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="aa-upload-area__hint">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="aa-upload-area" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".aac,.mp3,.m4a,.wav"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(cue, file);
                }}
              />
              <p className="aa-upload-area__text">Vyberte nový soubor</p>
              <p className="aa-upload-area__hint">.mp3 / .aac / .m4a / .wav</p>
            </div>
          )}
          {!isUploading && (
            <button className="aa-btn aa-btn--ghost" style={{ marginTop: '0.5rem', alignSelf: 'flex-end' }}
              onClick={onCancelReplace}>
              Zrušit
            </button>
          )}
        </div>
      ) : (
        <button className="exercises-manager__btn" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}
          onClick={() => onStartReplace(cue.id)}>
          {cue.cdn_url ? 'Nahradit soubor' : 'Nahrát soubor'}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CueGroup({ title, icon, cues, previewUrl, uploadingId, uploadProgress, replacingId,
  onPreview, onStartReplace, onCancelReplace, onFileSelect }: {
  title: string;
  icon: React.ReactNode;
  cues: BreathingCueRecord[];
} & Omit<CueCardProps, 'cue'>) {
  return (
    <div className="cue-group">
      <div className="cue-group__header">
        <span className="cue-group__icon">{icon}</span>
        <h3 className="cue-group__title">{title}</h3>
        <span className="cue-group__count">{cues.length} zvuků</span>
      </div>
      <div className="cue-group__cards">
        {cues.map(cue => (
          <CueCard
            key={cue.id}
            cue={cue}
            previewUrl={previewUrl}
            uploadingId={uploadingId}
            uploadProgress={uploadProgress}
            replacingId={replacingId}
            onPreview={onPreview}
            onStartReplace={onStartReplace}
            onCancelReplace={onCancelReplace}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function BreathingCuesManager() {
  const [cues, setCues] = useState<BreathingCueRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchCues = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApi.breathingCues.getAll();
      setCues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při načítání');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCues(); }, [fetchCues]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const handlePreview = (url: string) => {
    if (previewUrl === url) {
      audioRef.current?.pause();
      setPreviewUrl(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => null);
    setPreviewUrl(url);
    audio.addEventListener('ended', () => setPreviewUrl(null), { once: true });
  };

  const handleFileSelect = async (cue: BreathingCueRecord, file: File) => {
    try {
      setUploadingId(cue.id);
      setUploadProgress(0);
      setError(null);

      const cdnUrl = await uploadService.uploadSessionAudio(
        file, 'cue', cue.phase,
        ({ percent }) => setUploadProgress(percent),
      );

      await adminApi.breathingCues.update(cue.id, { cdn_url: cdnUrl });
      setCues(prev => prev.map(c => c.id === cue.id ? { ...c, cdn_url: cdnUrl } : c));
      setReplacingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při nahrávání');
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  };

  const breathCues = cues.filter(c => BREATH_PHASES.includes(c.phase));
  const bellCues   = cues.filter(c => BELL_PHASES.includes(c.phase));

  const groupProps = {
    previewUrl,
    uploadingId,
    uploadProgress,
    replacingId,
    onPreview: handlePreview,
    onStartReplace: (id: string) => setReplacingId(id),
    onCancelReplace: () => setReplacingId(null),
    onFileSelect: handleFileSelect,
  };

  return (
    <div className="exercises-manager">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="exercises-manager__section-title" style={{ margin: 0 }}>
          Dechové audio cues
        </h2>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
        Pět pevných audio signálů. Bez nahraného souboru systém generuje Solfeggio tón přes Web Audio API.
      </p>

      {error && <div className="exercises-manager__error">{error}</div>}

      {isLoading ? (
        <p className="exercises-manager__empty">Načítám...</p>
      ) : (
        <>
          <CueGroup
            title="Dechové signály"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0 -18 0"/>
                <path d="M12 8v4l3 3"/>
              </svg>
            }
            cues={breathCues.sort((a, b) =>
              BREATH_PHASES.indexOf(a.phase) - BREATH_PHASES.indexOf(b.phase)
            )}
            {...groupProps}
          />

          <CueGroup
            title="Zvonky session"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
            }
            cues={bellCues.sort((a, b) =>
              BELL_PHASES.indexOf(a.phase) - BELL_PHASES.indexOf(b.phase)
            )}
            {...groupProps}
          />
        </>
      )}
    </div>
  );
}
