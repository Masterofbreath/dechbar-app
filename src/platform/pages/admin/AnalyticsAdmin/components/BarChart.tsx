/**
 * BarChart — sloupcový graf minut za období
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/components
 */

import { formatMinutes } from '@/platform/analytics';
import type { DailyKpis } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';
import { formatBarDate, formatBarValue, groupByWeek } from '../utils/formatters';

interface BarChartProps {
  kpis: DailyKpis[];
  last7Kpis: DailyKpis[];
  isLoading: boolean;
  period: DashboardPeriod;
}

const PERIOD_BAR_TITLES: Record<DashboardPeriod, string> = {
  today:     'Minuty prodýchány — posledních 7 dní',
  yesterday: 'Minuty prodýchány — posledních 7 dní',
  week:      'Minuty prodýchány — posledních 7 dní',
  month:     'Minuty prodýchány — tento měsíc',
  year:      'Minuty prodýchány — letos (po týdnech)',
};

export function BarChart({ kpis, last7Kpis, isLoading, period }: BarChartProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const days: DailyKpis[] = period === 'month'
    ? kpis.slice(-30)
    : period === 'year'
      ? groupByWeek(kpis)
      : last7Kpis;

  const maxVal = Math.max(...days.map((d) => d.totalMinutesBeathed), 0.01);

  const getLabel = (day: DailyKpis): string => {
    if (period === 'year') return `T. ${formatBarDate(day.date)}`;
    return day.date === todayStr ? 'dnes' : formatBarDate(day.date);
  };

  return (
    <div className="analytics-admin__chart">
      <div className="analytics-admin__chart-title">{PERIOD_BAR_TITLES[period]}</div>
      <div className="analytics-admin__bar-chart">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="analytics-admin__bar-wrap">
                <div className="analytics-admin__skeleton" style={{ height: '80%', width: '100%' }} />
              </div>
            ))
          : days.map((day) => {
              const pct = maxVal > 0 ? (day.totalMinutesBeathed / maxVal) * 100 : 0;
              const isToday = day.date === todayStr;
              const label = getLabel(day);
              const valueLabel = formatBarValue(day.totalMinutesBeathed);
              return (
                <div
                  key={day.date}
                  className={`analytics-admin__bar-wrap${isToday ? ' analytics-admin__bar-wrap--today' : ''}`}
                  title={`${label}: ${formatMinutes(day.totalMinutesBeathed)}`}
                >
                  {valueLabel && (
                    <div className="analytics-admin__bar-value">{valueLabel}</div>
                  )}
                  <div
                    className={`analytics-admin__bar${isToday ? ' analytics-admin__bar--today' : ''}`}
                    style={{ height: `${Math.max(pct, day.totalMinutesBeathed > 0 ? 4 : 0)}%` }}
                  />
                  <div className="analytics-admin__bar-label">{label}</div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
