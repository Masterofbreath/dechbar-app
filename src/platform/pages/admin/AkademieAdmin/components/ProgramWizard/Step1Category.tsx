/**
 * Step1Category — Výběr nebo vytvoření kategorie
 *
 * Buď výběr existující kategorie z dropdownu,
 * nebo inline formulář pro vytvoření nové.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { slugify } from '@/platform/services/upload/uploadService';
import type { AkademieCategory, ProgramWizardState } from '@/platform/services/admin/types';

interface Step1CategoryProps {
  state: ProgramWizardState;
  onChange: (update: Partial<ProgramWizardState['category']>) => void;
  onNext: () => void;
}

export function Step1Category({ state, onChange, onNext }: Step1CategoryProps) {
  const [categories, setCategories] = useState<AkademieCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'select' | 'create'>(
    state.category.existingCategoryId ? 'select' : 'select'
  );
  const [error, setError] = useState<string | null>(null);
  const slugEditedManually = useRef(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await adminApi.akademie.categories.getAll();
        setCategories(data);
        if (!state.category.existingCategoryId && data.length > 0) {
          onChange({ existingCategoryId: data[0].id });
        }
      } catch {
        setError('Nepodařilo se načíst kategorie');
      } finally {
        setIsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    if (mode === 'select' && !state.category.existingCategoryId) {
      setError('Vyberte nebo vytvořte kategorii');
      return;
    }
    if (mode === 'create' && (!state.category.name?.trim() || !state.category.slug?.trim())) {
      setError('Vyplňte název kategorie');
      return;
    }
    setError(null);
    onNext();
  };

  const handleNewName = (v: string) => {
    onChange({ name: v });
    if (!slugEditedManually.current) {
      onChange({ slug: slugify(v) });
    }
  };

  return (
    <div className="aa-form">
      <div className="aa-field">
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Vyberte existující kategorii nebo vytvořte novou.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`aa-btn ${mode === 'select' ? 'aa-btn--primary' : 'aa-btn--ghost'}`}
            onClick={() => setMode('select')}
          >
            Vybrat existující
          </button>
          <button
            className={`aa-btn ${mode === 'create' ? 'aa-btn--primary' : 'aa-btn--ghost'}`}
            onClick={() => setMode('create')}
          >
            + Vytvořit novou
          </button>
        </div>
      </div>

      {error && <div className="aa-error-banner">{error}</div>}

      {mode === 'select' && (
        <div className="aa-field">
          <label className="aa-field__label aa-field__label--required">Kategorie</label>
          {isLoading ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Načítám…</div>
          ) : categories.length === 0 ? (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Žádné kategorie. Přepněte na "Vytvořit novou".
            </div>
          ) : (
            <select
              className="aa-input"
              value={state.category.existingCategoryId ?? ''}
              onChange={(e) => onChange({ existingCategoryId: e.target.value })}
            >
              <option value="" disabled>— Vyberte kategorii —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {mode === 'create' && (
        <>
          <div className="aa-form-row">
            <div className="aa-field">
              <label className="aa-field__label aa-field__label--required">Název kategorie</label>
              <input
                className="aa-input"
                value={state.category.name ?? ''}
                onChange={(e) => handleNewName(e.target.value)}
                placeholder="Dechové výzvy"
              />
            </div>
            <div className="aa-field">
              <label className="aa-field__label aa-field__label--required">Slug</label>
              <input
                className="aa-input aa-input--slug"
                value={state.category.slug ?? ''}
                onChange={(e) => {
                  slugEditedManually.current = true;
                  onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                }}
                placeholder="dechove-vyzvy"
              />
            </div>
          </div>

          <div className="aa-field">
            <label className="aa-field__label">Krátký popis</label>
            <input
              className="aa-input"
              value={state.category.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Strukturované dechové výzvy pro každodenní praxi."
            />
          </div>

          <div className="aa-field">
            <label className="aa-field__label">Dlouhý popis</label>
            <textarea
              className="aa-textarea"
              value={state.category.description_long ?? ''}
              onChange={(e) => onChange({ description_long: e.target.value })}
              placeholder="Podrobnější popis kategorie…"
              rows={2}
            />
          </div>

          <div className="aa-form-row">
            <div className="aa-field">
              <label className="aa-field__label">Pořadí</label>
              <input
                type="number"
                className="aa-input"
                value={state.category.sort_order ?? 0}
                min={0}
                onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
              />
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="aa-btn aa-btn--primary" onClick={handleNext}>
          Pokračovat →
        </button>
      </div>
    </div>
  );
}
