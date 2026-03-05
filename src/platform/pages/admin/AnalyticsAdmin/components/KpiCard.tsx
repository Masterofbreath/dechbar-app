/**
 * KpiCard — sdílená komponenta pro admin KPI karty
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/components
 */

export interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  delta?: { label: string; dir: 'up' | 'down' | 'same' };
  isLoading: boolean;
  gold?: boolean;
}

export function KpiCard({ label, value, sublabel, delta, isLoading, gold }: KpiCardProps) {
  return (
    <div className="analytics-admin__kpi-card">
      <div className="analytics-admin__kpi-label">{label}</div>
      {isLoading ? (
        <div className="analytics-admin__skeleton" />
      ) : (
        <div className={`analytics-admin__kpi-value${gold ? ' analytics-admin__kpi-value--gold' : ''}`}>
          {value}
        </div>
      )}
      {!isLoading && (sublabel || delta?.label) && (
        <div className="analytics-admin__kpi-meta">
          {sublabel && <span className="analytics-admin__kpi-sublabel">{sublabel}</span>}
          {delta?.label && (
            <span className={`analytics-admin__kpi-delta analytics-admin__kpi-delta--${delta.dir}`}>
              {delta.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="analytics-admin__live-badge">
      <span className="analytics-admin__live-dot" />
      živě
    </span>
  );
}
