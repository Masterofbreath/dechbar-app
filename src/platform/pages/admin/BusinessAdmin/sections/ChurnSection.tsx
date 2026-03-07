/**
 * ChurnSection — Protokoly + Churn risk
 *
 * Přesunuto z AnalyticsAdmin (ProtocolStatsSection) do BusinessAdmin.
 * Churn je business metrika — kdo přestal platit/trénovat.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/BusinessAdmin/sections
 */

import { useProtocolStats, useChurnRisk } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';

interface ChurnSectionProps {
  period?: DashboardPeriod;
}

export function ChurnSection({ period = 'month' }: ChurnSectionProps) {
  const { stats } = useProtocolStats(period);
  const { count: churnCount } = useChurnRisk();

  return (
    <div className="business-admin__row-2col">

      {/* Protocol stats */}
      <div className="business-admin__chart">
        <div className="business-admin__chart-title">Protokoly — spuštění / dokončení</div>
        {stats.length === 0 ? (
          <div className="business-admin__empty">Zatím žádná data za toto období</div>
        ) : (
          <div className="business-admin__protocol-list">
            {stats.map((s) => (
              <div key={s.type} className="business-admin__protocol-row">
                <div className="business-admin__protocol-label">{s.label}</div>
                <div className="business-admin__protocol-bar-bg">
                  <div
                    className="business-admin__protocol-bar-fill"
                    style={{ width: `${s.completionRate}%` }}
                  />
                </div>
                <div className="business-admin__protocol-meta">
                  <span className="business-admin__protocol-pct">{s.completionRate}%</span>
                  <span className="business-admin__protocol-counts">
                    <span className="business-admin__protocol-started" title="Spuštěno">{s.started}×</span>
                    <span className="business-admin__protocol-sep">/</span>
                    <span className="business-admin__protocol-completed" title="Dokončeno">{s.completed}✓</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Churn risk */}
      <div className="business-admin__chart">
        <div className="business-admin__chart-header">
          <div>
            <div className="business-admin__chart-title">Churn risk</div>
            <div className="business-admin__chart-subtitle">uživatelé, kteří přestali trénovat</div>
          </div>
          {churnCount > 0 && (
            <div className="business-admin__churn-badge">{churnCount}</div>
          )}
        </div>
        <div className="business-admin__churn-desc">
          Kritérium: aktivní 5+ dní v posledních 30 dnech, pak tichý 3+ dny.
          Tito lidé trénovali pravidelně — a najednou přestali.
        </div>
        {churnCount === 0 ? (
          <div className="business-admin__empty" style={{ padding: '8px 0' }}>
            Žádný ohrožený uživatel
          </div>
        ) : (
          <div className="business-admin__churn-count">
            <span className="business-admin__churn-number">{churnCount}</span>
            <span className="business-admin__churn-label">
              {churnCount === 1 ? 'uživatel čeká' : churnCount < 5 ? 'uživatelé čekají' : 'uživatelů čeká'} na oslovení
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
