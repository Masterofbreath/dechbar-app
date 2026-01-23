/**
 * KPHistory - Timeline of KP Measurements
 * 
 * Zobrazuje chronologický seznam měření s trendem.
 * Empty state pro nové uživatele.
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { formatSeconds, formatDate, formatTrend, getKPStatus } from '@/utils/kp';
import type { KPMeasurement } from '@/platform/api';
import { EmptyState } from '@/platform/components';

export interface KPHistoryProps {
  /**
   * KP measurements (sorted, newest first)
   */
  measurements: KPMeasurement[];
  
  /**
   * Show only valid measurements
   * @default true
   */
  validOnly?: boolean;
  
  /**
   * Maximum items to show
   * @default 10
   */
  limit?: number;
}

/**
 * KPHistory Component
 */
export function KPHistory({ 
  measurements, 
  validOnly = true,
  limit = 10,
}: KPHistoryProps) {
  // Filter measurements
  const filtered = validOnly 
    ? measurements.filter(m => m.is_valid) 
    : measurements;
  
  const limited = filtered.slice(0, limit);
  
  // Empty state
  if (limited.length === 0) {
    return (
      <EmptyState
        icon=""
        title="Zatím nemáš historii měření"
        message="Nadechni se k prvnímu testu!"
      />
    );
  }
  
  return (
    <div className="kp-history">
      <h3 className="kp-history__title">Historie měření</h3>
      
      <div className="kp-history__list">
        {limited.map((measurement, index) => {
          const prevMeasurement = limited[index + 1];
          const trend = prevMeasurement 
            ? measurement.value_seconds - prevMeasurement.value_seconds 
            : 0;
          
          const status = getKPStatus(measurement.value_seconds);
          
          return (
            <div 
              key={measurement.id} 
              className={`kp-history__item kp-history__item--${status}`}
            >
              {/* Date */}
              <div className="kp-history__date">
                {formatDate(measurement.measured_at)}
              </div>
              
              {/* Value + Trend */}
              <div className="kp-history__value-container">
                <div className="kp-history__value">
                  {formatSeconds(measurement.value_seconds)}
                </div>
                {prevMeasurement && (
                  <div className={`kp-history__trend kp-history__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                    {formatTrend(trend)}
                  </div>
                )}
              </div>
              
              {/* Badges */}
              <div className="kp-history__badges">
                {measurement.is_first_measurement && (
                  <span className="kp-history__badge kp-history__badge--first">
                    První
                  </span>
                )}
                {!measurement.is_valid && (
                  <span className="kp-history__badge kp-history__badge--invalid">
                    Vzorové
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
