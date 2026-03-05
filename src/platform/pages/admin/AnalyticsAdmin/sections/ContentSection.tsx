/**
 * ContentSection — TOP 5 lekcí tabulka pro AnalyticsAdmin
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/sections
 */

import { useState } from 'react';
import { useTopContent } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';

export function ContentSection() {
  const [topPeriod, setTopPeriod] = useState<DashboardPeriod | 'all'>('all');
  const { data: topContent, isLoading: topLoading } = useTopContent(5, topPeriod);

  return (
    <div className="analytics-admin__top-content">
      <div className="analytics-admin__top-content-header">
        <div className="analytics-admin__top-content-title">TOP 5 lekcí</div>
        <div className="analytics-admin__top-content-filters">
          {([['all', 'Celkem'], ['today', 'Dnes'], ['yesterday', 'Včera'], ['week', 'Týden'], ['month', 'Měsíc']] as [DashboardPeriod | 'all', string][]).map(([p, label]) => (
            <button
              key={p}
              type="button"
              className={`analytics-admin__period-tab analytics-admin__period-tab--sm${topPeriod === p ? ' analytics-admin__period-tab--active' : ''}`}
              onClick={() => setTopPeriod(p)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {topLoading ? (
        <div className="analytics-admin__empty">Načítám...</div>
      ) : topContent.length === 0 ? (
        <div className="analytics-admin__empty">Zatím žádná data</div>
      ) : (
        <table className="analytics-admin__table">
          <thead>
            <tr>
              <th>#</th>
              <th>Lekce</th>
              <th>Kategorie</th>
              <th title="Celkový počet spuštění (včetně re-openů)">Přehrání</th>
              <th title="Počet unikátních uživatelů">Uživatelé</th>
              <th>Dokončení</th>
            </tr>
          </thead>
          <tbody>
            {topContent.map((item, i) => (
              <tr key={item.lessonId}>
                <td style={{ color: 'rgba(255,255,255,0.3)', width: 28 }}>{i + 1}</td>
                <td>{item.lessonTitle || '—'}</td>
                <td style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {item.programTitle || item.categorySlug || '—'}
                </td>
                <td>
                  <span title="Celkový počet spuštění">{item.playCount}</span>
                </td>
                <td>
                  <span
                    className="analytics-admin__unique-users"
                    title={`${item.uniqueUsers} unikátních uživatelů`}
                  >
                    {item.uniqueUsers}
                  </span>
                </td>
                <td>
                  <div className="analytics-admin__completion-bar-wrap">
                    <div className="analytics-admin__completion-bar-bg">
                      <div
                        className="analytics-admin__completion-bar-fill"
                        style={{ width: `${item.completionRate}%` }}
                      />
                    </div>
                    <span className="analytics-admin__completion-pct">{item.completionRate}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
