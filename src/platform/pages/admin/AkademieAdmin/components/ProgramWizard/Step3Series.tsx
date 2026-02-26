/**
 * Step3Series — Přidávání sérií k programu
 *
 * Volitelný krok — "Přeskočit" je vždy dostupné.
 * Série lze reorderovat drag-and-drop stylem (pouze vizuálně pro MVP — bez DnD knihovny).
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState } from 'react';
import type { ProgramWizardState, SeriesInput } from '@/platform/services/admin/types';

interface Step3SeriesProps {
  state: ProgramWizardState;
  onChange: (series: SeriesInput[]) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export function Step3Series({ state, onChange, onNext, onSkip, onBack }: Step3SeriesProps) {
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const addSeries = () => {
    if (!newName.trim()) return;
    const nextWeek = (state.series.length > 0
      ? Math.max(...state.series.map((s) => s.week_number)) + 1
      : 1);
    const updated: SeriesInput[] = [
      ...state.series,
      {
        name: newName.trim(),
        week_number: nextWeek,
        description: newDesc.trim() || undefined,
        sort_order: state.series.length * 10,
      },
    ];
    onChange(updated);
    setNewName('');
    setNewDesc('');
  };

  const removeSeries = (idx: number) => {
    onChange(state.series.filter((_, i) => i !== idx));
  };

  const updateSeries = (idx: number, patch: Partial<SeriesInput>) => {
    onChange(state.series.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  return (
    <div className="aa-form">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Přidejte týdenní série. Každá série = 7 lekcí (doplníte v dalším kroku nebo kdykoli později).
        </p>
        <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={onSkip}>
          Přeskočit
        </button>
      </div>

      {/* Existing series list */}
      {state.series.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {state.series.map((serie, idx) => (
            <div
              key={idx}
              style={{
                background: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: '0.75rem 1rem',
              }}
            >
              {editingIdx === idx ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    className="aa-input"
                    value={serie.name}
                    onChange={(e) => updateSeries(idx, { name: e.target.value })}
                    placeholder="Název série"
                  />
                  <input
                    className="aa-input"
                    value={serie.description ?? ''}
                    onChange={(e) => updateSeries(idx, { description: e.target.value })}
                    placeholder="Popis (volitelné)"
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="aa-btn aa-btn--primary aa-btn--sm" onClick={() => setEditingIdx(null)}>
                      Uložit
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      Týden {serie.week_number}: {serie.name}
                    </span>
                    {serie.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        {serie.description}
                      </div>
                    )}
                  </div>
                  <div className="aa-actions">
                    <button className="aa-btn aa-btn--icon" onClick={() => setEditingIdx(idx)} title="Upravit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="aa-btn aa-btn--icon" onClick={() => removeSeries(idx)} title="Smazat">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new series */}
      <div style={{
        background: 'rgba(248,202,0,0.04)',
        border: '1px dashed rgba(248,202,0,0.2)',
        borderRadius: 8,
        padding: '1rem',
      }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: 10, fontWeight: 500 }}>
          Přidat sérii (Týden {state.series.length + 1})
        </div>
        <div className="aa-form-row">
          <div className="aa-field">
            <input
              className="aa-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Název série (povinné)"
              onKeyDown={(e) => e.key === 'Enter' && addSeries()}
            />
          </div>
          <div className="aa-field">
            <input
              className="aa-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Popis (volitelné)"
              onKeyDown={(e) => e.key === 'Enter' && addSeries()}
            />
          </div>
        </div>
        <button
          className="aa-btn aa-btn--ghost aa-btn--sm"
          onClick={addSeries}
          disabled={!newName.trim()}
          style={{ marginTop: 8 }}
        >
          + Přidat sérii
        </button>
      </div>

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
