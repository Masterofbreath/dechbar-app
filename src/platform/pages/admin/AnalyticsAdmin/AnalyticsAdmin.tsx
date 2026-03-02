/**
 * AnalyticsAdmin — Admin Analytics Dashboard
 *
 * Periods:
 *   Dnes    → real-time live data z audio_sessions + exercise_sessions (refetch každé 2 min)
 *   Včera   → platform_daily_stats z cron jobu (2:00 ráno)
 *   7 dní   → platform_daily_stats
 *   30 dní  → platform_daily_stats
 *
 * KPI karty: Aktivní uživatelé, Minuty prodýchány, Noví uživatelé, Celkem registrovaných
 * Bar chart: minuty per den (7 dní)
 * TOP 5 lekcí tabulka
 *
 * Style: Apple Premium, dark theme, BEM CSS, no Tailwind
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin
 */

import { useState } from 'react';
import { useAdminDashboard, useTopContent, useTotalUsers, useAllTimeMinutes, usePrimeTime, useDayOfWeek, useProtocolStats, useChurnRisk, useRetention, useOnboardingFunnel, useAdminLast7DaysKpis } from '@/platform/analytics';
import { formatMinutes } from '@/platform/analytics';
import type { DailyKpis, AdminDashboardData, PrimeTimeSlot, DayOfWeekSlot } from '@/platform/analytics';
import type { DashboardPeriod } from '@/platform/analytics';
import './AnalyticsAdmin.css';

// ── Helpers ──

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function sumKpi(kpis: DailyKpis[], key: keyof DailyKpis): number {
  return kpis.reduce((sum, k) => sum + Number(k[key] ?? 0), 0);
}

/** Returns delta string "+5" / "-3" / "" and direction 'up'|'down'|'same' */
/** Format a minutes value as human-readable diff: +1h 20 min, −45 min, etc. */
function formatMinutesDelta(absDiff: number): string {
  const h = Math.floor(absDiff / 60);
  const m = Math.round(absDiff % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

/**
 * Computes delta label for admin KPI cards.
 *
 * Shows: diff value + % change vs the FULL previous period.
 * Example: "+68 · +∞%  vs. min. týden"  or  "−1h 5 min · −12%  vs. min. měsíc"
 *
 * Admin perspective: How close am I to last period's TOTAL? (not elapsed-window)
 */
function getDelta(
  current: number,
  prev: number,
  type: 'count' | 'minutes' = 'count',
  periodLabel = 'předchozí',
): { label: string; dir: 'up' | 'down' | 'same' } {
  if (prev === 0 && current === 0) return { label: '', dir: 'same' };
  const diff = current - prev;
  if (diff === 0) return { label: `= stejně vs. ${periodLabel}`, dir: 'same' };
  const absDiff = Math.abs(diff);
  const formatted = type === 'minutes' ? formatMinutesDelta(absDiff) : formatNumber(absDiff);
  const sign = diff > 0 ? '+' : '−';
  // % change displayed at the end for readability
  const pct = prev > 0 ? Math.round(Math.abs(diff / prev) * 100) : null;
  const pctStr = pct != null ? ` (${sign}${pct}%)` : '';
  return {
    label: `${sign}${formatted} vs. ${periodLabel}${pctStr}`,
    dir: diff > 0 ? 'up' : 'down',
  };
}

// ── KPI Card ──

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  delta?: { label: string; dir: 'up' | 'down' | 'same' };
  isLoading: boolean;
  gold?: boolean;
}

function KpiCard({ label, value, sublabel, delta, isLoading, gold }: KpiCardProps) {
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

// ── Bar Chart (inline SVG, no external library) ──

interface BarChartProps {
  kpis: DailyKpis[];
  last7Kpis: DailyKpis[];
  isLoading: boolean;
  period: DashboardPeriod;
}

/** Formats a date string 'YYYY-MM-DD' as short Czech label: '1. 3.', '28. 2.', etc. */
function formatBarDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
}

/** Compact minutes label for bar: '2h', '45 min', '1h 5m' */
function formatBarValue(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Aggregates daily kpis into weekly buckets (ISO week Mon–Sun). Returns one entry per week. */
function groupByWeek(kpis: DailyKpis[]): DailyKpis[] {
  const weeks = new Map<string, { total: number; firstDate: string }>();
  for (const k of kpis) {
    const d = new Date(`${k.date}T12:00:00Z`);
    // Find Monday of the ISO week
    const dow = d.getUTCDay(); // 0=Sun, 1=Mon...
    const offset = dow === 0 ? -6 : 1 - dow;
    const mon = new Date(d);
    mon.setUTCDate(mon.getUTCDate() + offset);
    const weekKey = mon.toISOString().slice(0, 10);
    const entry = weeks.get(weekKey);
    if (!entry) {
      weeks.set(weekKey, { total: k.totalMinutesBeathed, firstDate: weekKey });
    } else {
      entry.total += k.totalMinutesBeathed;
    }
  }
  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { total }]) => ({
      date,
      totalMinutesBeathed: total,
      newRegistrations: 0,
      dauL2: 0,
      totalAudioSessions: 0,
      completedAudioSessions: 0,
      totalExerciseSessions: 0,
      completedExerciseSessions: 0,
    }));
}

const PERIOD_BAR_TITLES: Record<DashboardPeriod, string> = {
  today:     'Minuty prodýchány — posledních 7 dní',
  yesterday: 'Minuty prodýchány — posledních 7 dní',
  week:      'Minuty prodýchány — posledních 7 dní',
  month:     'Minuty prodýchány — tento měsíc',
  year:      'Minuty prodýchány — letos (po týdnech)',
};

function BarChart({ kpis, last7Kpis, isLoading, period }: BarChartProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Dnes/Včera/Týden → always last 7 calendar days (context for current activity)
  // Měsíc → up to 30 days
  // Rok → weekly aggregated bars
  const days: DailyKpis[] = period === 'month'
    ? kpis.slice(-30)
    : period === 'year'
      ? groupByWeek(kpis)
      : last7Kpis; // today, yesterday, week → last 7 days

  const maxVal = Math.max(...days.map((d) => d.totalMinutesBeathed), 0.01);

  const getLabel = (day: DailyKpis): string => {
    if (period === 'year') return `T. ${formatBarDate(day.date)}`; // week starting date
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

// ── Live indicator ──

function LiveBadge() {
  return (
    <span className="analytics-admin__live-badge">
      <span className="analytics-admin__live-dot" />
      živě
    </span>
  );
}

// ── Prime Time Chart ──

function PrimeTimeChart({ slots, peakHour, isLoading }: { slots: PrimeTimeSlot[]; peakHour: number | null; isLoading: boolean }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Show only 5-23h range
  const relevant = slots.length > 0
    ? slots.filter((s) => s.totalCount > 0 || (s.hour >= 5 && s.hour <= 23))
    : Array.from({ length: 19 }, (_, i) => ({
        hour: i + 5, label: `${String(i + 5).padStart(2, '0')}:00`,
        totalCount: 0, genuineCount: 0, pct: 0, totalMinutes: 0, avgMinutes: 0, score: 0,
      }));

  const peakLabel = peakHour !== null
    ? `${String(peakHour).padStart(2, '0')}:00 – ${String(peakHour + 1).padStart(2, '0')}:00`
    : '—';

  const hoveredSlot = hoveredHour !== null ? relevant.find((s) => s.hour === hoveredHour) ?? null : null;

  return (
    <div className="analytics-admin__chart">
      <div className="analytics-admin__chart-header">
        <div>
          <div className="analytics-admin__chart-title">Prime time — kdy uživatelé trénují</div>
          <div className="analytics-admin__chart-subtitle">všichni uživatelé · posledních 30 dní</div>
        </div>
        {peakHour !== null && !isLoading && (
          <div className="analytics-admin__chart-peak">Špička: <strong>{peakLabel}</strong></div>
        )}
      </div>

      {/* Hover info strip */}
      <div className="analytics-admin__primetime-info">
        {hoveredSlot && hoveredSlot.genuineCount > 0 ? (
          <>
            <span className="analytics-admin__primetime-hour">{hoveredSlot.label}</span>
            <span className="analytics-admin__primetime-sessions">{hoveredSlot.genuineCount} cvičení</span>
            <span className="analytics-admin__primetime-sep">·</span>
            <span className="analytics-admin__primetime-minutes">{hoveredSlot.totalMinutes} min</span>
            <span className="analytics-admin__primetime-sep">·</span>
            <span className="analytics-admin__primetime-avg">ø {hoveredSlot.avgMinutes} min/cvičení</span>
            {hoveredSlot.totalCount > hoveredSlot.genuineCount && (
              <>
                <span className="analytics-admin__primetime-sep">·</span>
                <span className="analytics-admin__primetime-abandoned">
                  {hoveredSlot.totalCount - hoveredSlot.genuineCount} přerušeno
                </span>
              </>
            )}
          </>
        ) : hoveredSlot && hoveredSlot.totalCount > 0 ? (
          <>
            <span className="analytics-admin__primetime-hour">{hoveredSlot.label}</span>
            <span className="analytics-admin__primetime-abandoned">{hoveredSlot.totalCount} spuštění, všechna přerušena</span>
          </>
        ) : (
          <span className="analytics-admin__primetime-hint">Najeď na sloupec pro detail</span>
        )}
      </div>

      <div className="analytics-admin__bar-chart analytics-admin__bar-chart--primetime">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="analytics-admin__bar-wrap">
                <div className="analytics-admin__skeleton" style={{ height: '60%', width: '100%' }} />
              </div>
            ))
          : relevant.map((slot) => {
              const isPeak = slot.hour === peakHour;
              const isHovered = slot.hour === hoveredHour;
              return (
                <div
                  key={slot.hour}
                  className={`analytics-admin__bar-wrap${isHovered ? ' analytics-admin__bar-wrap--hovered' : ''}`}
                  onMouseEnter={() => setHoveredHour(slot.hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {isHovered && slot.genuineCount > 0 && (
                    <div className="analytics-admin__bar-count">{slot.genuineCount}</div>
                  )}
                  <div
                    className={`analytics-admin__bar${isPeak ? ' analytics-admin__bar--peak' : ''}${isHovered ? ' analytics-admin__bar--hovered' : ''}`}
                    style={{ height: `${Math.max(slot.pct, slot.totalCount > 0 ? 2 : 0)}%` }}
                  />
                  <div className="analytics-admin__bar-label">
                    {slot.hour % 3 === 0 ? `${String(slot.hour).padStart(2, '0')}` : ''}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Day of Week Chart ──

function DayOfWeekChart({ slots, peakDay, peakDayLabel, isLoading }: { slots: DayOfWeekSlot[]; peakDay: number | null; peakDayLabel: string | null; isLoading: boolean }) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const display = slots.length === 7
    ? slots
    : Array.from({ length: 7 }, (_, i) => ({
        day: i, label: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'][i],
        totalCount: 0, genuineCount: 0, totalMinutes: 0, avgMinutes: 0, score: 0, pct: 0,
      }));

  const peakLabel = peakDayLabel ?? '—';
  const hoveredSlot = hoveredDay !== null ? display[hoveredDay] ?? null : null;

  return (
    <div className="analytics-admin__chart">
      <div className="analytics-admin__chart-header">
        <div>
          <div className="analytics-admin__chart-title">Nejaktivnější dny v týdnu</div>
          <div className="analytics-admin__chart-subtitle">všichni uživatelé · posledních 30 dní</div>
        </div>
        {peakDay !== null && !isLoading && (
          <div className="analytics-admin__chart-peak">Špička: <strong>{peakLabel}</strong></div>
        )}
      </div>

      <div className="analytics-admin__primetime-info">
        {hoveredSlot && hoveredSlot.genuineCount > 0 ? (
          <>
            <span className="analytics-admin__primetime-hour">{hoveredSlot.label}</span>
            <span className="analytics-admin__primetime-sessions">{hoveredSlot.genuineCount} cvičení</span>
            <span className="analytics-admin__primetime-sep">·</span>
            <span className="analytics-admin__primetime-minutes">{hoveredSlot.totalMinutes} min</span>
            <span className="analytics-admin__primetime-sep">·</span>
            <span className="analytics-admin__primetime-avg">ø {hoveredSlot.avgMinutes} min/cvičení</span>
            {hoveredSlot.totalCount > hoveredSlot.genuineCount && (
              <>
                <span className="analytics-admin__primetime-sep">·</span>
                <span className="analytics-admin__primetime-abandoned">
                  {hoveredSlot.totalCount - hoveredSlot.genuineCount} přerušeno
                </span>
              </>
            )}
          </>
        ) : hoveredSlot && hoveredSlot.totalCount > 0 ? (
          <>
            <span className="analytics-admin__primetime-hour">{hoveredSlot.label}</span>
            <span className="analytics-admin__primetime-abandoned">{hoveredSlot.totalCount} spuštění, všechna přerušena</span>
          </>
        ) : (
          <span className="analytics-admin__primetime-hint">Najeď na sloupec pro detail</span>
        )}
      </div>

      <div className="analytics-admin__bar-chart analytics-admin__bar-chart--dow">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="analytics-admin__bar-wrap">
                <div className="analytics-admin__skeleton" style={{ height: '60%', width: '100%' }} />
              </div>
            ))
          : display.map((slot) => {
              const isPeak = slot.day === peakDay;
              const isHovered = slot.day === hoveredDay;
              return (
                <div
                  key={slot.day}
                  className={`analytics-admin__bar-wrap${isHovered ? ' analytics-admin__bar-wrap--hovered' : ''}`}
                  onMouseEnter={() => setHoveredDay(slot.day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {isHovered && slot.genuineCount > 0 && (
                    <div className="analytics-admin__bar-count">{slot.genuineCount}</div>
                  )}
                  <div
                    className={`analytics-admin__bar${isPeak ? ' analytics-admin__bar--peak' : ''}${isHovered ? ' analytics-admin__bar--hovered' : ''}`}
                    style={{ height: `${Math.max(slot.pct, slot.totalCount > 0 ? 2 : 0)}%` }}
                  />
                  <div className="analytics-admin__bar-label analytics-admin__bar-label--dow">
                    {slot.label}
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}

// ── Retention + Onboarding Funnel ──

const RETENTION_CONFIG = [
  { key: 'd7'  as const, label: 'D7',   benchmark: 50, note: 'registr. před 7–14 dny' },
  { key: 'd30' as const, label: 'D30',  benchmark: 30, note: 'registr. před 30–60 dny' },
  { key: 'd90' as const, label: 'D90',  benchmark: 20, note: 'registr. před 90–180 dny', goal: true },
  { key: 'd180'as const, label: 'D180', benchmark: 10, note: 'registr. před 180–360 dny' },
];

function RetentionSection() {
  const { stats, isLoading: retLoading } = useRetention();
  const { funnel, isLoading: funnelLoading } = useOnboardingFunnel();

  function rateColor(rate: number, benchmark: number): string {
    if (rate >= benchmark) return '#30D158';
    if (rate >= benchmark * 0.6) return '#F8CA00';
    return '#FF453A';
  }

  return (
    <div className="analytics-admin__row-2col">
      {/* Retention */}
      <div className="analytics-admin__chart">
        <div className="analytics-admin__chart-title">Retence uživatelů</div>
        <div className="analytics-admin__chart-subtitle">jak dlouho se lidé vracejí</div>
        {retLoading ? (
          <div className="analytics-admin__empty">Načítám...</div>
        ) : !stats ? (
          <div className="analytics-admin__empty">Nedostatek dat</div>
        ) : (
          <div className="analytics-admin__retention-list">
            {RETENTION_CONFIG.map(({ key, label, benchmark, note, goal }) => {
              const bucket = stats[key];
              const color = bucket.total > 0 ? rateColor(bucket.rate, benchmark) : 'rgba(255,255,255,0.2)';
              return (
                <div key={key} className="analytics-admin__retention-row">
                  <div className="analytics-admin__retention-label">
                    {label}
                    {goal && <span className="analytics-admin__retention-goal"> ← cíl</span>}
                  </div>
                  <div className="analytics-admin__retention-bar-wrap">
                    <div className="analytics-admin__retention-bar-bg">
                      <div
                        className="analytics-admin__retention-bar-fill"
                        style={{ width: bucket.total > 0 ? `${bucket.rate}%` : '0%', background: color }}
                      />
                      {/* Benchmark marker */}
                      <div
                        className="analytics-admin__retention-benchmark"
                        style={{ left: `${benchmark}%` }}
                        title={`Benchmark: ${benchmark}%`}
                      />
                    </div>
                    <span className="analytics-admin__retention-pct" style={{ color }}>
                      {bucket.total > 0 ? `${bucket.rate}%` : '—'}
                    </span>
                  </div>
                  <div className="analytics-admin__retention-detail">
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
      <div className="analytics-admin__chart">
        <div className="analytics-admin__chart-title">Onboarding funnel</div>
        <div className="analytics-admin__chart-subtitle">noví uživatelé · od spuštění aplikace (28.&thinsp;2.)</div>
        {funnelLoading ? (
          <div className="analytics-admin__empty">Načítám...</div>
        ) : !funnel || funnel.registered === 0 ? (
          <div className="analytics-admin__empty">Nedostatek dat</div>
        ) : (
          <div className="analytics-admin__funnel">
            {/* Baseline */}
            <div className="analytics-admin__funnel-step">
              <div className="analytics-admin__funnel-bar" style={{ width: '100%' }} />
              <div className="analytics-admin__funnel-label">Registrovaní</div>
              <div className="analytics-admin__funnel-value">{funnel.registered}</div>
            </div>

            {/* Dynamic steps: 24h, 7d, 14d, 21d, 28d */}
            {funnel.steps.map((step) => (
              <div key={step.days} className="analytics-admin__funnel-step">
                <div
                  className="analytics-admin__funnel-bar analytics-admin__funnel-bar--highlight"
                  style={{ width: step.pct > 0 ? `${step.pct}%` : '2px' }}
                />
                <div className="analytics-admin__funnel-label">{step.label}</div>
                <div className="analytics-admin__funnel-value">
                  {step.count}
                  <span className="analytics-admin__funnel-pct"> ({step.pct}%)</span>
                </div>
              </div>
            ))}

            {/* Never started */}
            <div className="analytics-admin__funnel-step analytics-admin__funnel-step--warn">
              <div
                className="analytics-admin__funnel-bar analytics-admin__funnel-bar--warn"
                style={{ width: funnel.neverStartedPct > 0 ? `${funnel.neverStartedPct}%` : '2px' }}
              />
              <div className="analytics-admin__funnel-label">Nikdy nezačali</div>
              <div className="analytics-admin__funnel-value">
                {funnel.neverStarted}
                <span className="analytics-admin__funnel-pct"> ({funnel.neverStartedPct}%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Protocol Stats ──

function ProtocolStatsSection({ isLoading, period }: { isLoading: boolean; period: DashboardPeriod }) {
  const { stats } = useProtocolStats(period);
  const { count: churnCount } = useChurnRisk();

  if (isLoading && stats.length === 0) return null;

  return (
    <div className="analytics-admin__row-2col">
      {/* Protocol stats */}
      <div className="analytics-admin__chart">
        <div className="analytics-admin__chart-title">Protokoly — spuštění / dokončení</div>
        {stats.length === 0 ? (
          <div className="analytics-admin__empty">Zatím žádná data za toto období</div>
        ) : (
          <div className="analytics-admin__protocol-list">
            {stats.map((s) => (
              <div key={s.type} className="analytics-admin__protocol-row">
                <div className="analytics-admin__protocol-label">{s.label}</div>
                <div className="analytics-admin__protocol-bar-bg">
                  <div
                    className="analytics-admin__protocol-bar-fill"
                    style={{ width: `${s.completionRate}%` }}
                  />
                </div>
                <div className="analytics-admin__protocol-meta">
                  <span className="analytics-admin__protocol-pct">{s.completionRate}%</span>
                  <span className="analytics-admin__protocol-counts">
                    <span className="analytics-admin__protocol-started" title="Spuštěno">{s.started}×</span>
                    <span className="analytics-admin__protocol-sep">/</span>
                    <span className="analytics-admin__protocol-completed" title="Dokončeno">{s.completed}✓</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Churn risk */}
      <div className="analytics-admin__chart">
        <div className="analytics-admin__chart-header">
          <div>
            <div className="analytics-admin__chart-title">Churn risk</div>
            <div className="analytics-admin__chart-subtitle">uživatelé, kteří přestali trénovat</div>
          </div>
          {churnCount > 0 && (
            <div className="analytics-admin__churn-badge">{churnCount}</div>
          )}
        </div>
        <div className="analytics-admin__churn-desc">
          Kritérium: aktivní 5+ dní v posledních 30 dnech, pak tichý 3+ dny.
          Tito lidé trénovali pravidelně — a najednou přestali. Jsou připraveni na reengagement notifikaci.
        </div>
        {churnCount === 0 ? (
          <div className="analytics-admin__empty" style={{ padding: '8px 0' }}>
            Žádný ohrožený uživatel
          </div>
        ) : (
          <div className="analytics-admin__churn-count">
            <span className="analytics-admin__churn-number">{churnCount}</span>
            <span className="analytics-admin__churn-label">
              {churnCount === 1 ? 'uživatel čeká' : churnCount < 5 ? 'uživatelé čekají' : 'uživatelů čeká'} na oslovení
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'today', label: 'Dnes' },
  { key: 'yesterday', label: 'Včera' },
  { key: 'week', label: 'Týden' },
  { key: 'month', label: 'Měsíc' },
  { key: 'year', label: 'Rok' },
];

export default function AnalyticsAdmin() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { kpis, prevKpis, isLoading, error } = useAdminDashboard(period) as AdminDashboardData & { prevKpis: DailyKpis[] };
  const [topPeriod, setTopPeriod] = useState<DashboardPeriod | 'all'>('all');
  const { data: topContent, isLoading: topLoading } = useTopContent(5, topPeriod);
  const { count: totalUsers, isLoading: usersLoading } = useTotalUsers();
  const { minutes: allTimeMinutes, isLoading: allTimeLoading } = useAllTimeMinutes();
  // Always-visible last 7 days — used by BarChart for today/yesterday/week periods
  const { kpis: last7Kpis } = useAdminLast7DaysKpis();
  const { slots: primeSlots, peakHour, isLoading: primeLoading } = usePrimeTime();
  const { slots: dowSlots, peakDay, peakDayLabel, isLoading: dowLoading } = useDayOfWeek();

  const dauL2 = kpis.length > 0
    ? (period === 'today' || period === 'yesterday'
        ? kpis[0]?.dauL2 ?? 0
        : sumKpi(kpis, 'dauL2'))
    : 0;
  const minutes = sumKpi(kpis, 'totalMinutesBeathed');
  const newUsers = sumKpi(kpis, 'newRegistrations');

  // Previous period values for deltas
  const prevDauL2 = prevKpis.length > 0
    ? (period === 'today' ? prevKpis[0]?.dauL2 ?? 0 : sumKpi(prevKpis, 'dauL2'))
    : 0;
  const prevMinutes = sumKpi(prevKpis, 'totalMinutesBeathed');
  const prevNewUsers = sumKpi(prevKpis, 'newRegistrations');

  const periodLabel: Record<DashboardPeriod, string> = {
    today: 'dnes',
    yesterday: 'včera',
    week: 'tento týden',
    month: 'tento měsíc',
    year: 'letos',
  };

  // Short label for "vs. X" delta suffix — always describes the FULL previous period
  const prevPeriodShortLabel: Record<DashboardPeriod, string> = {
    today: 'včera',
    yesterday: 'předevčírem',
    week: 'min. týden',
    month: 'min. měsíc',
    year: 'min. rok',
  };

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

      {/* Error */}
      {error && (
        <div className="analytics-admin__empty">
          Nepodařilo se načíst data: {error}
        </div>
      )}

      {/* KPI Grid — řada 1: celkové (all-time) stats */}
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

      {/* KPI Grid — řada 2: period stats */}
      <div className="analytics-admin__section-label">{periodLabel[period].charAt(0).toUpperCase() + periodLabel[period].slice(1)}</div>
      <div className="analytics-admin__kpi-grid analytics-admin__kpi-grid--3">
        <KpiCard
          label="Aktivní uživatelé"
          value={isLoading ? '—' : formatNumber(dauL2)}
          sublabel="spustili alespoň 1 aktivitu"
          delta={prevKpis.length > 0 ? getDelta(dauL2, prevDauL2, 'count', prevPeriodShortLabel[period]) : undefined}
          isLoading={isLoading}
        />
        <KpiCard
          label="Minuty prodýchány"
          value={isLoading ? '—' : formatMinutes(minutes)}
          sublabel={periodLabel[period]}
          delta={prevKpis.length > 0 ? getDelta(minutes, prevMinutes, 'minutes', prevPeriodShortLabel[period]) : undefined}
          isLoading={isLoading}
          gold
        />
        <KpiCard
          label="Noví uživatelé"
          value={isLoading ? '—' : formatNumber(newUsers)}
          sublabel={`registrací ${periodLabel[period]}`}
          delta={prevKpis.length > 0 ? getDelta(newUsers, prevNewUsers, 'count', prevPeriodShortLabel[period]) : undefined}
          isLoading={isLoading}
        />
      </div>

      {/* Bar Chart — minuty za období */}
      <BarChart kpis={kpis} last7Kpis={last7Kpis} isLoading={isLoading} period={period} />

      {/* Prime Time + Day of Week — vedle sebe v 2 sloupcích */}
      <div className="analytics-admin__row-2col analytics-admin__row-2col--charts">
        <PrimeTimeChart slots={primeSlots} peakHour={peakHour} isLoading={primeLoading} />
        <DayOfWeekChart slots={dowSlots} peakDay={peakDay} peakDayLabel={peakDayLabel} isLoading={dowLoading} />
      </div>

      {/* Retention D7/D30 + Onboarding funnel */}
      <RetentionSection />

      {/* Protocol heatmap + Churn risk */}
      <ProtocolStatsSection isLoading={false} period={period} />

      {/* Top Content Table — s period filtrem */}
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
    </div>
  );
}
