/**
 * AnalyticsAdmin — Admin Analytics Dashboard (orchestrátor)
 *
 * Sekce:
 *   KpiSection          — all-time + period KPI karty + bar chart
 *   ActivityChartsSection — Prime time + Den v týdnu
 *   ContentSection      — TOP 5 lekcí tabulka
 *   KPDistributionBlock — Distribuce KP bodů (TODO: vytvořit soubor)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin
 */

import { useState } from 'react';
import { useAdminDashboard, useKPAdminStats } from '@/platform/analytics';
import type { AdminDashboardData, DailyKpis } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';
import { LiveBadge } from './components/KpiCard';
import { KpiSection } from './sections/KpiSection';
import { ActivityChartsSection } from './sections/ActivityChartsSection';
import { ContentSection } from './sections/ContentSection';
import { KPDistributionBlock } from './KPDistributionBlock';
import './AnalyticsAdmin.css';

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'today',     label: 'Dnes'   },
  { key: 'yesterday', label: 'Včera'  },
  { key: 'week',      label: 'Týden'  },
  { key: 'month',     label: 'Měsíc'  },
  { key: 'year',      label: 'Rok'    },
];

export default function AnalyticsAdmin() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { kpis, prevKpis, isLoading, error } = useAdminDashboard(period) as AdminDashboardData & { prevKpis: DailyKpis[] };
  const { distribution: kpDistribution, coverage: kpCoverage, isLoading: kpLoading } = useKPAdminStats();

  return (
    <div className="analytics-admin">

      {/* Header */}
      <div className="analytics-admin__header">
        <div className="analytics-admin__header-left">
          <h1 className="analytics-admin__title">Analytika</h1>
          {period === 'today' && <LiveBadge />}
        </div>
        <div className="analytics-admin__period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={`analytics-admin__period-tab${period === p.key ? ' analytics-admin__period-tab--active' : ''}`}
              onClick={() => setPeriod(p.key)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="analytics-admin__empty">
          Nepodařilo se načíst data: {error}
        </div>
      )}

      {/* KPI karty + bar chart */}
      <KpiSection period={period} kpis={kpis} prevKpis={prevKpis} isLoading={isLoading} />

      {/* Prime Time + Den v týdnu */}
      <ActivityChartsSection />

      {/* TOP 5 lekcí */}
      <ContentSection />

      {/* KP Distribuce */}
      <KPDistributionBlock distribution={kpDistribution} coverage={kpCoverage} isLoading={kpLoading} />

    </div>
  );
}
