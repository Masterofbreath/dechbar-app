/**
 * LessonManager — Modal pro správu lekcí existujícího programu
 *
 * Záložky pro každou sérii, v každé záložce tabulka lekcí + přidání nové.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { uploadService } from '@/platform/services/upload/uploadService';
import type { AkademieProgram, AkademieSeries, AkademieLesson } from '@/platform/services/admin/types';

interface LessonManagerProps {
  program: AkademieProgram;
  onClose: () => void;
}

interface LessonForm {
  title: string;
  audioFile: File | null;
  uploadProgress: number | null;
  isUploading: boolean;
  error: string | null;
}

const emptyForm = (): LessonForm => ({
  title: '', audioFile: null, uploadProgress: null, isUploading: false, error: null,
});

export function LessonManager({ program, onClose }: LessonManagerProps) {
  const [series, setSeries] = useState<AkademieSeries[]>([]);
  const [lessonsBySeries, setLessonsBySeries] = useState<Record<string, AkademieLesson[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [addForms, setAddForms] = useState<Record<string, LessonForm>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const seriesData = await adminApi.akademie.series.getByModuleId(program.module_id);
      setSeries(seriesData);
      if (seriesData.length > 0 && !activeSeriesId) {
        setActiveSeriesId(seriesData[0].id);
      }

      const byId: Record<string, AkademieLesson[]> = {};
      for (const s of seriesData) {
        byId[s.id] = await adminApi.akademie.lessons.getBySeriesId(s.id);
      }
      setLessonsBySeries(byId);

      const forms: Record<string, LessonForm> = {};
      for (const s of seriesData) {
        forms[s.id] = emptyForm();
      }
      setAddForms(forms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
    } finally {
      setIsLoading(false);
    }
  }, [program.module_id, activeSeriesId]);

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program.module_id]);

  const updateForm = (seriesId: string, patch: Partial<LessonForm>) => {
    setAddForms((prev) => ({ ...prev, [seriesId]: { ...(prev[seriesId] ?? emptyForm()), ...patch } }));
  };

  const getCategorySlug = (): string => {
    // Try to get from program data — fallback to 'akademie'
    return 'akademie';
  };

  const handleAddLesson = async (serie: AkademieSeries) => {
    const form = addForms[serie.id] ?? emptyForm();
    if (!form.title.trim()) return;

    const existingLessons = lessonsBySeries[serie.id] ?? [];
    const dayNumber = existingLessons.length + 1;
    const moduleId = program.module_id;
    const catSlug = getCategorySlug();

    let audioUrl = '';
    let durationSeconds = 0;

    if (form.audioFile) {
      updateForm(serie.id, { isUploading: true, error: null });
      try {
        audioUrl = await uploadService.uploadAkademieAudio(
          form.audioFile,
          catSlug,
          moduleId,
          dayNumber,
          form.title,
          (p) => updateForm(serie.id, { uploadProgress: p.percent }),
        );
        const meta = await uploadService.extractAudioMetadata(form.audioFile);
        durationSeconds = meta.duration ?? 0;
      } catch (err) {
        updateForm(serie.id, { isUploading: false, error: err instanceof Error ? err.message : 'Chyba uploadu' });
        return;
      }
      updateForm(serie.id, { isUploading: false, uploadProgress: null });
    }

    try {
      await adminApi.akademie.lessons.create({
        series_id: serie.id,
        module_id: moduleId,
        title: form.title.trim(),
        audio_url: audioUrl,
        duration_seconds: durationSeconds,
        day_number: dayNumber,
        sort_order: existingLessons.length * 10,
      });
      updateForm(serie.id, { title: '', audioFile: null });
      await load();
    } catch (err) {
      updateForm(serie.id, { error: err instanceof Error ? err.message : 'Chyba při přidávání lekce' });
    }
  };

  const handleDeleteLesson = async (id: string) => {
    try {
      await adminApi.akademie.lessons.delete(id);
      setDeleteConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání lekce');
    }
  };

  return (
    <div className="aa-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal aa-modal--wide">
        <div className="aa-modal__header">
          <h2 className="aa-modal__title">
            Lekce — {program.module_name ?? program.module_id}
          </h2>
          <button className="aa-btn--icon" onClick={onClose} aria-label="Zavřít">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="aa-modal__body">
          {error && <div className="aa-error-banner">{error}</div>}

          {isLoading ? (
            <div className="aa-loading">Načítám série a lekce…</div>
          ) : series.length === 0 ? (
            <div className="aa-empty">
              Žádné série. Přidejte nejprve série v nástroji "Série".
            </div>
          ) : (
            <>
              {/* Series tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                {series.map((s) => (
                  <button
                    key={s.id}
                    className={`aa-btn aa-btn--${activeSeriesId === s.id ? 'primary' : 'ghost'} aa-btn--sm`}
                    onClick={() => setActiveSeriesId(s.id)}
                  >
                    Týden {s.week_number}: {s.name}
                    <span style={{ marginLeft: 4, opacity: 0.7 }}>
                      ({(lessonsBySeries[s.id] ?? []).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Active series lessons */}
              {activeSeriesId && (() => {
                const activeSerie = series.find((s) => s.id === activeSeriesId);
                const lessons = lessonsBySeries[activeSeriesId] ?? [];
                const form = addForms[activeSeriesId] ?? emptyForm();

                return (
                  <div>
                    {/* Lessons table */}
                    {lessons.length > 0 && (
                      <div className="aa-table-wrap" style={{ marginBottom: 16 }}>
                        <table className="aa-table">
                          <thead>
                            <tr>
                              <th>Den</th>
                              <th>Název</th>
                              <th>Délka</th>
                              <th>Audio</th>
                              <th>Akce</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lessons.map((lesson) => (
                              <tr key={lesson.id}>
                                <td style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                  D{lesson.day_number}
                                </td>
                                <td style={{ fontWeight: 500 }}>{lesson.title}</td>
                                <td>
                                  {lesson.duration_seconds
                                    ? `${Math.round(lesson.duration_seconds / 60)} min`
                                    : '—'}
                                </td>
                                <td>
                                  {lesson.audio_url ? (
                                    <span className="aa-badge aa-badge--active">✓</span>
                                  ) : (
                                    <span className="aa-badge aa-badge--inactive">Chybí</span>
                                  )}
                                </td>
                                <td>
                                  {deleteConfirmId === lesson.id ? (
                                    <div className="aa-actions">
                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Smazat?</span>
                                      <button
                                        className="aa-btn aa-btn--danger aa-btn--sm"
                                        onClick={() => void handleDeleteLesson(lesson.id)}
                                      >Ano</button>
                                      <button
                                        className="aa-btn aa-btn--ghost aa-btn--sm"
                                        onClick={() => setDeleteConfirmId(null)}
                                      >Ne</button>
                                    </div>
                                  ) : (
                                    <button
                                      className="aa-btn aa-btn--danger aa-btn--sm"
                                      onClick={() => setDeleteConfirmId(lesson.id)}
                                    >
                                      Smazat
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Add lesson form */}
                    {form.error && <div className="aa-error-banner" style={{ marginBottom: 8 }}>{form.error}</div>}
                    <div style={{
                      background: 'rgba(248,202,0,0.04)', border: '1px dashed rgba(248,202,0,0.2)',
                      borderRadius: 8, padding: '1rem',
                    }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                        Přidat lekci (Den {lessons.length + 1})
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                        <div className="aa-field" style={{ flex: 2 }}>
                          <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Název lekce</label>
                          <input
                            className="aa-input"
                            value={form.title}
                            onChange={(e) => updateForm(activeSeriesId, { title: e.target.value })}
                            placeholder="Název lekce"
                            onKeyDown={(e) => e.key === 'Enter' && activeSerie && void handleAddLesson(activeSerie)}
                          />
                        </div>
                        <div className="aa-field" style={{ flex: 2 }}>
                          <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Audio (MP3, volitelné)</label>
                          <div
                            className="aa-upload-area"
                            style={{ padding: '0.5rem' }}
                            onClick={() => document.getElementById(`lesson-audio-${activeSeriesId}`)?.click()}
                          >
                            <div className="aa-upload-area__text" style={{ fontSize: '0.75rem' }}>
                              {form.audioFile ? form.audioFile.name : 'Vyberte MP3'}
                            </div>
                            {form.uploadProgress !== null && (
                              <div className="aa-progress-bar">
                                <div className="aa-progress-bar__fill" style={{ width: `${form.uploadProgress}%` }} />
                              </div>
                            )}
                          </div>
                          <input
                            id={`lesson-audio-${activeSeriesId}`}
                            type="file"
                            accept="audio/mpeg,audio/mp4,audio/wav"
                            style={{ display: 'none' }}
                            onChange={(e) => updateForm(activeSeriesId, { audioFile: e.target.files?.[0] ?? null })}
                          />
                        </div>
                        <button
                          className="aa-btn aa-btn--primary aa-btn--sm"
                          onClick={() => activeSerie && void handleAddLesson(activeSerie)}
                          disabled={!form.title.trim() || form.isUploading}
                          style={{ marginBottom: 4 }}
                        >
                          {form.isUploading ? 'Uploading…' : 'Přidat'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <div className="aa-modal__footer">
          <button className="aa-btn aa-btn--primary" onClick={onClose}>
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
