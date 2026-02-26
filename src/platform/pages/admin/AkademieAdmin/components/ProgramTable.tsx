/**
 * ProgramTable — Správa programů Akademie
 *
 * Tabulka programů se Stripe/Ecomail status indikátory.
 * Akce: Nový (Wizard) | Upravit | Série | Lekce | Smazat
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { AkademieProgram } from '@/platform/services/admin/types';
import { ProgramWizard } from './ProgramWizard/ProgramWizard';
import { SeriesManager } from './SeriesManager';
import { LessonManager } from './LessonManager';

type PanelMode =
  | { type: 'none' }
  | { type: 'wizard' }
  | { type: 'edit'; program: AkademieProgram }
  | { type: 'series'; program: AkademieProgram }
  | { type: 'lessons'; program: AkademieProgram };

function formatPrice(price?: number): string {
  if (!price) return '—';
  return `${price.toLocaleString('cs-CZ')} Kč`;
}

export function ProgramTable() {
  const [programs, setPrograms] = useState<AkademieProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelMode>({ type: 'none' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPrograms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.akademie.programs.getAll();
      setPrograms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst programy');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrograms();
  }, [loadPrograms]);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.akademie.programs.delete(id);
      setDeleteConfirmId(null);
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se smazat program');
    }
  };

  const handleTogglePublish = async (program: AkademieProgram) => {
    try {
      await adminApi.akademie.programs.update(program.id, {
        is_published: !program.is_published,
      });
      await loadPrograms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při změně stavu');
    }
  };

  const handlePanelClose = async () => {
    setPanel({ type: 'none' });
    await loadPrograms();
  };

  return (
    <>
      <div className="aa-table-section">
        <div className="aa-table-section__header">
          <span className="aa-table-section__title">
            Programy
            <span className="aa-table-section__count">({programs.length})</span>
          </span>
          <button
            className="aa-btn aa-btn--primary"
            onClick={() => setPanel({ type: 'wizard' })}
          >
            + Nový program
          </button>
        </div>

        {error && <div className="aa-error-banner">{error}</div>}

        {isLoading ? (
          <div className="aa-loading">Načítám programy…</div>
        ) : programs.length === 0 ? (
          <div className="aa-empty">Žádné programy. Vytvořte první pomocí průvodce.</div>
        ) : (
          <div className="aa-table-wrap">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Kategorie</th>
                  <th>Cena</th>
                  <th>Délka</th>
                  <th title="Stripe price ID">
                    <span className="aa-status-dot aa-status-dot--unknown" /> Stripe
                  </th>
                  <th title="Ecomail list">
                    <span className="aa-status-dot aa-status-dot--unknown" /> Ecomail
                  </th>
                  <th>Stav</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog) => (
                  <tr key={prog.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{prog.module_name ?? prog.module_id}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                        <code style={{ color: 'var(--dechbar-teal, #2cbec6)' }}>{prog.module_id}</code>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {prog.category_name ?? '—'}
                    </td>
                    <td>{formatPrice(prog.module_price_czk)}</td>
                    <td>
                      {prog.duration_days && prog.daily_minutes
                        ? `${prog.duration_days} dní · ${prog.daily_minutes} min`
                        : prog.duration_days
                        ? `${prog.duration_days} dní`
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className={`aa-status-dot aa-status-dot--${prog.module_stripe_price_id ? 'ok' : 'missing'}`}
                          title={prog.module_stripe_price_id ?? 'Chybí stripe_price_id'}
                        />
                        {prog.module_stripe_price_id ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>
                            {prog.module_stripe_price_id.slice(0, 16)}…
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#e05252' }}>Chybí</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            className={`aa-status-dot aa-status-dot--${prog.module_ecomail_list_in ? 'ok' : 'missing'}`}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            IN: {prog.module_ecomail_list_in ?? '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            className={`aa-status-dot aa-status-dot--${prog.module_ecomail_list_before ? 'ok' : 'missing'}`}
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            BEFORE: {prog.module_ecomail_list_before ?? '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        className={`aa-badge aa-badge--${prog.is_published ? 'published' : 'draft'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Kliknutím změníte stav"
                        onClick={() => void handleTogglePublish(prog)}
                      >
                        {prog.is_published ? 'Publikováno' : 'Draft'}
                      </button>
                    </td>
                    <td>
                      {deleteConfirmId === prog.id ? (
                        <div className="aa-actions">
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Smazat?</span>
                          <button
                            className="aa-btn aa-btn--danger aa-btn--sm"
                            onClick={() => void handleDelete(prog.id)}
                          >
                            Ano
                          </button>
                          <button
                            className="aa-btn aa-btn--ghost aa-btn--sm"
                            onClick={() => setDeleteConfirmId(null)}
                          >
                            Ne
                          </button>
                        </div>
                      ) : (
                        <div className="aa-actions">
                          <button
                            className="aa-btn aa-btn--ghost aa-btn--sm"
                            onClick={() => setPanel({ type: 'series', program: prog })}
                            title="Série"
                          >
                            Série
                          </button>
                          <button
                            className="aa-btn aa-btn--ghost aa-btn--sm"
                            onClick={() => setPanel({ type: 'lessons', program: prog })}
                            title="Lekce"
                          >
                            Lekce
                          </button>
                          <button
                            className="aa-btn aa-btn--danger aa-btn--sm"
                            onClick={() => setDeleteConfirmId(prog.id)}
                          >
                            Smazat
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {panel.type === 'wizard' && (
        <ProgramWizard onClose={handlePanelClose} />
      )}

      {panel.type === 'series' && (
        <SeriesManager program={panel.program} onClose={handlePanelClose} />
      )}

      {panel.type === 'lessons' && (
        <LessonManager program={panel.program} onClose={handlePanelClose} />
      )}
    </>
  );
}
