/**
 * Step2Program — Základní info o programu + atomický create
 *
 * Po odeslání:
 *   1. INSERT modules (DB)
 *   2. INSERT akademie_programs (DB)
 *   3. Edge Function → Stripe product + price + Ecomail listy
 *
 * Chyba DB = celé selhání. Stripe/Ecomail chyba = pokračuje, admin retry v tabulce.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useRef } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { slugify, uploadService } from '@/platform/services/upload/uploadService';
import type { ProgramWizardState, AkademieCategory } from '@/platform/services/admin/types';

interface Step2ProgramProps {
  state: ProgramWizardState;
  category: AkademieCategory | null;
  onChange: (update: Partial<ProgramWizardState['program']>) => void;
  onCreated: (result: ProgramWizardState['program']) => void;
  onBack: () => void;
}

type CreatingStep = 'db' | 'stripe' | 'ecomail' | 'done';

interface CreateProgress {
  step: CreatingStep;
  dbDone: boolean;
  stripeDone: boolean;
  stripeError: string | null;
  ecmailDone: boolean;
  ecmailError: string | null;
}

export function Step2Program({ state, category, onChange, onCreated, onBack }: Step2ProgramProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<CreateProgress | null>(null);
  const [imageUploadPercent, setImageUploadPercent] = useState<number | null>(null);

  const slugEditedManually = useRef(state.program.slug !== '');

  const handleNameChange = (v: string) => {
    onChange({ name: v });
    if (!slugEditedManually.current) {
      onChange({ slug: slugify(v) });
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.program.slug || !category) return;

    const catSlug = category.slug;
    const modId = state.program.slug;

    setImageUploadPercent(0);
    try {
      const url = await uploadService.uploadAkademieImage(file, catSlug, modId);
      onChange({ cover_image_url: url, cover_image_file: undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při nahrávání obrázku');
    } finally {
      setImageUploadPercent(null);
    }
  };

  const handleCreate = async () => {
    if (!state.program.name.trim() || !state.program.slug.trim()) {
      setError('Název a slug jsou povinné');
      return;
    }
    if (!state.program.price_czk || state.program.price_czk <= 0) {
      setError('Zadejte platnou cenu');
      return;
    }
    if (!category && !state.category.existingCategoryId) {
      setError('Chybí kategorie');
      return;
    }

    const categoryId = category?.id ?? state.category.existingCategoryId!;

    setError(null);
    setIsCreating(true);
    setProgress({ step: 'db', dbDone: false, stripeDone: false, stripeError: null, ecmailDone: false, ecmailError: null });

    try {
      const result = await adminApi.akademie.programs.create({
        slug: state.program.slug,
        name: state.program.name,
        description: state.program.description,
        description_long: state.program.description_long,
        price_czk: state.program.price_czk,
        cover_image_url: state.program.cover_image_url,
        duration_days: state.program.duration_days,
        daily_minutes: state.program.daily_minutes,
        launch_date: state.program.launch_date,
        is_published: state.program.is_published,
        category_id: categoryId,
      });

      setProgress({
        step: 'done',
        dbDone: true,
        stripeDone: !result.stripeError,
        stripeError: result.stripeError ?? null,
        ecmailDone: !result.ecmailError,
        ecmailError: result.ecmailError ?? null,
      });

      onCreated({
        ...state.program,
        created_module_id: result.moduleId,
        stripe_product_id: result.stripeProductId ?? undefined,
        stripe_price_id: result.stripePriceId ?? undefined,
        ecomail_list_in_id: result.ecmailListInId ?? undefined,
        ecomail_list_before_id: result.ecmailListBeforeId ?? undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při vytváření programu');
      setProgress(null);
    } finally {
      setIsCreating(false);
    }
  };

  if (isCreating && progress) {
    return (
      <div className="aa-form" style={{ alignItems: 'center', padding: '2rem 0' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 24 }}>
          Vytváříme program…
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
          <StatusRow
            done={progress.dbDone}
            loading={!progress.dbDone}
            label="Ukládám do databáze"
          />
          <StatusRow
            done={progress.stripeDone}
            error={progress.stripeError}
            loading={progress.dbDone && !progress.stripeDone && !progress.stripeError}
            label="Nastavuji Stripe produkt"
          />
          <StatusRow
            done={progress.ecmailDone}
            error={progress.ecmailError}
            loading={progress.dbDone && !progress.ecmailDone && !progress.ecmailError}
            label="Vytvářím Ecomail listy"
          />
        </div>
      </div>
    );
  }

  if (progress?.step === 'done') {
    return (
      <div className="aa-form" style={{ alignItems: 'center', padding: '1.5rem 0' }}>
        <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#2cbe5a', marginBottom: 16 }}>
          Program vytvořen!
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400 }}>
          <StatusRow done={true} label="Databáze" />
          <StatusRow done={progress.stripeDone} error={progress.stripeError} label="Stripe" />
          <StatusRow done={progress.ecmailDone} error={progress.ecmailError} label="Ecomail" />
        </div>
        {(progress.stripeError || progress.ecmailError) && (
          <div className="aa-error-banner" style={{ marginTop: 16, width: '100%' }}>
            Stripe/Ecomail chyby lze doplnit ručně v tabulce programů. Program byl uložen do DB.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="aa-form">
      {error && <div className="aa-error-banner">{error}</div>}

      <div className="aa-form-row">
        <div className="aa-field">
          <label className="aa-field__label aa-field__label--required">Název programu</label>
          <input
            className="aa-input"
            value={state.program.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Digitální ticho"
          />
        </div>
        <div className="aa-field">
          <label className="aa-field__label aa-field__label--required">Slug (module_id)</label>
          <input
            className="aa-input aa-input--slug"
            value={state.program.slug}
            onChange={(e) => {
              slugEditedManually.current = true;
              onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
            }}
            placeholder="digitalni-ticho"
          />
          <span className="aa-field__hint">Unikátní ID programu — nelze změnit po vytvoření</span>
        </div>
      </div>

      <div className="aa-field">
        <label className="aa-field__label">Krátký popis</label>
        <input
          className="aa-input"
          value={state.program.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="21denní ranní audio program…"
        />
        <span className="aa-field__hint">Zobrazuje se na kartě programu + jako Stripe produkt description</span>
      </div>

      <div className="aa-field">
        <label className="aa-field__label">Dlouhý popis</label>
        <textarea
          className="aa-textarea"
          value={state.program.description_long ?? ''}
          onChange={(e) => onChange({ description_long: e.target.value })}
          placeholder="Podrobnější popis v detailu programu…"
          rows={3}
        />
      </div>

      <div className="aa-form-row">
        <div className="aa-field">
          <label className="aa-field__label aa-field__label--required">Cena (Kč)</label>
          <input
            type="number"
            className="aa-input"
            value={state.program.price_czk || ''}
            min={1}
            onChange={(e) => onChange({ price_czk: Number(e.target.value) })}
            placeholder="990"
          />
        </div>
        <div className="aa-field">
          <label className="aa-field__label">Délka (dní)</label>
          <input
            type="number"
            className="aa-input"
            value={state.program.duration_days ?? ''}
            min={1}
            onChange={(e) => onChange({ duration_days: Number(e.target.value) || undefined })}
            placeholder="21"
          />
        </div>
        <div className="aa-field">
          <label className="aa-field__label">Min/den</label>
          <input
            type="number"
            className="aa-input"
            value={state.program.daily_minutes ?? ''}
            min={1}
            onChange={(e) => onChange({ daily_minutes: Number(e.target.value) || undefined })}
            placeholder="15"
          />
        </div>
      </div>

      <div className="aa-field">
        <label className="aa-field__label">Cover obrázek</label>
        {state.program.cover_image_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={state.program.cover_image_url}
              alt="Cover"
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #333' }}
            />
            <button className="aa-btn aa-btn--ghost aa-btn--sm" onClick={() => onChange({ cover_image_url: undefined })}>
              Odstranit
            </button>
          </div>
        ) : (
          <div
            className="aa-upload-area"
            onClick={() => document.getElementById('cover-upload')?.click()}
          >
            <div className="aa-upload-area__text">Klikněte pro nahrání obrázku</div>
            <div className="aa-upload-area__hint">JPG, PNG, WebP · bude uloženo jako cover.ext</div>
            {imageUploadPercent !== null && (
              <div className="aa-progress-bar">
                <div className="aa-progress-bar__fill" style={{ width: `${imageUploadPercent}%` }} />
              </div>
            )}
          </div>
        )}
        <input
          id="cover-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => void handleImageSelect(e)}
        />
        {!state.program.cover_image_url && (
          <span className="aa-field__hint">Cesta: images/akademie/{'{category-slug}'}/{'{module-id}'}/cover.ext</span>
        )}
      </div>

      <div className="aa-field">
        <label className="aa-field__label">Datum spuštění</label>
        <input
          type="date"
          className="aa-input"
          value={state.program.launch_date ?? ''}
          onChange={(e) => onChange({ launch_date: e.target.value || undefined })}
        />
        <span className="aa-field__hint">Volitelné. Logika denního odemykání = Phase 2 (nyní informativní).</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <button className="aa-btn aa-btn--ghost" onClick={onBack}>
          ← Zpět
        </button>
        <button className="aa-btn aa-btn--primary" onClick={() => void handleCreate()}>
          Vytvořit program →
        </button>
      </div>
    </div>
  );
}

function StatusRow({
  done,
  loading,
  error,
  label,
}: {
  done: boolean;
  loading?: boolean;
  error?: string | null;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {done ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2cbe5a" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : error ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ) : loading ? (
        <div style={{
          width: 16, height: 16, border: '2px solid #333', borderTop: '2px solid var(--dechbar-gold,#f8ca00)',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
      ) : (
        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #333' }} />
      )}
      <span style={{ fontSize: '0.875rem', color: error ? '#e05252' : done ? '#2cbe5a' : 'var(--color-text-secondary)' }}>
        {label}
        {error && <span style={{ fontSize: '0.75rem', marginLeft: 6 }}>— {error}</span>}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
