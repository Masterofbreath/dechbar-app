/**
 * StripeOverviewSection — přehled produktů ve Stripe + prodeje
 *
 * Zobrazuje:
 * - Název produktu, Stripe Product ID, odkaz do Stripe Dashboardu
 * - Počet prodejů (z tabulky memberships / user_modules)
 * - Ecomail list ID (in/before)
 *
 * @since 2026-03-10
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';

interface ProductSalesRow {
  id: string;
  name: string;
  price_type: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  ecomail_list_in: string | null;
  ecomail_list_before: string | null;
  sales_count: number;
}

async function fetchProductsWithSales(): Promise<ProductSalesRow[]> {
  const { data: modules, error: modErr } = await supabase
    .from('modules')
    .select(
      'id, name, price_type, stripe_product_id, stripe_price_id, ' +
      'stripe_price_id_monthly, stripe_price_id_annual, ' +
      'ecomail_list_in, ecomail_list_before',
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (modErr) throw modErr;

  // Načti počty prodejů z memberships (subscription) + user_modules (lifetime)
  const { data: membershipCounts } = await supabase
    .from('memberships')
    .select('plan')
    .in('status', ['active', 'cancelled']);

  const { data: userModuleCounts } = await supabase
    .from('user_modules')
    .select('module_id');

  const membershipMap: Record<string, number> = {};
  (membershipCounts ?? []).forEach((m) => {
    const key = `membership-${m.plan.toLowerCase()}`;
    membershipMap[key] = (membershipMap[key] ?? 0) + 1;
  });

  const moduleMap: Record<string, number> = {};
  (userModuleCounts ?? []).forEach((um) => {
    moduleMap[um.module_id] = (moduleMap[um.module_id] ?? 0) + 1;
  });

  return (modules ?? []).map((m) => ({
    ...m,
    sales_count: (membershipMap[m.id] ?? 0) + (moduleMap[m.id] ?? 0),
  }));
}

const STRIPE_DASHBOARD_URL = 'https://dashboard.stripe.com/products';

export function StripeOverviewSection() {
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'stripe-overview'],
    queryFn: fetchProductsWithSales,
    staleTime: 2 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="payments-admin__section">
        <div className="payments-admin__empty">Načítám Stripe přehled...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="payments-admin__section">
        <div className="payments-admin__error">Chyba při načítání dat.</div>
      </div>
    );
  }

  return (
    <div className="payments-admin__section">
      <h2 className="payments-admin__section-title">Stripe přehled</h2>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Počty prodejů jsou orientační (memberships + user_modules). Pro přesná data viz Stripe Dashboard.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="payments-admin__table">
          <thead>
            <tr>
              <th>Produkt</th>
              <th>Typ</th>
              <th>Stripe Product ID</th>
              <th>Prodejů</th>
              <th>Ecomail (in / before)</th>
              <th>Odkaz</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <strong>{product.name}</strong>
                  <br />
                  <code style={{ fontSize: '0.7rem', opacity: 0.5 }}>{product.id}</code>
                </td>
                <td>
                  <span
                    className={`payments-admin__badge payments-admin__badge--${product.price_type}`}
                  >
                    {product.price_type}
                  </span>
                </td>
                <td>
                  {product.stripe_product_id ? (
                    <span className="payments-admin__code">{product.stripe_product_id}</span>
                  ) : (
                    <span className="payments-admin__code payments-admin__code--missing">
                      Chybí
                    </span>
                  )}
                </td>
                <td>
                  <strong>{product.sales_count}</strong>
                </td>
                <td>
                  <span style={{ fontSize: '0.8rem' }}>
                    {product.ecomail_list_in ?? '—'} / {product.ecomail_list_before ?? '—'}
                  </span>
                </td>
                <td>
                  {product.stripe_product_id ? (
                    <a
                      href={`${STRIPE_DASHBOARD_URL}/${product.stripe_product_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="payments-admin__stripe-link"
                    >
                      Stripe
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
