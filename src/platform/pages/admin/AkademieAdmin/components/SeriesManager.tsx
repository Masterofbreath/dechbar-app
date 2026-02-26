/**
 * SeriesManager — Modal pro správu sérií existujícího programu
 *
 * Umožňuje přidat, upravit, smazat a reorderovat série.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { AkademieProgram, AkademieSeries } from '@/platform/services/admin/types';

interface SeriesManagerProps {
  program: AkademieProgram;
  onClose: () => void;
}

export function SeriesManager({ program, onClose }: SeriesManagerProps) {
  const [series, setSeries] = useState<AkademieSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.akademie.series.getByModuleId(program.module_id);
      setSeries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst série');
    } finally {
      setIsLoading(false);
    }
  }, [program.module_id]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    const nextWeek = series.length > 0 ? Math.max(...series.map((s) => s.week_number)) + 1 : 1;
    setIsAdding(true);
    setError(null);
    try {
      await adminApi.akademie.series.create({
        module_id: program.module_id,
        name: addName.trim(),
        week_number: nextWeek,
        description: addDesc.trim() || undefined,
        sort_order: series.length * 10,
      });
      setAddName('');
      setAddDesc('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při přidávání série');
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (s: AkademieSeries) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditDesc(s.description ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await adminApi.akademie.series.update(editingId, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.akademie.series.delete(id);
      setDeleteConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání');
    }
  };

  return (
    <div className="aa-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal">
        <div className="aa-modal__header">
          <h2 className="aa-modal__title">
            Série — {program.module_name ?? program.module_id}
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
            <div className="aa-loading">Načítám série…</div>
          ) : (
            <>
              {/* Existing series */}
              {series.length === 0 ? (
                <div className="aa-empty" style={{ padding: '1rem 0' }}>Žádné série</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {series.map((s) => (
                    <div
                      key={s.id}
                      style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '0.75rem 1rem' }}
                    >
                      {editingId === s.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <input
                            className="aa-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <input
                            className="aa-input"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Popis (volitelné)"
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="aa-btn aa-btn--primary aa-btn--sm" onClick={() => void handleSaveEdit()}>
                              Uložit
                            </button>
                            <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={() => setEditingId(null)}>
                              Zrušit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                              Týden {s.week_number}: {s.name}
                            </span>
                            {s.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                                {s.description}
                              </div>
                            )}
                          </div>
                          {deleteConfirmId === s.id ? (
                            <div className="aa-actions">
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Smazat?</span>
                              <button className="aa-btn aa-btn--danger aa-btn--sm" onClick={() => void handleDelete(s.id)}>Ano</button>
                              <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={() => setDeleteConfirmId(null)}>Ne</button>
                            </div>
                          ) : (
                            <div className="aa-actions">
                              <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={() => startEdit(s)}>
                                Upravit
                              </button>
                              <button className="aa-btn aa-btn--danger aa-btn--sm" onClick={() => setDeleteConfirmId(s.id)}>
                                Smazat
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new series */}
              <div style={{
                background: 'rgba(248,202,0,0.04)', border: '1px dashed rgba(248,202,0,0.2)',
                borderRadius: 8, padding: '1rem',
              }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                  Přidat sérii (Týden {series.length + 1})
                </div>
                <div className="aa-form-row">
                  <input
                    className="aa-input"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="Název série"
                    onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
                  />
                  <input
                    className="aa-input"
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Popis (volitelné)"
                  />
                </div>
                <button
                  className="aa-btn aa-btn--ghost aa-btn--sm"
                  onClick={() => void handleAdd()}
                  disabled={!addName.trim() || isAdding}
                  style={{ marginTop: 8 }}
                >
                  {isAdding ? 'Přidávám…' : '+ Přidat sérii'}
                </button>
              </div>
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
