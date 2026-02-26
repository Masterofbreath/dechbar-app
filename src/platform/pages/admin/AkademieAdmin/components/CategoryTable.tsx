/**
 * CategoryTable — Správa kategorií Akademie
 *
 * Zobrazuje tabulku kategorií s možností create/edit/delete.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/platform/services/admin/adminApi';
import type { AkademieCategory } from '@/platform/services/admin/types';
import { CategoryForm } from './CategoryForm';

export function CategoryTable() {
  const [categories, setCategories] = useState<AkademieCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<AkademieCategory | null | undefined>(
    undefined // undefined = form closed
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.akademie.categories.getAll();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst kategorie');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleDelete = async (id: string) => {
    try {
      await adminApi.akademie.categories.delete(id);
      setDeleteConfirmId(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se smazat kategorii');
    }
  };

  const handleFormSave = async () => {
    setEditingCategory(undefined);
    await loadCategories();
  };

  return (
    <>
      <div className="aa-table-section">
        <div className="aa-table-section__header">
          <span className="aa-table-section__title">
            Kategorie
            <span className="aa-table-section__count">({categories.length})</span>
          </span>
          <button
            className="aa-btn aa-btn--primary"
            onClick={() => setEditingCategory(null)}
          >
            + Nová kategorie
          </button>
        </div>

        {error && <div className="aa-error-banner">{error}</div>}

        {isLoading ? (
          <div className="aa-loading">Načítám kategorie…</div>
        ) : categories.length === 0 ? (
          <div className="aa-empty">Žádné kategorie. Vytvořte první.</div>
        ) : (
          <div className="aa-table-wrap">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Název</th>
                  <th>Slug</th>
                  <th>Pořadí</th>
                  <th>Stav</th>
                  <th>Akce</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      {cat.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '0.75rem', color: 'var(--dechbar-teal, #2cbec6)' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td>{cat.sort_order}</td>
                    <td>
                      <span className={`aa-badge aa-badge--${cat.is_active ? 'active' : 'inactive'}`}>
                        {cat.is_active ? 'Aktivní' : 'Neaktivní'}
                      </span>
                    </td>
                    <td>
                      {deleteConfirmId === cat.id ? (
                        <div className="aa-actions">
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            Smazat?
                          </span>
                          <button
                            className="aa-btn aa-btn--danger aa-btn--sm"
                            onClick={() => void handleDelete(cat.id)}
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
                            onClick={() => setEditingCategory(cat)}
                          >
                            Upravit
                          </button>
                          <button
                            className="aa-btn aa-btn--danger aa-btn--sm"
                            onClick={() => setDeleteConfirmId(cat.id)}
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

      {editingCategory !== undefined && (
        <CategoryForm
          category={editingCategory}
          onSave={handleFormSave}
          onClose={() => setEditingCategory(undefined)}
        />
      )}
    </>
  );
}
