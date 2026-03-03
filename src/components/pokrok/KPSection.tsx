/**
 * KPSection - KP Dashboard sekce pro PokrokPage
 *
 * Orchestrátor: LungProgress + KPSparkline + sub-tiles + CTA.
 * Empty state pokud totalMeasurements === 0.
 * Glass-card wrapper, Apple Premium style.
 *
 * @package DechBar_App
 * @subpackage Components/Pokrok
 */

import { Button } from '@/platform/components';
import { LungProgress } from '@/components/kp/LungProgress';
import { KPSparkline } from '@/components/kp/KPSparkline';
import type { KPMeasurement } from '@/platform/api';

const isMobileDevice = () =>
  typeof window !== 'undefined' && window.innerWidth <= 768;

export interface KPSectionProps {
  currentKP: number | null;
  bestKP: number;
  baselineKP: number | null;
  totalMeasurements: number;
  measurements: KPMeasurement[];
  trend: number;
  isLoading: boolean;
  registeredAt?: string | null;
  onOpenKPCenter: () => void;
}

/**
 * Vytvoří týdenní průměry KP od data registrace.
 * Každý slot = 1 ISO týden. Prázdný týden = null (nezobrazí se v sparkline jako nula).
 * Max 52 týdnů dozadu.
 */
function buildWeeklyKPTimeline(
  measurements: KPMeasurement[],
  registeredAt: string | null | undefined,
): number[] {
  const now = Date.now();
  const startMs = registeredAt ? new Date(registeredAt).getTime() : now - 12 * 7 * 24 * 3600 * 1000;
  const msPerWeek = 7 * 24 * 3600 * 1000;
  const totalWeeks = Math.min(52, Math.max(1, Math.ceil((now - startMs) / msPerWeek)));

  const buckets: number[][] = Array.from({ length: totalWeeks }, () => []);

  for (const m of measurements) {
    const mMs = new Date(m.measured_at).getTime();
    if (mMs < startMs) continue;
    const weekIdx = Math.floor((mMs - startMs) / msPerWeek);
    if (weekIdx >= 0 && weekIdx < totalWeeks) {
      buckets[weekIdx].push(m.value_seconds);
    }
  }

  // Průměr na non-empty bucket, prázdné buckets přeskočíme (null → filtrujeme)
  const result: number[] = [];
  for (const bucket of buckets) {
    if (bucket.length > 0) {
      result.push(Math.round(bucket.reduce((s, v) => s + v, 0) / bucket.length));
    } else {
      result.push(0); // prázdný týden = 0 (bude nízká tečka v sparkline)
    }
  }
  return result;
}

function formatKPValue(seconds: number | null): string {
  if (seconds === null) return '—';
  return String(seconds);
}

function TrendBlock({
  trend,
  measurements,
}: {
  trend: number;
  measurements: KPMeasurement[];
}) {
  if (!measurements.length) return null;

  const latest = new Date(measurements[0].measured_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - latest.getTime()) / (1000 * 60 * 60 * 24));
  const whenLabel = diffDays === 0 ? 'dnes' : diffDays === 1 ? 'včera' : `před ${diffDays} dny`;

  const isPositive = trend > 0;
  const sign = isPositive ? '+' : '';
  const hasTrend = trend !== 0;

  return (
    <div className="kp-section__trend-block">
      <span className={`kp-section__trend${hasTrend ? ` kp-section__trend--${isPositive ? 'positive' : 'negative'}` : ' kp-section__trend--neutral'}`}>
        {hasTrend ? `${sign}${trend}s ${isPositive ? '↑' : '↓'} · ${whenLabel}` : whenLabel}
      </span>
    </div>
  );
}

export function KPSection({
  currentKP,
  bestKP,
  baselineKP,
  totalMeasurements,
  measurements,
  trend,
  isLoading,
  registeredAt,
  onOpenKPCenter,
}: KPSectionProps) {
  // Sparkline data: týdenní osa od registrace
  const weeklyData = buildWeeklyKPTimeline(measurements, registeredAt);
  // Fallback na posledních 10 měření pokud máme jen málo týdnů
  const sparklineData = weeklyData.filter(v => v > 0).length >= 2
    ? weeklyData
    : measurements.slice(0, 10).reverse().map((m) => m.value_seconds);

  const isEmpty = totalMeasurements === 0;

  return (
    <div className="kp-section">

      {isLoading && (
        <div className="kp-section__skeleton-wrap">
          <div className="pokrok-page__skeleton pokrok-page__skeleton--lg" />
        </div>
      )}

      {!isLoading && isEmpty && (
        <div className="kp-section__empty">
          <p className="kp-section__empty-text">
            Zatím žádná měření. Zjisti svůj základ.
          </p>
          <Button variant="primary" size="lg" fullWidth onClick={onOpenKPCenter}>
            Změř svou první KP →
          </Button>
        </div>
      )}

      {!isLoading && !isEmpty && (
        <>
          {/* Hero row + sparkline jako overlay přes spodní část hero */}
          <div className="kp-section__hero-wrap">
              <div className="kp-section__hero-right">
                <span className="kp-section__label">Kontrolní pauza</span>
                <div className="kp-section__hero-left">
                  <span className="kp-section__value">
                    {formatKPValue(currentKP)}
                    <span className="kp-section__value-unit">s</span>
                  </span>
                  <TrendBlock trend={trend} measurements={measurements} />
                </div>
                <LungProgress
                  valueSeconds={currentKP ?? 0}
                  size="xl"
                  animated
                  compact={isMobileDevice()}
                />
              </div>

            {/* Sparkline — překryvná vrstva přes spodní část hero-row */}
            {sparklineData.length >= 2 && (
              <div className="kp-section__sparkline-overlay">
                <KPSparkline
                  data={sparklineData}
                  height={56}
                  startLabel={baselineKP ? `${baselineKP}s` : undefined}
                  endLabel={currentKP ? `${currentKP}s` : undefined}
                />
                <div className="kp-section__sparkline-meta">
                  {(() => {
                    const hasWeekly = weeklyData.filter(v => v > 0).length >= 2;
                    const weeks = weeklyData.length;
                    // Použij reálné hodnoty z props — ne průměry z sparkline
                    const fromVal = baselineKP ?? (measurements.at(-1)?.value_seconds ?? null);
                    const toVal = currentKP;
                    const suffix = hasWeekly ? ` · ${weeks} týd.` : ` · ${measurements.length} měření`;
                    return fromVal && toVal
                      ? `${fromVal}s → ${toVal}s${suffix}`
                      : hasWeekly ? `${weeks} týdnů` : null;
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* 3 sub-tiles */}
          <div className="kp-section__tiles">
            <div className="kp-section__tile">
              <span className="kp-section__tile-label">Nejlepší</span>
              <span className="kp-section__tile-value">
                {bestKP > 0 ? `${bestKP}s` : '—'}
              </span>
            </div>
            <div className="kp-section__tile">
              <span className="kp-section__tile-label">Začátek</span>
              <span className="kp-section__tile-value">
                {baselineKP !== null ? `${baselineKP}s` : '—'}
              </span>
            </div>
            <div className="kp-section__tile">
              <span className="kp-section__tile-label">Měření</span>
              <span className="kp-section__tile-value">{totalMeasurements}</span>
            </div>
          </div>

          {/* CTA */}
          <Button variant="primary" size="lg" fullWidth onClick={onOpenKPCenter}>
            Změřit KP →
          </Button>
        </>
      )}
    </div>
  );
}
