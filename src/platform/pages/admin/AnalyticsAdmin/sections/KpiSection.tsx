/**
 * KpiSection — sekce KPI karet pro AnalyticsAdmin
 *
 * Zobrazuje:
 *  - "Celkem od spuštění": Registrovaní uživatelé + Minuty prodýchány celkem
 *  - "Aktuální období": Aktivní uživatelé + Minuty + Průměr/den + Noví uživatelé
 *  - BarChart pro minuty
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/sections
 */

import { formatMinutes } from '@/platform/analytics';
import { useTotalUsers, useAllTimeMinutes, useUniqueActiveUsers, useAvgMinutesPerActiveUserDay, useAdminLast7DaysKpis } from '@/platform/analytics';
import type { DailyKpis } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';
import { KpiCard } from '../components/KpiCard';
import { BarChart } from '../components/BarChart';
import { formatNumber, sumKpi, getDelta } from '../utils/formatters';

interface KpiSectionProps {
  period: DashboardPeriod;
  kpis: DailyKpis[];
  prevKpis: DailyKpis[];
  isLoading: boolean;
}

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today:     'dnes',
  yesterday: 'včera',
  week:      'tento týden',
  month:     'tento měsíc',
  year:      'letos',
};

const PREV_PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today:     'včera',
  yesterday: 'předevčírem',
  week:      'min. týden',
  month:     'min. měsíc',
  year:      'min. rok',
};

export function KpiSection({ period, kpis, prevKpis, isLoading }: KpiSectionProps) {
  const { count: totalUsers, isLoading: usersLoading } = useTotalUsers();
  const { minutes: allTimeMinutes, isLoading: allTimeLoading } = useAllTimeMinutes();
  const { kpis: last7Kpis } = useAdminLast7DaysKpis();
  const { count: uniqueActiveCount, prevCount: prevUniqueActiveCount, isLoading: uniqueActiveLoading } = useUniqueActiveUsers(period);
  const { avgMinutes: avgMinPerActiveDay, prevAvgMinutes: prevAvgMinPerActiveDay, isLoading: avgMinLoading } = useAvgMinutesPerActiveUserDay(period);

  const minutes = sumKpi(kpis, 'totalMinutesBeathed');
  const newUsers = sumKpi(kpis, 'newRegistrations');
  const prevMinutes = sumKpi(prevKpis, 'totalMinutesBeathed');
  const prevNewUsers = sumKpi(prevKpis, 'newRegistrations');

  const periodLabel = PERIOD_LABEL[period];
  const prevLabel = PREV_PERIOD_LABEL[period];

  return (
    <>
      {/* All-time stats */}
      <div className="analytics-admin__section-label">Celkem od spuštění</div>
      <div className="analytics-admin__kpi-grid analytics-admin__kpi-grid--2">
        <KpiCard
          label="Registrovaní uživatelé"
          value={usersLoading ? '—' : formatNumber(totalUsers)}
          sublabel="všichni v aplikaci"
          isLoading={usersLoading}
        />
        <KpiCard
          label="Minuty prodýchány celkem"
          value={allTimeLoading ? '—' : formatMinutes(allTimeMinutes)}
          sublabel="od spuštění aplikace"
          isLoading={allTimeLoading}
          gold
        />
      </div>

      {/* Period stats */}
      <div className="analytics-admin__section-label">
        {periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}
      </div>
      <div className="analytics-admin__kpi-grid analytics-admin__kpi-grid--4">
        <KpiCard
          label="Aktivní uživatelé"
          value={uniqueActiveLoading ? '—' : formatNumber(uniqueActiveCount)}
          sublabel="spustili alespoň 1 aktivitu"
          delta={getDelta(uniqueActiveCount, prevUniqueActiveCount, 'count', prevLabel)}
          isLoading={uniqueActiveLoading}
        />
        <KpiCard
          label="Minuty prodýchány"
          value={isLoading ? '—' : formatMinutes(minutes)}
          sublabel={periodLabel}
          delta={prevKpis.length > 0 ? getDelta(minutes, prevMinutes, 'minutes', prevLabel) : undefined}
          isLoading={isLoading}
          gold
        />
        <KpiCard
          label="Průměr / aktivní den"
          value={avgMinLoading ? '—' : `${avgMinPerActiveDay} min`}
          sublabel="min/uživatel v aktivní den"
          delta={getDelta(avgMinPerActiveDay, prevAvgMinPerActiveDay, 'avg-minutes', prevLabel)}
          isLoading={avgMinLoading}
        />
        <KpiCard
          label="Noví uživatelé"
          value={isLoading ? '—' : formatNumber(newUsers)}
          sublabel={`registrací ${periodLabel}`}
          delta={prevKpis.length > 0 ? getDelta(newUsers, prevNewUsers, 'count', prevLabel) : undefined}
          isLoading={isLoading}
        />
      </div>

      {/* Bar chart */}
      <BarChart kpis={kpis} last7Kpis={last7Kpis} isLoading={isLoading} period={period} />
    </>
  );
}
