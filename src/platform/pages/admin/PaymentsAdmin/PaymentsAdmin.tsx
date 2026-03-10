/**
 * PaymentsAdmin — Správa platebních produktů
 *
 * Záložky:
 *   ProductsSection   — tabulka modulů s Stripe IDs, příznaky show_on_homepage / show_in_catalog
 *   StripeOverview    — odkaz do Stripe Dashboardu + počet prodejů
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/PaymentsAdmin
 */

import { useState } from 'react';
import { ProductsSection } from './sections/ProductsSection';
import { StripeOverviewSection } from './sections/StripeOverviewSection';
import './PaymentsAdmin.css';

type Tab = 'products' | 'stripe';

export default function PaymentsAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  return (
    <div className="payments-admin">
      <div className="payments-admin__header">
        <div>
          <h1 className="payments-admin__title">Platby</h1>
          <div className="payments-admin__subtitle">
            Správa produktů, Stripe Price IDs a zobrazení na webu
          </div>
        </div>
      </div>

      <div className="payments-admin__tabs">
        <button
          type="button"
          className={`payments-admin__tab ${activeTab === 'products' ? 'payments-admin__tab--active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Produkty
        </button>
        <button
          type="button"
          className={`payments-admin__tab ${activeTab === 'stripe' ? 'payments-admin__tab--active' : ''}`}
          onClick={() => setActiveTab('stripe')}
        >
          Stripe přehled
        </button>
      </div>

      {activeTab === 'products' && <ProductsSection />}
      {activeTab === 'stripe' && <StripeOverviewSection />}
    </div>
  );
}
