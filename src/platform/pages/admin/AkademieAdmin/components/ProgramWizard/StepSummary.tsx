/**
 * StepSummary — Shrnutí průvodce + publikování programu
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { ProgramWizardState } from '@/platform/services/admin/types';

interface StepSummaryProps {
  state: ProgramWizardState;
  onComplete: (published: boolean) => void;
  onBack: () => void;
}

export function StepSummary({ state, onComplete, onBack }: StepSummaryProps) {
  const [isPublished, setIsPublished] = useState(state.program.is_published ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalLessons = Object.values(state.lessons).reduce((sum, arr) => sum + arr.length, 0);

  const handleSave = async (publish: boolean) => {
    if (!state.program.created_module_id) {
      setError('Chybí ID programu — program nebyl úspěšně vytvořen');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Save series to DB
      for (const serie of state.series) {
        const createdSerie = await adminApi.akademie.series.create({
          module_id: state.program.created_module_id,
          name: serie.name,
          week_number: serie.week_number,
          description: serie.description,
          sort_order: serie.sort_order,
        });

        const seriesIdx = state.series.indexOf(serie);
        const lessons = state.lessons[seriesIdx] ?? [];
        for (const lesson of lessons) {
          await adminApi.akademie.lessons.create({
            series_id: createdSerie.id,
            module_id: state.program.created_module_id,
            title: lesson.title,
            audio_url: lesson.audio_url ?? '',
            duration_seconds: lesson.duration_seconds ?? 0,
            day_number: lesson.day_number,
            sort_order: lesson.sort_order,
          });
        }
      }

      // Update published state
      const allPrograms = await adminApi.akademie.programs.getAll();
      const prog = allPrograms.find((p) => p.module_id === state.program.created_module_id);
      if (prog) {
        await adminApi.akademie.programs.update(prog.id, { is_published: publish });
      }

      onComplete(publish);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="aa-form">
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 12 }}>
          Souhrn programu
        </h3>

        <div style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden',
        }}>
          <SummaryRow label="Program" value={state.program.name} />
          <SummaryRow label="Slug" value={state.program.slug} mono />
          <SummaryRow label="Cena" value={`${state.program.price_czk} Kč`} />
          {state.program.duration_days && state.program.daily_minutes && (
            <SummaryRow label="Délka" value={`${state.program.duration_days} dní · ${state.program.daily_minutes} min/den`} />
          )}
          <SummaryRow label="Série" value={`${state.series.length}`} />
          <SummaryRow label="Lekce celkem" value={`${totalLessons}`} />
          <SummaryRow
            label="Stripe"
            value={state.program.stripe_price_id
              ? `✓ ${state.program.stripe_price_id.slice(0, 22)}…`
              : state.program.stripeError
                ? `✗ ${state.program.stripeError.slice(0, 40)}`
                : '⚠ Nastavit ručně'}
            ok={!!state.program.stripe_price_id}
            warn={!state.program.stripe_price_id}
          />
          <SummaryRow
            label="Ecomail IN"
            value={state.program.ecomail_list_in_id
              ? `✓ list #${state.program.ecomail_list_in_id}`
              : state.program.ecmailError
                ? `✗ ${state.program.ecmailError.slice(0, 40)}`
                : '⚠ Nastavit ručně'}
            ok={!!state.program.ecomail_list_in_id}
            warn={!state.program.ecomail_list_in_id}
          />
          <SummaryRow
            label="Ecomail BEFORE"
            value={state.program.ecomail_list_before_id
              ? `✓ list #${state.program.ecomail_list_before_id}`
              : '⚠ Nastavit ručně'}
            ok={!!state.program.ecomail_list_before_id}
            warn={!state.program.ecomail_list_before_id}
          />
        </div>
      </div>

      {error && <div className="aa-error-banner">{error}</div>}

      <label className="aa-checkbox-row">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
        />
        <span>Publikovat okamžitě (zobrazit na frontendu)</span>
      </label>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <button className="aa-btn aa-btn--ghost" onClick={onBack} disabled={isSaving}>
          ← Zpět
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="aa-btn aa-btn--ghost"
            onClick={() => void handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? 'Ukládám…' : 'Uložit jako draft'}
          </button>
          <button
            className="aa-btn aa-btn--primary"
            onClick={() => void handleSave(true)}
            disabled={isSaving}
          >
            {isSaving ? 'Ukládám…' : 'Publikovat'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label, value, mono = false, ok = false, warn = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  ok?: boolean;
  warn?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.6rem 1rem', borderBottom: '1px solid #1a1a1a', fontSize: '0.8125rem',
    }}>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{label}</span>
      <span style={{
        color: ok ? '#2cbe5a' : warn ? '#e0a252' : 'var(--color-text-primary)',
        fontFamily: mono ? 'monospace' : undefined,
        fontSize: mono ? '0.75rem' : undefined,
      }}>
        {value}
      </span>
    </div>
  );
}
