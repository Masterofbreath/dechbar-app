/**
 * KPHistoryList - Compact history of recent KP measurements
 *
 * Zobrazuje 3–5 posledních měření s datem, hodnotou a trendem.
 * Renderuje se pouze pokud measurements.length >= 2.
 * Určeno pro KPReady view uvnitř KPCenter modalu.
 *
 * @package DechBar_App
 * @subpackage Platform/Components/KP/Views
 */

import type { KPMeasurement } from '@/platform/api';

export interface KPHistoryListProps {
  measurements: KPMeasurement[];
  limit?: number;
}

function formatCzechDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
  });
}

function TrendArrow({ current, previous }: { current: number; previous: number | undefined }) {
  if (previous === undefined) return <span className="kp-history-list__trend kp-history-list__trend--same">—</span>;
  const diff = current - previous;
  if (diff > 0) return <span className="kp-history-list__trend kp-history-list__trend--up">↑</span>;
  if (diff < 0) return <span className="kp-history-list__trend kp-history-list__trend--down">↓</span>;
  return <span className="kp-history-list__trend kp-history-list__trend--same">—</span>;
}

export function KPHistoryList({ measurements, limit = 5 }: KPHistoryListProps) {
  // Zobrazit pouze pokud jsou alespoň 2 měření
  if (!measurements || measurements.length < 2) return null;

  // measurements jsou newest first — zobrazíme prvních `limit`
  const visible = measurements.slice(0, limit);

  return (
    <div className="kp-history-list">
      <div className="kp-history-list__title">Poslední měření</div>
      <ul className="kp-history-list__list" role="list">
        {visible.map((m, index) => {
          // Předchozí = o 1 index výš (older measurement)
          const previous = measurements[index + 1];
          return (
            <li key={m.id} className="kp-history-list__row">
              <span className="kp-history-list__date">
                {formatCzechDate(m.measured_at)}
              </span>
              <span className="kp-history-list__value">{m.value_seconds}s</span>
              <TrendArrow current={m.value_seconds} previous={previous?.value_seconds} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
