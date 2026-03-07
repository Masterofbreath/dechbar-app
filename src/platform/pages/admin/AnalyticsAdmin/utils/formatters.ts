/**
 * AnalyticsAdmin — shared formatters and helper utilities
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/utils
 */

import type { DailyKpis } from '@/platform/analytics';

// ── Number formatting ──────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function sumKpi(kpis: DailyKpis[], key: keyof DailyKpis): number {
  return kpis.reduce((sum, k) => sum + Number(k[key] ?? 0), 0);
}

// ── Minutes formatting ─────────────────────────────────────────────────────

/** Format a minutes value as human-readable diff: +1h 20 min, −45 min, etc. */
export function formatMinutesDelta(absDiff: number): string {
  const h = Math.floor(absDiff / 60);
  const m = Math.round(absDiff % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

/** Format a decimal-minutes diff for avg-per-day card: "1 min 6 s", "45 s" */
export function formatAvgMinutesDelta(absDiff: number): string {
  const totalSec = Math.round(absDiff * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s} s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} s`;
}

// ── Bar chart helpers ──────────────────────────────────────────────────────

/** Formats a date string 'YYYY-MM-DD' as short Czech label: '1. 3.', '28. 2.', etc. */
export function formatBarDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return `${d.getUTCDate()}. ${d.getUTCMonth() + 1}.`;
}

/** Compact minutes label for bar: '2h', '45 min', '1h 5m' */
export function formatBarValue(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Aggregates daily kpis into weekly buckets (ISO week Mon–Sun). Returns one entry per week. */
export function groupByWeek(kpis: DailyKpis[]): DailyKpis[] {
  const weeks = new Map<string, { total: number; firstDate: string }>();
  for (const k of kpis) {
    const d = new Date(`${k.date}T12:00:00Z`);
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

// ── Delta computation ──────────────────────────────────────────────────────

/**
 * Computes delta label for admin KPI cards.
 *
 * Shows: diff value + % change vs the FULL previous period.
 * Example: "+68 · +∞%  vs. min. týden"  or  "−1h 5 min · −12%  vs. min. měsíc"
 */
export function getDelta(
  current: number,
  prev: number,
  type: 'count' | 'minutes' | 'avg-minutes' = 'count',
  periodLabel = 'předchozí',
): { label: string; dir: 'up' | 'down' | 'same' } {
  if (prev === 0 && current === 0) return { label: '', dir: 'same' };
  const diff = current - prev;
  if (diff === 0) return { label: `= stejně vs. ${periodLabel}`, dir: 'same' };
  const absDiff = Math.abs(diff);
  const formatted = type === 'minutes'
    ? formatMinutesDelta(absDiff)
    : type === 'avg-minutes'
      ? formatAvgMinutesDelta(absDiff)
      : formatNumber(absDiff);
  const sign = diff > 0 ? '+' : '−';
  const pct = prev > 0 ? Math.round(Math.abs(diff / prev) * 100) : null;
  const pctStr = pct != null ? ` (${sign}${pct}%)` : '';
  return {
    label: `${sign}${formatted} vs. ${periodLabel}${pctStr}`,
    dir: diff > 0 ? 'up' : 'down',
  };
}
