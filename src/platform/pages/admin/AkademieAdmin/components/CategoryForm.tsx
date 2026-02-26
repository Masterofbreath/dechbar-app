/**
 * CategoryForm — Modal formulář pro vytvoření/editaci kategorie Akademie
 *
 * Vzor: konzistentní s TrackForm (modal overlay, field layout, error banner)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import { slugify } from '@/platform/services/upload/uploadService';
import type { AkademieCategory, AkademieCategoryInput } from '@/platform/services/admin/types';

interface CategoryFormProps {
  /** null = vytvořit novou, AkademieCategory = editovat existující */
  category: AkademieCategory | null;
  onSave: () => void;
  onClose: () => void;
}

export function CategoryForm({ category, onSave, onClose }: CategoryFormProps) {
  const isNew = category === null;

  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [descriptionLong, setDescriptionLong] = useState(category?.description_long ?? '');
  const [icon, setIcon] = useState(category?.icon ?? '');
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track whether user has manually edited the slug
  const slugEditedManually = useRef(!isNew);

  useEffect(() => {
    if (!slugEditedManually.current) {
      setSlug(slugify(name));
    }
  }, [name]);

  const handleSlugChange = (v: string) => {
    slugEditedManually.current = true;
    setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError('Název a slug jsou povinné');
      return;
    }

    const input: AkademieCategoryInput = {
      name: name.trim(),
      slug: slug.trim(),
      icon: icon.trim() || undefined,
      description: description.trim(),
      description_long: descriptionLong.trim() || undefined,
      sort_order: sortOrder,
      is_active: isActive,
    };

    setIsSaving(true);
    setError(null);
    try {
      if (isNew) {
        await adminApi.akademie.categories.create(input);
      } else {
        await adminApi.akademie.categories.update(category.id, input);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="aa-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="aa-modal">
        <div className="aa-modal__header">
          <h2 className="aa-modal__title">
            {isNew ? 'Nová kategorie' : `Upravit: ${category.name}`}
          </h2>
          <button className="aa-btn--icon" onClick={onClose} aria-label="Zavřít">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="aa-modal__body aa-form" onSubmit={(e) => void handleSubmit(e)}>
          {error && <div className="aa-error-banner">{error}</div>}

          <div className="aa-form-row">
            <div className="aa-field">
              <label className="aa-field__label aa-field__label--required">Název</label>
              <input
                className="aa-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Program REŽIM"
                required
              />
            </div>
            <div className="aa-field">
              <label className="aa-field__label aa-field__label--required">Slug</label>
              <input
                className="aa-input aa-input--slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="program-rezim"
                required
              />
              <span className="aa-field__hint">Unikátní identifikátor (automaticky z názvu)</span>
            </div>
          </div>

          <div className="aa-field">
            <label className="aa-field__label aa-field__label--required">Krátký popis</label>
            <input
              className="aa-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="21 dní, 15 minut ráno. Strukturovaná audio praxe."
            />
            <span className="aa-field__hint">Zobrazuje se na kartě kategorie (1 věta)</span>
          </div>

          <div className="aa-field">
            <label className="aa-field__label">Dlouhý popis</label>
            <textarea
              className="aa-textarea"
              value={descriptionLong}
              onChange={(e) => setDescriptionLong(e.target.value)}
              placeholder="Strukturované audio programy pro každodenní praxi…"
              rows={3}
            />
            <span className="aa-field__hint">Zobrazuje se jako podnadpis v seznamu programů (1–2 věty)</span>
          </div>

          <div className="aa-form-row">
            <div className="aa-field">
              <label className="aa-field__label">Ikona</label>
              <input
                className="aa-input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="graduation-cap"
              />
              <span className="aa-field__hint">Identifikátor ikony (NavIcon name)</span>
            </div>
            <div className="aa-field">
              <label className="aa-field__label">Pořadí</label>
              <input
                type="number"
                className="aa-input"
                value={sortOrder}
                min={0}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <label className="aa-checkbox-row">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span>Aktivní (viditelná na frontendu)</span>
          </label>
        </form>

        <div className="aa-modal__footer">
          <button className="aa-btn aa-btn--ghost" onClick={onClose} disabled={isSaving}>
            Zrušit
          </button>
          <button
            className="aa-btn aa-btn--primary"
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
            disabled={isSaving}
          >
            {isSaving ? 'Ukládám…' : isNew ? 'Vytvořit kategorii' : 'Uložit změny'}
          </button>
        </div>
      </div>
    </div>
  );
}
