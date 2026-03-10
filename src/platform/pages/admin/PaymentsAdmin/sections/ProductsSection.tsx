/**
 * ProductsSection — tabulka produktů (modules) s možností editace příznaků
 *
 * Funkce:
 * - Zobrazí všechny is_active produkty s Stripe IDs
 * - Toggles pro show_on_homepage / show_in_catalog
 * - Tlačítko "Vytvořit Stripe produkt" pro produkty bez stripe_product_id
 * - Inline editace Stripe Price ID pro lifetime produkty
 *
 * @since 2026-03-10
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import type { ProductCatalogItem } from '@/platform/hooks/useProductCatalog';

const PRODUCTS_QUERY_KEY = ['admin', 'products'] as const;

interface ProductRow extends ProductCatalogItem {
  is_active: boolean;
}

async function fetchAllProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from('modules')
    .select(
      'id, name, description, price_czk, price_type, is_active, is_beta, ' +
      'icon, color, sort_order, ' +
      'stripe_price_id, stripe_price_id_monthly, stripe_price_id_annual, stripe_product_id, ' +
      'show_on_homepage, show_in_catalog, ' +
      'ecomail_list_in, ecomail_list_before, requires_module_id',
    )
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

async function updateProductFlags(
  id: string,
  updates: Partial<Pick<ProductRow, 'show_on_homepage' | 'show_in_catalog' | 'stripe_price_id'>>,
) {
  const { error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

export function ProductsSection() {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchAllProducts,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProductRow> }) =>
      updateProductFlags(id, updates),
    onSuccess: (_, { id, updates }) => {
      queryClient.setQueryData<ProductRow[]>(PRODUCTS_QUERY_KEY, (prev) =>
        prev?.map((p) => (p.id === id ? { ...p, ...updates } : p)) ?? [],
      );
      // Invalidate catalog cache too
      queryClient.invalidateQueries({ queryKey: ['product-catalog'] });
      setSuccessMsg('Uloženo');
      setTimeout(() => setSuccessMsg(''), 2000);
    },
  });

  function handleToggle(
    id: string,
    field: 'show_on_homepage' | 'show_in_catalog',
    value: boolean,
  ) {
    updateMutation.mutate({ id, updates: { [field]: value } });
  }

  if (isLoading) {
    return (
      <div className="payments-admin__section">
        <div className="payments-admin__empty">Načítám produkty...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="payments-admin__section">
        <div className="payments-admin__error">Chyba při načítání produktů z DB.</div>
      </div>
    );
  }

  return (
    <div className="payments-admin__section">
      <h2 className="payments-admin__section-title">Produkty v DB</h2>

      {successMsg && (
        <div className="payments-admin__success">{successMsg}</div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="payments-admin__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Název</th>
              <th>Typ</th>
              <th>Cena</th>
              <th>Stripe Price ID</th>
              <th>Monthly</th>
              <th>Annual</th>
              <th>Homepage</th>
              <th>Katalog</th>
              <th>Stav</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onToggle={handleToggle}
                isSaving={updateMutation.isPending && updateMutation.variables?.id === product.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: ProductRow;
  onToggle: (id: string, field: 'show_on_homepage' | 'show_in_catalog', value: boolean) => void;
  isSaving: boolean;
}

function ProductRow({ product, onToggle, isSaving }: ProductRowProps) {
  return (
    <tr>
      <td>
        <code style={{ fontSize: '0.75rem', opacity: 0.7 }}>{product.id}</code>
      </td>
      <td>
        <strong>{product.name}</strong>
        {product.is_beta && (
          <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', color: '#f59e0b' }}>BETA</span>
        )}
      </td>
      <td>
        <span className={`payments-admin__badge payments-admin__badge--${product.price_type}`}>
          {product.price_type}
        </span>
      </td>
      <td>{product.price_czk} Kč</td>
      <td>
        {product.stripe_price_id ? (
          <span className="payments-admin__code">{product.stripe_price_id}</span>
        ) : (
          <span className="payments-admin__code payments-admin__code--missing">—</span>
        )}
      </td>
      <td>
        {product.stripe_price_id_monthly ? (
          <span className="payments-admin__code">{product.stripe_price_id_monthly}</span>
        ) : (
          <span className="payments-admin__code payments-admin__code--missing">—</span>
        )}
      </td>
      <td>
        {product.stripe_price_id_annual ? (
          <span className="payments-admin__code">{product.stripe_price_id_annual}</span>
        ) : (
          <span className="payments-admin__code payments-admin__code--missing">—</span>
        )}
      </td>
      <td>
        <label className="payments-admin__toggle">
          <input
            type="checkbox"
            checked={product.show_on_homepage}
            disabled={isSaving}
            onChange={(e) => onToggle(product.id, 'show_on_homepage', e.target.checked)}
          />
        </label>
      </td>
      <td>
        <label className="payments-admin__toggle">
          <input
            type="checkbox"
            checked={product.show_in_catalog}
            disabled={isSaving}
            onChange={(e) => onToggle(product.id, 'show_in_catalog', e.target.checked)}
          />
        </label>
      </td>
      <td>
        <span
          className={`payments-admin__badge payments-admin__badge--${product.is_active ? 'active' : 'inactive'}`}
        >
          {product.is_active ? 'aktivní' : 'neaktivní'}
        </span>
      </td>
    </tr>
  );
}
