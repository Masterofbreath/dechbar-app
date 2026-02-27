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
  | { type: 'lessons'; program: AkademieProgram }
  | { type: 'stripe-ecomail'; program: AkademieProgram };

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
                          {(!prog.module_stripe_price_id || !prog.module_ecomail_list_in) && (
                            <button
                              className="aa-btn aa-btn--ghost aa-btn--sm"
                              style={{ color: '#e0a252', borderColor: '#e0a252' }}
                              onClick={() => setPanel({ type: 'stripe-ecomail', program: prog })}
                              title="Nastavit Stripe / Ecomail"
                            >
                              ⚙ Setup
                            </button>
                          )}
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

      {panel.type === 'stripe-ecomail' && (
        <StripeEcomailSetup program={panel.program} onClose={handlePanelClose} />
      )}
    </>
  );
}

// ============================================================
// StripeEcomailSetup — modal pro ruční/auto nastavení
// ============================================================

function StripeEcomailSetup({
  program,
  onClose,
}: {
  program: AkademieProgram;
  onClose: () => void;
}) {
  const [stripePriceId, setStripePriceId] = useState(program.module_stripe_price_id ?? '');
  const [ecomailIn, setEcomailIn] = useState(program.module_ecomail_list_in ?? '');
  const [ecomailBefore, setEcomailBefore] = useState(program.module_ecomail_list_before ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleManualSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.akademie.programs.setStripeEcomail(program.module_id, {
        stripe_price_id: stripePriceId.trim() || null,
        ecomail_list_in: ecomailIn.trim() || null,
        ecomail_list_before: ecomailBefore.trim() || null,
      });
      setSuccess('Uloženo do databáze.');
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await adminApi.akademie.programs.retryStripeEcomail(
        program.module_id,
        program.module_name ?? program.module_id,
        program.module_price_czk ?? 990,
      );
      if (result.stripePriceId) setStripePriceId(result.stripePriceId);
      if (result.ecmailListInId) setEcomailIn(result.ecmailListInId);
      if (result.ecmailListBeforeId) setEcomailBefore(result.ecmailListBeforeId);
      if (result.stripeError || result.ecmailError) {
        setError([result.stripeError, result.ecmailError].filter(Boolean).join(' | '));
      } else {
        setSuccess('Stripe + Ecomail nastaveny automaticky!');
        setTimeout(onClose, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při auto-nastavení');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="aa-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal">
        <div className="aa-modal__header">
          <h2 className="aa-modal__title">
            Stripe / Ecomail — {program.module_name ?? program.module_id}
          </h2>
          <button className="aa-btn--icon" onClick={onClose} aria-label="Zavřít">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="aa-modal__body">
          {error && <div className="aa-error-banner">{error}</div>}
          {success && <div style={{ background: 'rgba(44,190,90,0.1)', border: '1px solid #2cbe5a', borderRadius: 6, padding: '0.625rem 0.875rem', marginBottom: 12, fontSize: '0.875rem', color: '#2cbe5a' }}>{success}</div>}

          <div className="aa-form">
            <div style={{ marginBottom: 12, padding: '0.75rem 1rem', background: 'rgba(248,202,0,0.05)', borderRadius: 8, border: '1px solid rgba(248,202,0,0.15)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Auto-nastavení</strong> zavolá Edge Function a vytvoří Stripe produkt + Ecomail listy automaticky.<br />
              <strong style={{ color: 'var(--color-text-primary)' }}>Ručně</strong> — zadej existující IDs z Stripe a Ecomail dashboardu.
            </div>

            <button
              className="aa-btn aa-btn--primary"
              onClick={() => void handleAutoRetry()}
              disabled={isRetrying || isSaving}
              style={{ marginBottom: 16 }}
            >
              {isRetrying ? 'Nastavuji…' : '⚡ Spustit automatické nastavení'}
            </button>

            <div className="aa-field">
              <label className="aa-field__label">Stripe Price ID</label>
              <input
                className="aa-input aa-input--slug"
                value={stripePriceId}
                onChange={(e) => setStripePriceId(e.target.value)}
                placeholder="price_1T..."
              />
            </div>
            <div className="aa-field">
              <label className="aa-field__label">Ecomail List ID — IN (Zákazníci)</label>
              <input
                className="aa-input"
                value={ecomailIn}
                onChange={(e) => setEcomailIn(e.target.value)}
                placeholder="123"
              />
            </div>
            <div className="aa-field">
              <label className="aa-field__label">Ecomail List ID — BEFORE (Předobjednávky)</label>
              <input
                className="aa-input"
                value={ecomailBefore}
                onChange={(e) => setEcomailBefore(e.target.value)}
                placeholder="124"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="aa-btn aa-btn--ghost" onClick={onClose} disabled={isSaving}>Zrušit</button>
              <button className="aa-btn aa-btn--primary" onClick={() => void handleManualSave()} disabled={isSaving || isRetrying}>
                {isSaving ? 'Ukládám…' : 'Uložit ručně'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
