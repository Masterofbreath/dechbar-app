/**
 * Step4Lessons — Přidávání lekcí ke sériím
 *
 * Pro každou sérii: accordion s možností přidat lekci (název + audio upload).
 * Volitelný krok — "Přeskočit" vždy dostupné.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState } from 'react';
import { uploadService } from '@/platform/services/upload/uploadService';
import type { ProgramWizardState, LessonInput, SeriesInput } from '@/platform/services/admin/types';

interface Step4LessonsProps {
  state: ProgramWizardState;
  categorySlug: string;
  onLessonsChange: (seriesIdx: number, lessons: LessonInput[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

interface LessonFormState {
  title: string;
  audioFile: File | null;
  uploadProgress: number | null;
  isUploading: boolean;
  error: string | null;
}

const emptyLessonForm = (): LessonFormState => ({
  title: '',
  audioFile: null,
  uploadProgress: null,
  isUploading: false,
  error: null,
});

export function Step4Lessons({ state, categorySlug, onLessonsChange, onNext, onSkip, onBack }: Step4LessonsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [lessonForms, setLessonForms] = useState<LessonFormState[]>(
    state.series.map(() => emptyLessonForm())
  );

  const updateForm = (seriesIdx: number, patch: Partial<LessonFormState>) => {
    setLessonForms((prev) => prev.map((f, i) => (i === seriesIdx ? { ...f, ...patch } : f)));
  };

  const addLesson = async (seriesIdx: number, serie: SeriesInput) => {
    const form = lessonForms[seriesIdx];
    if (!form.title.trim()) return;

    const existingLessons = state.lessons[seriesIdx] ?? [];
    const dayNumber = existingLessons.length + 1;
    const moduleId = state.program.created_module_id ?? state.program.slug;

    let audioUrl = '';
    let durationSeconds = 0;

    if (form.audioFile) {
      updateForm(seriesIdx, { isUploading: true, error: null });
      try {
        audioUrl = await uploadService.uploadAkademieAudio(
          form.audioFile,
          categorySlug,
          moduleId,
          dayNumber,
          form.title,
          (p) => updateForm(seriesIdx, { uploadProgress: p.percent }),
        );
        const meta = await uploadService.extractAudioMetadata(form.audioFile);
        durationSeconds = meta.duration ?? 0;
      } catch (err) {
        updateForm(seriesIdx, { isUploading: false, error: err instanceof Error ? err.message : 'Chyba uploadu' });
        return;
      }
      updateForm(seriesIdx, { isUploading: false, uploadProgress: null });
    }

    const newLesson: LessonInput = {
      title: form.title.trim(),
      day_number: dayNumber,
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      sort_order: existingLessons.length * 10,
    };

    onLessonsChange(seriesIdx, [...existingLessons, newLesson]);
    updateForm(seriesIdx, { title: '', audioFile: null, error: null });
    void serie; // consumed via parameter for week_number context
  };

  const removeLesson = (seriesIdx: number, lessonIdx: number) => {
    const updated = (state.lessons[seriesIdx] ?? [])
      .filter((_, i) => i !== lessonIdx)
      .map((l, i) => ({ ...l, day_number: i + 1, sort_order: i * 10 }));
    onLessonsChange(seriesIdx, updated);
  };

  return (
    <div className="aa-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Přidejte lekce. Každá lekce = název + audio soubor. Audios jsou nepovinné — lze doplnit kdykoli.
        </p>
        <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={onSkip}>
          Přeskočit
        </button>
      </div>

      {state.series.length === 0 && (
        <div className="aa-empty">Žádné série — přeskočte nebo se vraťte a přidejte série.</div>
      )}

      {state.series.map((serie, seriesIdx) => {
        const lessons = state.lessons[seriesIdx] ?? [];
        const form = lessonForms[seriesIdx] ?? emptyLessonForm();
        const isExpanded = expandedIdx === seriesIdx;

        return (
          <div
            key={seriesIdx}
            style={{ border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}
          >
            <button
              style={{
                width: '100%', padding: '0.875rem 1rem', background: '#111', border: 'none', cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 500, textAlign: 'left',
              }}
              onClick={() => setExpandedIdx(isExpanded ? null : seriesIdx)}
            >
              <span>Týden {serie.week_number}: {serie.name}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.75rem' }}>
                {lessons.length} lekcí
                <span style={{ marginLeft: 8 }}>{isExpanded ? '▲' : '▼'}</span>
              </span>
            </button>

            {isExpanded && (
              <div style={{ padding: '1rem', background: '#0e0e0e' }}>
                {/* Existing lessons */}
                {lessons.map((lesson, lessonIdx) => (
                  <div
                    key={lessonIdx}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0', borderBottom: '1px solid #1a1a1a', fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      D{lesson.day_number} — {lesson.title}
                      {lesson.duration_seconds ? (
                        <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                          ({Math.round(lesson.duration_seconds / 60)} min)
                        </span>
                      ) : null}
                    </span>
                    <button className="aa-btn aa-btn--icon" onClick={() => removeLesson(seriesIdx, lessonIdx)} title="Smazat">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Add lesson form */}
                {form.error && <div className="aa-error-banner" style={{ marginBottom: 8 }}>{form.error}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
                  <div className="aa-field" style={{ flex: 1 }}>
                    <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>
                      Den {lessons.length + 1} — název
                    </label>
                    <input
                      className="aa-input"
                      value={form.title}
                      onChange={(e) => updateForm(seriesIdx, { title: e.target.value })}
                      placeholder={`Název lekce pro den ${lessons.length + 1}`}
                      onKeyDown={(e) => e.key === 'Enter' && void addLesson(seriesIdx, serie)}
                    />
                  </div>
                  <div className="aa-field" style={{ flex: 1 }}>
                    <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Audio (MP3)</label>
                    <div
                      className="aa-upload-area"
                      style={{ padding: '0.5rem' }}
                      onClick={() => document.getElementById(`audio-upload-${seriesIdx}`)?.click()}
                    >
                      {form.audioFile ? (
                        <div className="aa-upload-area__text" style={{ fontSize: '0.75rem' }}>
                          {form.audioFile.name}
                        </div>
                      ) : (
                        <div className="aa-upload-area__text" style={{ fontSize: '0.75rem' }}>
                          Vyberte MP3 (volitelné)
                        </div>
                      )}
                      {form.uploadProgress !== null && (
                        <div className="aa-progress-bar">
                          <div className="aa-progress-bar__fill" style={{ width: `${form.uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <input
                      id={`audio-upload-${seriesIdx}`}
                      type="file"
                      accept="audio/mpeg,audio/mp4,audio/wav"
                      style={{ display: 'none' }}
                      onChange={(e) => updateForm(seriesIdx, { audioFile: e.target.files?.[0] ?? null })}
                    />
                  </div>
                  <button
                    className="aa-btn aa-btn--primary aa-btn--sm"
                    onClick={() => void addLesson(seriesIdx, serie)}
                    disabled={!form.title.trim() || form.isUploading}
                    style={{ marginBottom: 4 }}
                  >
                    {form.isUploading ? 'Uploading…' : 'Přidat'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button className="aa-btn aa-btn--ghost" onClick={onBack}>
          ← Zpět
        </button>
        <button className="aa-btn aa-btn--primary" onClick={onNext}>
          Pokračovat →
        </button>
      </div>
    </div>
  );
}
