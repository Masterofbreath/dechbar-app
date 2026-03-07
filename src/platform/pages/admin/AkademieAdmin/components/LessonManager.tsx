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

interface EditingDuration {
  lessonId: string;
  value: string;
  saving: boolean;
}

interface EditingLesson {
  lessonId: string;
  title: string;
  primary_technique: string;
  secondary_technique: string;
  audioFile: File | null;
  uploadProgress: number | null;
  isUploading: boolean;
  isSaving: boolean;
  error: string | null;
}

const TECHNIQUE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— nevybráno —' },
  { value: 'humming', label: 'Bzučení' },
  { value: 'box_breathing', label: 'Box Breathing' },
  { value: 'extended_exhale', label: 'Prodloužený výdech' },
  { value: 'belly_breathing', label: 'Aktivace bránice' },
  { value: 'retention', label: 'Zádrže dechu' },
  { value: 'visualization', label: 'Vizualizace' },
  { value: 'pursed_lip', label: 'Přidušení' },
  { value: 'energizing', label: 'Hyperventilace' },
  { value: 'other', label: 'Funkční' },
];

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
  const [editingDuration, setEditingDuration] = useState<EditingDuration | null>(null);
  const [editingLesson, setEditingLesson] = useState<EditingLesson | null>(null);

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

  const handleSaveDuration = async (lessonId: string) => {
    if (!editingDuration) return;
    const minutes = parseFloat(editingDuration.value.replace(',', '.'));
    if (isNaN(minutes) || minutes <= 0) return;
    setEditingDuration((prev) => prev ? { ...prev, saving: true } : null);
    try {
      await adminApi.akademie.lessons.update(lessonId, {
        duration_seconds: Math.round(minutes * 60),
      });
      setEditingDuration(null);
      await load();
    } catch {
      setEditingDuration((prev) => prev ? { ...prev, saving: false } : null);
    }
  };

  const openEditLesson = (lesson: AkademieLesson) => {
    setEditingLesson({
      lessonId: lesson.id,
      title: lesson.title,
      primary_technique: lesson.primary_technique ?? '',
      secondary_technique: lesson.secondary_technique ?? '',
      audioFile: null,
      uploadProgress: null,
      isUploading: false,
      isSaving: false,
      error: null,
    });
    setDeleteConfirmId(null);
  };

  const handleSaveLesson = async (lesson: AkademieLesson) => {
    if (!editingLesson || editingLesson.lessonId !== lesson.id) return;
    if (!editingLesson.title.trim()) return;

    setEditingLesson((prev) => prev ? { ...prev, isSaving: true, error: null } : null);

    try {
      const patch: Record<string, unknown> = {
        title: editingLesson.title.trim(),
        primary_technique: editingLesson.primary_technique || null,
        secondary_technique: editingLesson.secondary_technique || null,
      };

      // Pokud je vybrán nový audio soubor → nahrát na CDN
      if (editingLesson.audioFile) {
        setEditingLesson((prev) => prev ? { ...prev, isUploading: true } : null);
        const audioUrl = await uploadService.uploadAkademieAudio(
          editingLesson.audioFile,
          getCategorySlug(),
          lesson.module_id,
          lesson.day_number,
          editingLesson.title.trim(),
          (p) => setEditingLesson((prev) => prev ? { ...prev, uploadProgress: p.percent } : null),
        );
        const meta = await uploadService.extractAudioMetadata(editingLesson.audioFile);
        patch.audio_url = audioUrl;
        patch.duration_seconds = meta.duration ?? lesson.duration_seconds;
        setEditingLesson((prev) => prev ? { ...prev, isUploading: false, uploadProgress: null } : null);
      }

      await adminApi.akademie.lessons.update(lesson.id, patch as Parameters<typeof adminApi.akademie.lessons.update>[1]);
      setEditingLesson(null);
      await load();
    } catch (err) {
      setEditingLesson((prev) => prev
        ? { ...prev, isSaving: false, isUploading: false, error: err instanceof Error ? err.message : 'Chyba při ukládání' }
        : null,
      );
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
                            {lessons.map((lesson) => {
                              const isEditing = editingLesson?.lessonId === lesson.id;
                              return (
                                <>
                                  <tr key={lesson.id} style={{ opacity: isEditing ? 0.5 : 1 }}>
                                    <td style={{ color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                                      D{lesson.day_number}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{lesson.title}</td>
                                    <td>
                                      {editingDuration?.lessonId === lesson.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            className="aa-input"
                                            style={{ width: 60, padding: '2px 6px', fontSize: '0.8125rem' }}
                                            value={editingDuration.value}
                                            onChange={(e) => setEditingDuration((prev) => prev ? { ...prev, value: e.target.value } : null)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') void handleSaveDuration(lesson.id);
                                              if (e.key === 'Escape') setEditingDuration(null);
                                            }}
                                            autoFocus
                                          />
                                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>min</span>
                                          <button
                                            className="aa-btn aa-btn--ghost aa-btn--sm"
                                            style={{ padding: '2px 6px' }}
                                            onClick={() => void handleSaveDuration(lesson.id)}
                                            disabled={editingDuration.saving}
                                          >✓</button>
                                          <button
                                            className="aa-btn aa-btn--ghost aa-btn--sm"
                                            style={{ padding: '2px 6px' }}
                                            onClick={() => setEditingDuration(null)}
                                          >✕</button>
                                        </div>
                                      ) : (
                                        <button
                                          className="aa-btn--icon"
                                          style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                                          title="Klikni pro úpravu délky"
                                          onClick={() => setEditingDuration({
                                            lessonId: lesson.id,
                                            value: lesson.duration_seconds ? String(Math.round(lesson.duration_seconds / 60)) : '',
                                            saving: false,
                                          })}
                                        >
                                          {lesson.duration_seconds
                                            ? `${Math.round(lesson.duration_seconds / 60)} min ✎`
                                            : '— ✎'}
                                        </button>
                                      )}
                                    </td>
                                    <td>
                                      {lesson.audio_url ? (
                                        <span className="aa-badge aa-badge--active">✓</span>
                                      ) : (
                                        <span className="aa-badge aa-badge--inactive">Chybí</span>
                                      )}
                                    </td>
                                    <td>
                                      <div className="aa-actions">
                                        {deleteConfirmId === lesson.id ? (
                                          <>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Smazat?</span>
                                            <button
                                              className="aa-btn aa-btn--danger aa-btn--sm"
                                              onClick={() => void handleDeleteLesson(lesson.id)}
                                            >Ano</button>
                                            <button
                                              className="aa-btn aa-btn--ghost aa-btn--sm"
                                              onClick={() => setDeleteConfirmId(null)}
                                            >Ne</button>
                                          </>
                                        ) : (
                                          <>
                                            <button
                                              className="aa-btn aa-btn--ghost aa-btn--sm"
                                              onClick={() => isEditing ? setEditingLesson(null) : openEditLesson(lesson)}
                                            >
                                              {isEditing ? 'Zrušit' : 'Upravit'}
                                            </button>
                                            <button
                                              className="aa-btn aa-btn--danger aa-btn--sm"
                                              onClick={() => setDeleteConfirmId(lesson.id)}
                                            >
                                              Smazat
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Inline edit form — rozbalí se pod řádkem */}
                                  {isEditing && editingLesson && (
                                    <tr key={`${lesson.id}-edit`}>
                                      <td colSpan={5} style={{ padding: '0 0 8px 0' }}>
                                        <div style={{
                                          background: 'rgba(248,202,0,0.06)',
                                          border: '1px solid rgba(248,202,0,0.25)',
                                          borderRadius: 8,
                                          padding: '0.875rem 1rem',
                                        }}>
                                          {editingLesson.error && (
                                            <div className="aa-error-banner" style={{ marginBottom: 8 }}>
                                              {editingLesson.error}
                                            </div>
                                          )}
                                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                            {/* Název */}
                                            <div className="aa-field" style={{ flex: 2, minWidth: 160 }}>
                                              <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Název lekce</label>
                                              <input
                                                className="aa-input"
                                                value={editingLesson.title}
                                                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, title: e.target.value } : null)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') void handleSaveLesson(lesson);
                                                  if (e.key === 'Escape') setEditingLesson(null);
                                                }}
                                                autoFocus
                                              />
                                            </div>

                                            {/* Primární technika */}
                                            <div className="aa-field" style={{ flex: 1, minWidth: 140 }}>
                                              <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Primární technika</label>
                                              <select
                                                className="aa-input"
                                                value={editingLesson.primary_technique}
                                                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, primary_technique: e.target.value } : null)}
                                              >
                                                {TECHNIQUE_OPTIONS.map((opt) => (
                                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                              </select>
                                            </div>

                                            {/* Sekundární technika */}
                                            <div className="aa-field" style={{ flex: 1, minWidth: 140 }}>
                                              <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>Sekundární technika</label>
                                              <select
                                                className="aa-input"
                                                value={editingLesson.secondary_technique}
                                                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, secondary_technique: e.target.value } : null)}
                                              >
                                                {TECHNIQUE_OPTIONS.map((opt) => (
                                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                              </select>
                                            </div>

                                            {/* Audio upload */}
                                            <div className="aa-field" style={{ flex: 2, minWidth: 160 }}>
                                              <label className="aa-field__label" style={{ fontSize: '0.75rem' }}>
                                                Audio {lesson.audio_url ? '(nahradit MP3)' : '(nahrát MP3)'}
                                              </label>
                                              <div
                                                className="aa-upload-area"
                                                style={{ padding: '0.5rem', cursor: 'pointer' }}
                                                onClick={() => document.getElementById(`lesson-edit-audio-${lesson.id}`)?.click()}
                                              >
                                                <div className="aa-upload-area__text" style={{ fontSize: '0.75rem' }}>
                                                  {editingLesson.audioFile
                                                    ? editingLesson.audioFile.name
                                                    : lesson.audio_url
                                                      ? 'Klikni pro nahrazení audio'
                                                      : 'Vyberte MP3'}
                                                </div>
                                                {editingLesson.uploadProgress !== null && (
                                                  <div className="aa-progress-bar">
                                                    <div className="aa-progress-bar__fill" style={{ width: `${editingLesson.uploadProgress}%` }} />
                                                  </div>
                                                )}
                                              </div>
                                              <input
                                                id={`lesson-edit-audio-${lesson.id}`}
                                                type="file"
                                                accept="audio/mpeg,audio/mp4,audio/wav"
                                                style={{ display: 'none' }}
                                                onChange={(e) => setEditingLesson((prev) => prev ? { ...prev, audioFile: e.target.files?.[0] ?? null } : null)}
                                              />
                                            </div>

                                            {/* Uložit */}
                                            <button
                                              className="aa-btn aa-btn--primary aa-btn--sm"
                                              onClick={() => void handleSaveLesson(lesson)}
                                              disabled={!editingLesson.title.trim() || editingLesson.isUploading || editingLesson.isSaving}
                                              style={{ marginBottom: 4 }}
                                            >
                                              {editingLesson.isUploading
                                                ? `Uploading… ${editingLesson.uploadProgress ?? 0}%`
                                                : editingLesson.isSaving
                                                  ? 'Ukládám…'
                                                  : 'Uložit'}
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              );
                            })}
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
