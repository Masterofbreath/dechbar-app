/**
 * PokrokPage — User Progress & Statistics
 *
 * Displays personal breathing practice statistics:
 *   - Period selector (D / T / M / R / Celkem)
 *   - Hero row: KP value + Activity streak
 *   - Stats grid: minutes, activities, active days, avg/day
 *   - Activity heatmap (last 84 days — 12 weeks)
 *   - Tier gate for advanced period views (ZDARMA → upgrade CTA)
 *
 * Data: useUserPokrokStats (audio_sessions + exercise_sessions + streaks)
 * KP data: useKPMeasurements (existing hook)
 *
 * Apple Premium Style — dark, minimal, functional.
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 */

import { useState } from 'react';
import { useUserPokrokStats, getDaysSinceRegistration, usePersonalRecords } from '@/platform/analytics';
import { formatMinutes, getActivityLevel } from '@/platform/analytics';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { useAuthStore } from '@/platform/auth';
import type { ActivityPeriod, ActivityDayData } from '@/platform/analytics';
import '@/styles/pages/pokrok.css';

// ── Helpers ──

function formatKP(seconds: number | null): string {
  if (seconds === null) return '—';
  return `${seconds}s`;
}

// ── Activity Heatmap ──

function buildWeeks(days: ActivityDayData[]): ActivityDayData[][] {
  // Group days into columns of 7 (Mon–Sun)
  const weeks: ActivityDayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

interface HeatmapProps {
  days: ActivityDayData[];
  isLoading: boolean;
}

function ActivityHeatmap({ days, isLoading }: HeatmapProps) {
  const weeks = buildWeeks(days);

  return (
    <div className="pokrok-page__graph-section">
      <div className="pokrok-page__graph-title">Aktivita — posledních 12 týdnů</div>
      <div className="pokrok-page__graph-wrap">
        <div className="pokrok-page__graph-grid">
          {isLoading
            ? Array.from({ length: 12 }).map((_, wi) => (
                <div key={wi} className="pokrok-page__graph-col">
                  {Array.from({ length: 7 }).map((_, di) => (
                    <div key={di} className="pokrok-page__graph-cell pokrok-page__graph-cell--0" />
                  ))}
                </div>
              ))
            : weeks.map((week, wi) => (
                <div key={wi} className="pokrok-page__graph-col">
                  {week.map((day) => {
                    const level = getActivityLevel(day.minutes);
                    return (
                      <div
                        key={day.date}
                        className={`pokrok-page__graph-cell pokrok-page__graph-cell--${level}`}
                        title={`${day.date}: ${day.minutes > 0 ? formatMinutes(day.minutes) : 'žádná aktivita'}`}
                        aria-label={`${day.date}: ${day.minutes > 0 ? formatMinutes(day.minutes) : 'žádná aktivita'}`}
                      />
                    );
                  })}
                </div>
              ))}
        </div>
      </div>
      <div className="pokrok-page__graph-legend">
        <span>méně</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`pokrok-page__graph-legend-cell pokrok-page__graph-cell--${level}`}
          />
        ))}
        <span>více</span>
      </div>
    </div>
  );
}

// ── Weekly Dots — current week habit tracker ──

function WeeklyDots({ days }: { days: ActivityDayData[] }) {
  const DOW_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const today = new Date();
  // Find this Monday
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() + mondayOffset);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const graphDay = days.find((g) => g.date === dateStr);
    const isToday = dateStr === today.toISOString().slice(0, 10);
    const isFuture = d > today;
    return { dateStr, label: DOW_SHORT[i], active: (graphDay?.minutes ?? 0) > 0, isToday, isFuture };
  });

  return (
    <div className="pokrok-page__week-dots">
      {week.map((d) => (
        <div key={d.dateStr} className="pokrok-page__week-dot-wrap">
          <div
            className={[
              'pokrok-page__week-dot',
              d.active ? 'pokrok-page__week-dot--active' : '',
              d.isToday ? 'pokrok-page__week-dot--today' : '',
              d.isFuture ? 'pokrok-page__week-dot--future' : '',
            ].filter(Boolean).join(' ')}
          />
          <div className={`pokrok-page__week-dot-label${d.isToday ? ' pokrok-page__week-dot-label--today' : ''}`}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ──

type PeriodTab = { key: ActivityPeriod; label: string; requiresPremium?: boolean };

const PERIOD_TABS: PeriodTab[] = [
  { key: 'day', label: 'D', requiresPremium: true },
  { key: 'week', label: 'T', requiresPremium: true },
  { key: 'month', label: 'M', requiresPremium: true },
  { key: 'year', label: 'R', requiresPremium: true },
  { key: 'all', label: 'Celkem' },
];

export function PokrokPage() {
  const [period, setPeriod] = useState<ActivityPeriod>('all');
  const userId = useAuthStore((s) => s.user?.id);

  const { totalMinutes, totalActivities, activeDays, averageMinutesPerDay, registeredAt,
          prevTotalMinutes, prevTotalActivities, prevActiveDays, prevAverageMinutesPerDay,
          streak, activityGraph, isLoading, error } =
    useUserPokrokStats(userId, period);

  const memberDays = getDaysSinceRegistration(registeredAt ?? undefined);

  // Delta with period context — "↑ +32 min · min. týden"
  const deltaPeriodSuffix: Record<string, string> = {
    day: 'min. den',
    week: 'min. týden',
    month: 'min. měsíc',
    year: 'min. rok',
  };

  function renderDelta(current: number, prev: number | null, unit: 'min' | 'count') {
    if (prev === null || isLoading) return null;
    const diff = Math.round((current - prev) * 10) / 10;
    const suffix = deltaPeriodSuffix[period] ?? '';
    if (diff === 0) return (
      <div className="pokrok-page__delta pokrok-page__delta--neutral">— stejně · {suffix}</div>
    );
    const arrow = diff > 0 ? '↑' : '↓';
    const absDiff = Math.abs(diff);
    const formatted = unit === 'min' ? formatMinutes(absDiff) : String(absDiff);
    return (
      <div className={`pokrok-page__delta pokrok-page__delta--${diff > 0 ? 'up' : 'down'}`}>
        {arrow} {diff > 0 ? '+' : '−'}{formatted}
        {suffix && <span className="pokrok-page__delta-suffix"> · {suffix}</span>}
      </div>
    );
  }

  const { currentKP, stats: kpStats } = useKPMeasurements();
  const { records, isLoading: recordsLoading } = usePersonalRecords(userId);

  // Tier check: assume all users can see 'all' + 'week' for now
  // (Full tier gate will be implemented with membership system)
  const isFreeTier = false; // Placeholder — hook into membership check later

  const isPeriodLocked = isFreeTier && period !== 'all';

  const handlePeriodClick = (p: ActivityPeriod, requiresPremium?: boolean) => {
    if (isFreeTier && requiresPremium) return;
    setPeriod(p);
  };

  return (
    <div className="pokrok-page">
      {/* Page header — stejný styl jako .akademie-page-header */}
      <div className="pokrok-page__page-header">
        <h1 className="pokrok-page__page-title">Pokrok</h1>
      </div>

      {/* Period Selector — samostatný blok pod titulkem */}
      <div className="pokrok-page__header">
        <div className="pokrok-page__period-tabs" role="tablist" aria-label="Časové období">
          {PERIOD_TABS.map((tab) => {
            const locked = isFreeTier && tab.requiresPremium;
            return (
              <button
                key={tab.key}
                className={`pokrok-page__period-tab${period === tab.key ? ' pokrok-page__period-tab--active' : ''}`}
                onClick={() => handlePeriodClick(tab.key, tab.requiresPremium)}
                role="tab"
                aria-selected={period === tab.key}
                aria-disabled={locked}
                type="button"
                style={locked ? { opacity: 0.35 } : undefined}
                title={locked ? 'Dostupné ve SMART plánu' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly Dots — current week habit tracker, always visible */}
      <WeeklyDots days={activityGraph} />

      {/* Tier gate for locked periods */}
      {isPeriodLocked && (
        <div className="pokrok-page__tier-gate">
          <p className="pokrok-page__tier-gate-text">
            Detailní statistiky jsou dostupné ve SMART plánu.
          </p>
          <button className="pokrok-page__tier-gate-cta" type="button">
            Zjistit více o SMART
          </button>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="pokrok-page__error">Nepodařilo se načíst statistiky.</div>
      )}

      {/* Hero Row: KP + Streak */}
      <div className="pokrok-page__hero-row">
        {/* KP Card */}
        <div className="pokrok-page__hero-card">
          <div className="pokrok-page__hero-label">Aktuální KP</div>
          {isLoading ? (
            <div className="pokrok-page__skeleton" />
          ) : (
            <div className="pokrok-page__hero-value pokrok-page__hero-value--gold">
              {formatKP(currentKP)}
            </div>
          )}
          {kpStats && kpStats.trend !== 0 && !isLoading && (
            <div className="pokrok-page__hero-sub">
              {kpStats.trend > 0 ? `+${kpStats.trend}s` : `${kpStats.trend}s`} od minulého
            </div>
          )}
        </div>

        {/* Streak Card */}
        <div className="pokrok-page__hero-card">
          <div className="pokrok-page__hero-label">Aktivitní streak</div>
          {isLoading ? (
            <div className="pokrok-page__skeleton" />
          ) : (
            <div className="pokrok-page__hero-value">
              {streak ? streak.currentStreakDays : 0}
            </div>
          )}
          <div className="pokrok-page__hero-sub">
            {streak ? (
              <>
                dní v řadě
                {streak.graceDayUsed && (
                  <span title="Grace day využit"> · grace ✓</span>
                )}
              </>
            ) : (
              'dní v řadě'
            )}
          </div>
        </div>
      </div>

      {/* "Člen X dní" banner — pouze pro Celkem */}
      {period === 'all' && !isLoading && memberDays > 0 && (
        <div className="pokrok-page__member-banner">
          <span className="pokrok-page__member-days">{memberDays}</span>
          <span className="pokrok-page__member-label">
            {memberDays === 1 ? 'den' : memberDays < 5 ? 'dny' : 'dní'} s DechBarem
          </span>
          {registeredAt && (
            <span className="pokrok-page__member-since">
              člen od {new Date(registeredAt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
      )}

      {/* Stats Grid (2×2) */}
      <div className="pokrok-page__stats-grid">
        <div className="pokrok-page__stat-card">
          <div className="pokrok-page__stat-label">Minuty prodýchány</div>
          {isLoading
            ? <div className="pokrok-page__skeleton" />
            : <div className="pokrok-page__stat-value">{formatMinutes(totalMinutes)}</div>
          }
          {renderDelta(totalMinutes, prevTotalMinutes, 'min')}
        </div>

        <div className="pokrok-page__stat-card">
          <div className="pokrok-page__stat-label">Počet aktivit</div>
          {isLoading
            ? <div className="pokrok-page__skeleton" />
            : <div className="pokrok-page__stat-value">{totalActivities}</div>
          }
          {renderDelta(totalActivities, prevTotalActivities, 'count')}
        </div>

        <div className="pokrok-page__stat-card">
          <div className="pokrok-page__stat-label">Aktivní dny</div>
          {isLoading
            ? <div className="pokrok-page__skeleton" />
            : <div className="pokrok-page__stat-value">{activeDays}</div>
          }
          {renderDelta(activeDays, prevActiveDays, 'count')}
        </div>

        <div className="pokrok-page__stat-card">
          <div className="pokrok-page__stat-label">Průměr min/den</div>
          {isLoading
            ? <div className="pokrok-page__skeleton" />
            : <div className="pokrok-page__stat-value">{formatMinutes(averageMinutesPerDay)}</div>
          }
          {renderDelta(averageMinutesPerDay, prevAverageMinutesPerDay, 'min')}
        </div>
      </div>

      {/* Osobní rekordy — always all-time, not dependent on period */}
      {(records || recordsLoading) && (
        <div className="pokrok-page__records">
          <div className="pokrok-page__records-title">Osobní rekordy</div>
          <div className="pokrok-page__records-grid">
            <div className="pokrok-page__record-card">
              <div className="pokrok-page__record-label">Nejdelší streak</div>
              {recordsLoading
                ? <div className="pokrok-page__skeleton pokrok-page__skeleton--sm" />
                : <div className="pokrok-page__record-value">
                    {records?.longestStreak ?? 0}
                    <span className="pokrok-page__record-unit">dní</span>
                  </div>
              }
            </div>
            <div className="pokrok-page__record-card">
              <div className="pokrok-page__record-label">Nejlepší den</div>
              {recordsLoading
                ? <div className="pokrok-page__skeleton pokrok-page__skeleton--sm" />
                : <div className="pokrok-page__record-value">
                    {formatMinutes(records?.bestDayMinutes ?? 0)}
                  </div>
              }
            </div>
            <div className="pokrok-page__record-card">
              <div className="pokrok-page__record-label">Nejdelší sezení</div>
              {recordsLoading
                ? <div className="pokrok-page__skeleton pokrok-page__skeleton--sm" />
                : <div className="pokrok-page__record-value">
                    {formatMinutes(records?.bestSessionMinutes ?? 0)}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap (always last 84 days, regardless of period selector) */}
      <ActivityHeatmap days={activityGraph} isLoading={isLoading} />
    </div>
  );
}
