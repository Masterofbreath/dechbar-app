/**
 * ActivityChartsSection — Prime Time + Den v týdnu vedle sebe
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/sections
 */

import { useState } from 'react';
import { usePrimeTime, useDayOfWeek } from '@/platform/analytics';
import type { PrimeTimeSlot, DayOfWeekSlot } from '@/platform/analytics';

// ── Prime Time Chart ─────────────────────────────────────────────────────

function PrimeTimeChart({ slots, peakHour, isLoading }: { slots: PrimeTimeSlot[]; peakHour: number | null; isLoading: boolean }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

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

// ── Day of Week Chart ────────────────────────────────────────────────────

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

// ── ActivityChartsSection ────────────────────────────────────────────────

export function ActivityChartsSection() {
  const { slots: primeSlots, peakHour, isLoading: primeLoading } = usePrimeTime();
  const { slots: dowSlots, peakDay, peakDayLabel, isLoading: dowLoading } = useDayOfWeek();

  return (
    <div className="analytics-admin__row-2col analytics-admin__row-2col--charts">
      <PrimeTimeChart slots={primeSlots} peakHour={peakHour} isLoading={primeLoading} />
      <DayOfWeekChart slots={dowSlots} peakDay={peakDay} peakDayLabel={peakDayLabel} isLoading={dowLoading} />
    </div>
  );
}
