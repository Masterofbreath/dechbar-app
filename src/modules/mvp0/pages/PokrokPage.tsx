/**
 * PokrokPage — User Progress & Statistics (redesign 2026-03)
 *
 * Nový layout (shora dolů):
 *   1. KP sekce (LungProgress + sparkline + sub-tiles + CTA)
 *   2. Tento týden (WeeklyDots + streak inline)
 *   3. Info row (člen od / celkem nadýcháno)
 *   4. Stats sekce (2-stavový toggle Tento týden / Celkem + 2 karty)
 *   5. Activity heatmap
 *   6. Community milestone
 *
 * @package DechBar_App
 * @subpackage MVP0/Pages
 */

import { useState } from 'react';
import { useUserPokrokStats, getDaysSinceRegistration, useAllTimeMinutes } from '@/platform/analytics';
import { formatMinutes, getActivityLevel } from '@/platform/analytics';
import { usePokrokRealtime } from '@/platform/analytics/hooks/usePokrokRealtime';
import { useKPMeasurements } from '@/platform/api/useKPMeasurements';
import { useAuthStore } from '@/platform/auth';
import { useNavigation } from '@/platform/hooks/useNavigation';
import type { ActivityPeriod, ActivityDayData } from '@/platform/analytics';
import { KPSection } from '@/components/pokrok/KPSection';
import { SmartSection } from '@/components/pokrok/SmartSection';
import '@/styles/pages/pokrok.css';

// ── Prime number milestones (in hours) ──
const PRIME_MILESTONES_H = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
  53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
];

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m} min`;
}

// ── Community Milestone Component ──
function CommunityMilestone() {
  const { minutes, isLoading } = useAllTimeMinutes();
  const currentHours = minutes / 60;

  const reachedIdx = PRIME_MILESTONES_H.filter((h) => h <= currentHours).length - 1;
  const nextMilestoneH = PRIME_MILESTONES_H[reachedIdx + 1] ?? PRIME_MILESTONES_H[reachedIdx] ?? 2;
  const minutesToNext = Math.max(0, Math.round(nextMilestoneH * 60 - minutes));

  const displayStart = Math.max(0, reachedIdx - 1);
  const displayEnd = Math.min(PRIME_MILESTONES_H.length - 1, reachedIdx + 4);
  const visibleMilestones = PRIME_MILESTONES_H.slice(displayStart, displayEnd + 1);

  const minH = visibleMilestones[0] ?? 0;
  const maxH = visibleMilestones[visibleMilestones.length - 1] ?? 1;
  const rangeH = maxH - minH;

  const dotLeftPct = (h: number) =>
    rangeH > 0 ? Math.min(100, Math.max(0, ((h - minH) / rangeH) * 100)) : 0;

  const fillPct = isLoading || rangeH <= 0
    ? 0
    : Math.min(100, Math.max(0, ((currentHours - minH) / rangeH) * 100));

  return (
    <div className="pokrok-page__community">
      <div className="pokrok-page__community-header">
        <span className="pokrok-page__community-title">Dýcháme společně</span>
        <span className="pokrok-page__community-badge">komunita</span>
      </div>

      <div className="pokrok-page__community-total">
        {isLoading
          ? <div className="pokrok-page__skeleton pokrok-page__skeleton--lg" />
          : <span className="pokrok-page__community-value">{formatHours(minutes)}</span>
        }
        <span className="pokrok-page__community-sublabel">oddýcháno celkem členy DechBaru</span>
      </div>

      <div className="pokrok-page__milestone-timeline">
        <div className="pokrok-page__milestone-track">
          <div
            className="pokrok-page__milestone-fill"
            style={{ width: `${fillPct}%` }}
          />
          {visibleMilestones.map((h) => {
            const isReached = h <= currentHours;
            const isNext = h === nextMilestoneH;
            return (
              <div
                key={h}
                className={[
                  'pokrok-page__milestone-dot',
                  isReached ? 'pokrok-page__milestone-dot--reached' : '',
                  isNext ? 'pokrok-page__milestone-dot--next' : '',
                ].filter(Boolean).join(' ')}
                style={{ left: `${dotLeftPct(h)}%` }}
                title={`${h}h`}
              >
                <span className="pokrok-page__milestone-label">{h}h</span>
              </div>
            );
          })}
        </div>
      </div>

      {!isLoading && minutesToNext > 0 && (
        <div className="pokrok-page__milestone-next">
          Dalších <strong>{formatHours(minutesToNext)}</strong> do milníku{' '}
          <strong className="pokrok-page__milestone-next-target">{nextMilestoneH}h</strong>
        </div>
      )}
      {!isLoading && minutesToNext === 0 && (
        <div className="pokrok-page__milestone-next pokrok-page__milestone-next--reached">
          Milník {nextMilestoneH}h dosažen!
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

function buildWeeks(days: ActivityDayData[]): ActivityDayData[][] {
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
  const totalWeeks = weeks.length;

  return (
    <div className="pokrok-page__graph-section">
      <div className="pokrok-page__graph-title">Aktivita — posledních 24 týdnů</div>
      <div className="pokrok-page__graph-wrap">
        <div className="pokrok-page__graph-grid">
          {isLoading
            ? Array.from({ length: totalWeeks || 24 }).map((_, wi) => (
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

// ── Weekly Dots ──

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function WeeklyDots({ days }: { days: ActivityDayData[] }) {
  const DOW_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() + mondayOffset);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const graphDay = days.find((g) => g.date === dateStr);
    const isToday = dateStr === todayStr;
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

// ── Coming Soon Section ──

type ComingSoonTab = 'komunita' | 'top10';

function ComingSoonSection({ tab }: { tab: ComingSoonTab }) {
  return (
    <div className="pokrok-page">
      <div className="pokrok-page__coming-soon">
        <div className="pokrok-page__coming-soon-icon">
          {tab === 'komunita' ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          )}
        </div>
        <p className="pokrok-page__coming-soon-title">
          {tab === 'komunita' ? 'Komunita se rozdýchává' : 'Žebříček přichází'}
        </p>
        <p className="pokrok-page__coming-soon-text">
          {tab === 'komunita'
            ? 'Brzy se budeš moci porovnat a inspirovat ostatními DechBar uživateli.'
            : 'Nejlepší dýchači DechBaru se brzy setkají na jednom místě.'}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──

const SIMPLE_TABS: { key: ActivityPeriod; label: string }[] = [
  { key: 'day',   label: 'Dnes' },
  { key: 'week',  label: 'Týden' },
  { key: 'month', label: 'Měsíc' },
];

function formatStreak(days: number): string | null {
  if (days <= 1) return null;
  if (days < 5) return `${days} dny v řadě`;
  return `${days} dnů v řadě`;
}

export function PokrokPage() {
  const [period, setPeriod] = useState<ActivityPeriod>('day');
  const [pokrokTab, setPokrokTab] = useState<'prehled' | 'komunita' | 'top10'>('prehled');
  const userId = useAuthStore((s) => s.user?.id);
  const { openKPDetail } = useNavigation();

  // Real-time invalidace při změně session
  usePokrokRealtime(userId);

  // Prefetch všech tří period
  useUserPokrokStats(userId, 'day');
  useUserPokrokStats(userId, 'week');
  useUserPokrokStats(userId, 'month');

  const { totalMinutes, totalActivities, registeredAt,
          prevTotalMinutes, prevTotalActivities,
          averageMinutesPerDay, prevAverageMinutesPerDay,
          streak, activityGraph, isLoading, error } =
    useUserPokrokStats(userId, period);

  const { totalMinutes: allTimeTotalMinutes, totalActivities: allTimeTotalActivities, isLoading: allTimeLoading } =
    useUserPokrokStats(userId, 'all');

  const memberDays = getDaysSinceRegistration(registeredAt ?? undefined);

  // KP data
  const { currentKP, bestKP, baselineKP, totalMeasurements, measurements, stats: kpStats, isLoading: kpLoading } =
    useKPMeasurements();

  // Delta
  const deltaPeriodSuffix: Record<string, string> = {
    day:   'min. den',
    week:  'min. týden',
    month: 'min. měsíc',
  };

  function renderDelta(current: number, prev: number | null, unit: 'min' | 'count') {
    if (prev === null || isLoading) return null;
    const diff = Math.round((current - prev) * 10) / 10;
    const suffix = deltaPeriodSuffix[period] ?? '';
    if (diff === 0) return (
      <div className="pokrok-page__delta pokrok-page__delta--neutral">— stejně{suffix ? ` · ${suffix}` : ''}</div>
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

  return (
    <>
      {/* Sticky header — title + tab navigation together */}
      <div className="pokrok-page__sticky-header">
        <div className="pokrok-page__page-header">
          <h1 className="pokrok-page__page-title">Pokrok</h1>
        </div>

        {/* Tab navigation */}
        <div className="pokrok-page__tabs" role="tablist" aria-label="Sekce pokroku">
          {[
            { key: 'prehled',  label: 'Přehled' },
            { key: 'komunita', label: 'Komunita' },
            { key: 'top10',    label: 'TOP10' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`pokrok-page__tab${pokrokTab === tab.key ? ' pokrok-page__tab--active' : ''}`}
              onClick={() => {
                setPokrokTab(tab.key as 'prehled' | 'komunita' | 'top10');
                document.querySelector('.tab-carousel__page:nth-child(4)')?.scrollTo({ top: 0, behavior: 'instant' });
              }}
              role="tab"
              aria-selected={pokrokTab === tab.key}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Všechny 3 taby vždy v DOM — přepínání jen přes CSS (stejná logika jako ExerciseList) */}

      {/* Komunita — coming soon */}
      <div className={`pokrok-page__tab-panel${pokrokTab !== 'komunita' ? ' pokrok-page__tab-panel--hidden' : ''}`}>
        <ComingSoonSection tab="komunita" />
      </div>

      {/* TOP10 — coming soon */}
      <div className={`pokrok-page__tab-panel${pokrokTab !== 'top10' ? ' pokrok-page__tab-panel--hidden' : ''}`}>
        <ComingSoonSection tab="top10" />
      </div>

      {/* Přehled — hlavní obsah */}
      <div className={`pokrok-page__tab-panel${pokrokTab !== 'prehled' ? ' pokrok-page__tab-panel--hidden' : ''}`}>
      <div className="pokrok-page">

        {/* 1. KP Sekce */}
        <div className="pokrok-page__section-gap">
          <KPSection
            currentKP={currentKP}
            bestKP={bestKP}
            baselineKP={baselineKP}
            totalMeasurements={totalMeasurements}
            measurements={measurements}
            trend={kpStats?.trend ?? 0}
            isLoading={kpLoading}
            registeredAt={registeredAt}
            onOpenKPCenter={openKPDetail}
          />
        </div>

        {/* 1b. SMART Sekce */}
        <div className="pokrok-page__section-gap">
          <SmartSection
            userId={userId}
            latestKP={currentKP}
            onMeasureKP={openKPDetail}
          />
        </div>

        {/* 2. Tento týden — WeeklyDots + streak inline */}
        <div className="pokrok-page__week-section pokrok-page__section-gap">
          <div className="pokrok-page__week-section-header">
            <span className="pokrok-page__week-section-title">Tento týden</span>
          </div>
          <WeeklyDots days={activityGraph} />
          {streak && formatStreak(streak.currentStreakDays) && (
            <div className="pokrok-page__streak-inline">
              <span className="pokrok-page__streak-dot" />
              {formatStreak(streak.currentStreakDays)}
            </div>
          )}
        </div>

        {/* 3. Info row — 3 statsy v jednom řádku */}
        <div className="pokrok-page__info-row pokrok-page__info-row--3col pokrok-page__section-gap">
          <div className="pokrok-page__info-tile">
            <div className="pokrok-page__info-tile-value pokrok-page__info-tile-value--gold">
              {memberDays}
            </div>
            <div className="pokrok-page__info-tile-label">
              {memberDays === 1 ? 'den' : memberDays < 5 ? 'dny' : 'dní'} s DechBarem
            </div>
          </div>
          <div className="pokrok-page__info-tile pokrok-page__info-tile--border">
            {allTimeLoading
              ? <div className="pokrok-page__skeleton" />
              : <div className="pokrok-page__info-tile-value">{formatHours(allTimeTotalMinutes)}</div>
            }
            <div className="pokrok-page__info-tile-label">Celkem nadýcháno</div>
          </div>
          <div className="pokrok-page__info-tile pokrok-page__info-tile--border">
            {allTimeLoading
              ? <div className="pokrok-page__skeleton" />
              : <div className="pokrok-page__info-tile-value">{allTimeTotalActivities}</div>
            }
            <div className="pokrok-page__info-tile-label">Aktivit celkem</div>
          </div>
        </div>

        {/* 4. Stats sekce — 2-stavový toggle + 2 karty */}
        <div className="pokrok-page__stats-section pokrok-page__section-gap">
          {/* 2-stavový toggle */}
          <div className="pokrok-page__simple-toggle" role="tablist" aria-label="Časové období">
            {SIMPLE_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`pokrok-page__simple-tab${period === tab.key ? ' pokrok-page__simple-tab--active' : ''}`}
                onClick={() => setPeriod(tab.key)}
                role="tab"
                aria-selected={period === tab.key}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && !isLoading && (
            <div className="pokrok-page__error">Nepodařilo se načíst statistiky.</div>
          )}

          {/* 4 stat karty */}
          <div className="pokrok-page__stats-grid pokrok-page__stats-grid--2col">
            <div className="pokrok-page__stat-card">
              <div className="pokrok-page__stat-label">Nadýcháno</div>
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
              <div className="pokrok-page__stat-label">Denní průměr</div>
              {isLoading
                ? <div className="pokrok-page__skeleton" />
                : <div className="pokrok-page__stat-value">{formatMinutes(Math.round(averageMinutesPerDay))}</div>
              }
              {renderDelta(averageMinutesPerDay, prevAverageMinutesPerDay, 'min')}
            </div>

            <div className="pokrok-page__stat-card">
              <div className="pokrok-page__stat-label">Aktivní streak</div>
              {isLoading
                ? <div className="pokrok-page__skeleton" />
                : <div className="pokrok-page__stat-value">
                    {streak?.currentStreakDays ?? 0}
                    <span className="pokrok-page__stat-unit">dní</span>
                  </div>
              }
              {streak && streak.longestStreakDays > 0 && (
                <div className="pokrok-page__delta pokrok-page__delta--neutral">
                  max {streak.longestStreakDays} dní
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Activity Heatmap */}
        <ActivityHeatmap days={activityGraph} isLoading={isLoading} />

        {/* 6. Community Milestone — úplně dole */}
        <CommunityMilestone />

      </div>
      </div> {/* end prehled tab panel */}
    </>
  );
}
