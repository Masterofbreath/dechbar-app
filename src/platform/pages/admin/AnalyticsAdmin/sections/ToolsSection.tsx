/**
 * ToolsSection — přehled využití nástrojů pro AnalyticsAdmin
 *
 * Zobrazuje:
 *   - KPI grid (4 karty): SMART / Trůn / Preset / Audio — all-time + period čísla
 *   - Detail bloky 2×2: SMART detail, Trůn detail, Preset detail, Audio detail
 *
 * Data:
 *   - useToolsStats(period)      — počty sezení, completion rates, avg časy
 *   - useToolsLevelStats()       — all-time level distribuce, top preset cvičení
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/sections
 */

import { useToolsStats, useToolsLevelStats, formatMinutes } from '@/platform/analytics';
import type { DashboardPeriod, LevelDistribution } from '@/platform/analytics';
import { formatNumber } from '../utils/formatters';

interface ToolsSectionProps {
  period: DashboardPeriod;
}

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today:     'dnes',
  yesterday: 'včera',
  week:      'tento týden',
  month:     'tento měsíc',
  year:      'letos',
};

function CompletionBar({ rate }: { rate: number }) {
  return (
    <div className="analytics-admin__completion-bar-wrap">
      <div className="analytics-admin__completion-bar-bg">
        <div
          className="analytics-admin__completion-bar-fill"
          style={{ width: `${rate}%` }}
        />
      </div>
      <span className="analytics-admin__completion-pct">{rate}%</span>
    </div>
  );
}

function LevelTable({ levels, emptyLabel }: { levels: LevelDistribution[]; emptyLabel: string }) {
  if (levels.length === 0) {
    return <div className="analytics-admin__empty" style={{ fontSize: 12 }}>{emptyLabel}</div>;
  }
  return (
    <table className="analytics-admin__level-table">
      <thead>
        <tr>
          <th>Level</th>
          <th>Uživatelé</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {levels.map((row) => (
          <tr key={row.level}>
            <td>{row.level}</td>
            <td>{row.count}</td>
            <td>
              <div className="analytics-admin__level-bar-wrap">
                <div
                  className="analytics-admin__level-bar-fill"
                  style={{ width: `${row.pct}%` }}
                />
                <span>{row.pct}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ToolsSection({ period }: ToolsSectionProps) {
  const { smart, tron, preset, audio, isLoading: statsLoading } = useToolsStats(period);
  const { smartActiveUsers, smartLevels, tronLevels, topPresetExercises, isLoading: levelsLoading } = useToolsLevelStats();

  const periodLabel = PERIOD_LABEL[period];
  const isLoading = statsLoading || levelsLoading;

  return (
    <div className="analytics-admin__tools-section">
      <div className="analytics-admin__section-label" style={{ marginTop: 0 }}>Nástroje</div>

      {/* ── KPI grid — 4 nástroje ── */}
      <div className="analytics-admin__kpi-grid analytics-admin__kpi-grid--4">

        {/* SMART */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">SMART cvičení</div>
          {isLoading ? (
            <div className="analytics-admin__skeleton" />
          ) : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(smart.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatNumber(smart.periodCount)} {periodLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Trůn */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Cesta na Trůn</div>
          {isLoading ? (
            <div className="analytics-admin__skeleton" />
          ) : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(tron.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatNumber(tron.periodCount)} {periodLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Preset */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Cvičení & protokoly</div>
          {isLoading ? (
            <div className="analytics-admin__skeleton" />
          ) : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(preset.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatNumber(preset.periodCount)} {periodLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Audio */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Akademie audio</div>
          {isLoading ? (
            <div className="analytics-admin__skeleton" />
          ) : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(audio.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {formatNumber(audio.periodCount)} {periodLabel}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Detail bloky řada 1: SMART + Trůn ── */}
      <div className="analytics-admin__tools-detail-grid">

        {/* SMART detail */}
        <div className="analytics-admin__tools-detail-block">
          <div className="analytics-admin__tools-detail-title">SMART cvičení — detail</div>

          <div className="analytics-admin__tools-stats-row">
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Aktivní uživatelé</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : formatNumber(smartActiveUsers)}
              </span>
              <span className="analytics-admin__tools-stat-sub">is_ready = true</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading ? (
                <span className="analytics-admin__tools-stat-value">—</span>
              ) : (
                <CompletionBar rate={smart.completionRate} />
              )}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : smart.avgMinutesCompleted > 0 ? `${smart.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Distribuce levelů</div>
          {levelsLoading ? (
            <div className="analytics-admin__skeleton" style={{ height: 80 }} />
          ) : (
            <LevelTable levels={smartLevels} emptyLabel="Zatím žádná SMART data" />
          )}
        </div>

        {/* Trůn detail */}
        <div className="analytics-admin__tools-detail-block">
          <div className="analytics-admin__tools-detail-title">Cesta na Trůn — detail</div>

          <div className="analytics-admin__tools-stats-row">
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Aktivní uživatelé ({periodLabel})</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : formatNumber(tron.activeUsersInPeriod)}
              </span>
              <span className="analytics-admin__tools-stat-sub">≥ 1 Trůn sezení</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading ? (
                <span className="analytics-admin__tools-stat-value">—</span>
              ) : (
                <CompletionBar rate={tron.completionRate} />
              )}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : tron.avgMinutesCompleted > 0 ? `${tron.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Distribuce levelů</div>
          {levelsLoading ? (
            <div className="analytics-admin__skeleton" style={{ height: 80 }} />
          ) : (
            <LevelTable levels={tronLevels} emptyLabel="Zatím žádná Trůn data" />
          )}
        </div>
      </div>

      {/* ── Detail bloky řada 2: Preset + Audio ── */}
      <div className="analytics-admin__tools-detail-grid">

        {/* Preset detail */}
        <div className="analytics-admin__tools-detail-block">
          <div className="analytics-admin__tools-detail-title">Cvičení & protokoly — detail</div>

          <div className="analytics-admin__tools-stats-row">
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading ? (
                <span className="analytics-admin__tools-stat-value">—</span>
              ) : (
                <CompletionBar rate={preset.completionRate} />
              )}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : preset.avgMinutesCompleted > 0 ? `${preset.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Top 5 cvičení (celkem)</div>
          {levelsLoading ? (
            <div className="analytics-admin__skeleton" style={{ height: 100 }} />
          ) : topPresetExercises.length === 0 ? (
            <div className="analytics-admin__empty" style={{ fontSize: 12 }}>Zatím žádná preset data</div>
          ) : (
            <table className="analytics-admin__table analytics-admin__level-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cvičení</th>
                  <th>Sezení</th>
                  <th>Dokončení</th>
                </tr>
              </thead>
              <tbody>
                {topPresetExercises.map((ex, i) => (
                  <tr key={ex.exerciseId}>
                    <td style={{ color: 'rgba(255,255,255,0.3)', width: 24 }}>{i + 1}</td>
                    <td>{ex.name}</td>
                    <td>{ex.count}</td>
                    <td>
                      <CompletionBar rate={ex.completionRate} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Audio detail */}
        <div className="analytics-admin__tools-detail-block">
          <div className="analytics-admin__tools-detail-title">Akademie audio — detail</div>

          <div className="analytics-admin__tools-stats-row">
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Minuty poslech ({periodLabel})</span>
              <span className="analytics-admin__tools-stat-value analytics-admin__tools-stat-value--gold">
                {isLoading ? '—' : formatMinutes(audio.periodMinutes)}
              </span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading ? (
                <span className="analytics-admin__tools-stat-value">—</span>
              ) : (
                <CompletionBar rate={audio.completionRate} />
              )}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                Top lekce → viz sekce Obsah výše
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
