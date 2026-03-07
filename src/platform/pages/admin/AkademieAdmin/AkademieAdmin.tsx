/**
 * AkademieAdmin — Admin sekce pro správu obsahu Akademie
 *
 * Tab-based navigace: Kategorie | Programy
 * Design: konzistentní s AudioPlayerAdmin (Apple Premium, dark theme)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AkademieAdmin
 * @since 2026-02-27
 */

import { useState } from 'react';
import { CategoryTable } from './components/CategoryTable';
import { ProgramTable } from './components/ProgramTable';
import './AkademieAdmin.css';

type Tab = 'categories' | 'programs';

export default function AkademieAdmin() {
  const [activeTab, setActiveTab] = useState<Tab>('programs');

  return (
    <div className="akademie-admin">
      <div className="akademie-admin__header">
        <div>
          <h1 className="akademie-admin__title">Akademie</h1>
          <p className="akademie-admin__subtitle">
            Správa kategorií, programů, sérií a lekcí
          </p>
        </div>

        <div className="akademie-admin__tabs">
          <button
            className={`akademie-admin__tab ${activeTab === 'programs' ? 'akademie-admin__tab--active' : ''}`}
            onClick={() => setActiveTab('programs')}
          >
            Programy
          </button>
          <button
            className={`akademie-admin__tab ${activeTab === 'categories' ? 'akademie-admin__tab--active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Kategorie
          </button>
        </div>
      </div>

      <div className="akademie-admin__content">
        {activeTab === 'programs' && <ProgramTable />}
        {activeTab === 'categories' && <CategoryTable />}
      </div>
    </div>
  );
}
