/**
 * FunnelSection — Onboarding funnel + Retence uživatelů
 *
 * Přesunuto z AnalyticsAdmin do BusinessAdmin.
 * Tyto metriky jsou konverzní/business, ne engagement.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/BusinessAdmin/sections
 */

import { useRetention, useOnboardingFunnel } from '@/platform/analytics';

const RETENTION_CONFIG = [
  { key: 'd7'   as const, label: 'D7',   benchmark: 50, note: 'registr. před 7–14 dny' },
  { key: 'd30'  as const, label: 'D30',  benchmark: 30, note: 'registr. před 30–60 dny' },
  { key: 'd90'  as const, label: 'D90',  benchmark: 20, note: 'registr. před 90–180 dny', goal: true },
  { key: 'd180' as const, label: 'D180', benchmark: 10, note: 'registr. před 180–360 dny' },
];

function rateColor(rate: number, benchmark: number): string {
  if (rate >= benchmark) return '#30D158';
  if (rate >= benchmark * 0.6) return '#F8CA00';
  return '#FF453A';
}

export function FunnelSection() {
  const { stats, isLoading: retLoading } = useRetention();
  const { funnel, isLoading: funnelLoading } = useOnboardingFunnel();

  return (
    <div className="business-admin__row-2col">

      {/* Retention */}
      <div className="business-admin__chart">
        <div className="business-admin__chart-title">Retence uživatelů</div>
        <div className="business-admin__chart-subtitle">jak dlouho se lidé vracejí</div>
        {retLoading ? (
          <div className="business-admin__empty">Načítám...</div>
        ) : !stats ? (
          <div className="business-admin__empty">Nedostatek dat</div>
        ) : (
          <div className="business-admin__retention-list">
            {RETENTION_CONFIG.map(({ key, label, benchmark, note, goal }) => {
              const bucket = stats[key];
              const color = bucket.total > 0 ? rateColor(bucket.rate, benchmark) : 'rgba(255,255,255,0.2)';
              return (
                <div key={key} className="business-admin__retention-row">
                  <div className="business-admin__retention-label">
                    {label}
                    {goal && <span className="business-admin__retention-goal"> ← cíl</span>}
                  </div>
                  <div className="business-admin__retention-bar-wrap">
                    <div className="business-admin__retention-bar-bg">
                      <div
                        className="business-admin__retention-bar-fill"
                        style={{ width: bucket.total > 0 ? `${bucket.rate}%` : '0%', background: color }}
                      />
                      <div
                        className="business-admin__retention-benchmark"
                        style={{ left: `${benchmark}%` }}
                        title={`Benchmark: ${benchmark}%`}
                      />
                    </div>
                    <span className="business-admin__retention-pct" style={{ color }}>
                      {bucket.total > 0 ? `${bucket.rate}%` : '—'}
                    </span>
                  </div>
                  <div className="business-admin__retention-detail">
                    {bucket.total > 0
                      ? `${bucket.retained}/${bucket.total} · ${note} · bench >${benchmark}%`
                      : `Čeká na data — ${note}`
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Onboarding Funnel */}
      <div className="business-admin__chart">
        <div className="business-admin__chart-title">Onboarding funnel</div>
        <div className="business-admin__chart-subtitle">noví uživatelé · od spuštění aplikace (28.&thinsp;2.)</div>
        {funnelLoading ? (
          <div className="business-admin__empty">Načítám...</div>
        ) : !funnel || funnel.registered === 0 ? (
          <div className="business-admin__empty">Nedostatek dat</div>
        ) : (
          <div className="business-admin__funnel">
            <div className="business-admin__funnel-step">
              <div className="business-admin__funnel-bar" style={{ width: '100%' }} />
              <div className="business-admin__funnel-label">Registrovaní</div>
              <div className="business-admin__funnel-value">{funnel.registered}</div>
            </div>
            {funnel.steps.map((step) => (
              <div key={step.days} className="business-admin__funnel-step">
                <div
                  className="business-admin__funnel-bar business-admin__funnel-bar--highlight"
                  style={{ width: step.pct > 0 ? `${step.pct}%` : '2px' }}
                />
                <div className="business-admin__funnel-label">{step.label}</div>
                <div className="business-admin__funnel-value">
                  {step.count}
                  <span className="business-admin__funnel-pct"> ({step.pct}%)</span>
                </div>
              </div>
            ))}
            <div className="business-admin__funnel-step business-admin__funnel-step--warn">
              <div
                className="business-admin__funnel-bar business-admin__funnel-bar--warn"
                style={{ width: funnel.neverStartedPct > 0 ? `${funnel.neverStartedPct}%` : '2px' }}
              />
              <div className="business-admin__funnel-label">Nikdy nezačali</div>
              <div className="business-admin__funnel-value">
                {funnel.neverStarted}
                <span className="business-admin__funnel-pct"> ({funnel.neverStartedPct}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
