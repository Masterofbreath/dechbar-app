/**
 * ToolsSection — přehled využití nástrojů pro AnalyticsAdmin (v2)
 *
 * Zobrazuje:
 *   - KPI grid (4 karty): SMART / Trůn / Preset / Audio
 *       all-time číslo + period číslo + delta vs. předchozí perioda + % podíl z celku
 *   - Cross-tool banner: kolik uživatelů použilo 2+ nástroje
 *   - SMART detail: aktivní uživatelé (2 metriky), completion rate, avg čas,
 *       progression (% postoupili level za 14 dní), level distribuce
 *   - Trůn detail: aktivní uživatelé, completion rate, avg čas, level distribuce
 *       (guard když Trůn ještě nebyl spuštěn)
 *   - Preset detail: completion rate, avg čas, Top 5 cvičení
 *   - Audio detail: minuty, unikátní posluchači, completion rate
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin/sections
 */

import { useToolsStats, useToolsLevelStats, formatMinutes } from '@/platform/analytics';
import type { DashboardPeriod, LevelDistribution } from '@/platform/analytics';
import { formatNumber, getDelta } from '../utils/formatters';

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

const PREV_PERIOD_LABEL: Record<DashboardPeriod, string> = {
  today:     'včera',
  yesterday: 'předevčírem',
  week:      'min. týden',
  month:     'min. měsíc',
  year:      'min. rok',
};

// ── Sdílené sub-komponenty ──────────────────────────────────────────────────

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

function DeltaBadge({ delta }: { delta: ReturnType<typeof getDelta> }) {
  if (!delta.label) return null;
  return (
    <span className={`analytics-admin__kpi-delta analytics-admin__kpi-delta--${delta.dir}`}>
      {delta.label}
    </span>
  );
}

function ShareBadge({ pct }: { pct: number }) {
  if (pct === 0) return null;
  return (
    <span className="analytics-admin__tools-share-badge">
      {pct}% z celku
    </span>
  );
}

function LevelTable({ levels, emptyLabel, hasData }: {
  levels: LevelDistribution[];
  emptyLabel: string;
  hasData?: boolean;
}) {
  if (hasData === false) {
    return (
      <div className="analytics-admin__tools-not-launched">
        <span className="analytics-admin__tools-not-launched-icon">⏳</span>
        <span>{emptyLabel}</span>
      </div>
    );
  }
  if (levels.length === 0) {
    return <div className="analytics-admin__empty" style={{ fontSize: 12, padding: '12px 0' }}>{emptyLabel}</div>;
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

// ── Hlavní komponenta ───────────────────────────────────────────────────────

export function ToolsSection({ period }: ToolsSectionProps) {
  const {
    smart, tron, preset, audio, crossToolUsers, isLoading: statsLoading,
  } = useToolsStats(period);
  const {
    smartActiveUsers, smartActive7d, smartProgressedPct,
    smartLevels, tronLevels, tronHasData, topPresetExercises,
    isLoading: levelsLoading,
  } = useToolsLevelStats();

  const periodLabel = PERIOD_LABEL[period];
  const prevLabel   = PREV_PERIOD_LABEL[period];
  const isLoading   = statsLoading || levelsLoading;

  // Delta výpočty
  const smartDelta  = getDelta(smart.periodCount,  smart.prevPeriodCount,  'count', prevLabel);
  const tronDelta   = getDelta(tron.periodCount,   tron.prevPeriodCount,   'count', prevLabel);
  const presetDelta = getDelta(preset.periodCount, preset.prevPeriodCount, 'count', prevLabel);
  const audioDelta  = getDelta(audio.periodCount,  audio.prevPeriodCount,  'count', prevLabel);

  return (
    <div className="analytics-admin__tools-section">
      <div className="analytics-admin__section-label" style={{ marginTop: 0 }}>Nástroje</div>

      {/* ── KPI grid — 4 nástroje ── */}
      <div className="analytics-admin__kpi-grid analytics-admin__kpi-grid--4">

        {/* SMART */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">SMART cvičení</div>
          {isLoading ? <div className="analytics-admin__skeleton" /> : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(smart.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel">
                  {formatNumber(smart.periodCount)} {periodLabel}
                </span>
                <DeltaBadge delta={smartDelta} />
                <ShareBadge pct={smart.sharePct} />
              </div>
            </>
          )}
        </div>

        {/* Trůn */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Cesta na Trůn</div>
          {isLoading ? <div className="analytics-admin__skeleton" /> : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(tron.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel">
                  {formatNumber(tron.periodCount)} {periodLabel}
                </span>
                <DeltaBadge delta={tronDelta} />
                <ShareBadge pct={tron.sharePct} />
              </div>
            </>
          )}
        </div>

        {/* Preset */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Cvičení & protokoly</div>
          {isLoading ? <div className="analytics-admin__skeleton" /> : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(preset.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel">
                  {formatNumber(preset.periodCount)} {periodLabel}
                </span>
                <DeltaBadge delta={presetDelta} />
                <ShareBadge pct={preset.sharePct} />
              </div>
            </>
          )}
        </div>

        {/* Audio */}
        <div className="analytics-admin__kpi-card">
          <div className="analytics-admin__kpi-label">Akademie audio</div>
          {isLoading ? <div className="analytics-admin__skeleton" /> : (
            <>
              <div className="analytics-admin__kpi-value">{formatNumber(audio.allTimeCount)}</div>
              <div className="analytics-admin__kpi-meta">
                <span className="analytics-admin__kpi-sublabel">sezení celkem</span>
                <span className="analytics-admin__kpi-sublabel">
                  {formatNumber(audio.periodCount)} {periodLabel}
                </span>
                <DeltaBadge delta={audioDelta} />
                <ShareBadge pct={audio.sharePct} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Cross-tool banner ── */}
      {!isLoading && (
        <div className="analytics-admin__tools-cross-banner">
          <span className="analytics-admin__tools-cross-icon">🔀</span>
          <div>
            <span className="analytics-admin__tools-cross-value">{formatNumber(crossToolUsers)}</span>
            <span className="analytics-admin__tools-cross-label">
              {' '}uživatelů použilo 2+ nástroje {periodLabel}
            </span>
          </div>
          <span className="analytics-admin__tools-cross-hint">
            Multi-tool uživatelé mají nižší churn risk
          </span>
        </div>
      )}

      {/* ── Detail bloky řada 1: SMART + Trůn ── */}
      <div className="analytics-admin__tools-detail-grid">

        {/* SMART detail */}
        <div className="analytics-admin__tools-detail-block">
          <div className="analytics-admin__tools-detail-title">SMART cvičení — detail</div>

          <div className="analytics-admin__tools-stats-row">
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Aktivní uživatelé (is_ready)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : formatNumber(smartActiveUsers)}
              </span>
              <span className="analytics-admin__tools-stat-sub">SMART engine konfigurovaný</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Cvičili SMART (posl. 7 dní)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : formatNumber(smartActive7d)}
              </span>
              <span className="analytics-admin__tools-stat-sub">reálná aktivita</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Postoupili level (14 dní)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : `${smartProgressedPct}%`}
              </span>
              <span className="analytics-admin__tools-stat-sub">z uživatelů se SMART</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading
                ? <span className="analytics-admin__tools-stat-value">—</span>
                : <CompletionBar rate={smart.completionRate} />}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : smart.avgMinutesCompleted > 0 ? `${smart.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Distribuce levelů (all-time)</div>
          {levelsLoading
            ? <div className="analytics-admin__skeleton" style={{ height: 80 }} />
            : <LevelTable levels={smartLevels} emptyLabel="Zatím žádná SMART data" />}
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
              {isLoading
                ? <span className="analytics-admin__tools-stat-value">—</span>
                : <CompletionBar rate={tron.completionRate} />}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : tron.avgMinutesCompleted > 0 ? `${tron.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Distribuce levelů (all-time)</div>
          {levelsLoading
            ? <div className="analytics-admin__skeleton" style={{ height: 80 }} />
            : <LevelTable
                levels={tronLevels}
                emptyLabel="Trůn ještě nebyl spuštěn — žádná data"
                hasData={tronHasData}
              />}
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
              {isLoading
                ? <span className="analytics-admin__tools-stat-value">—</span>
                : <CompletionBar rate={preset.completionRate} />}
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Avg čas (dokončená)</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : preset.avgMinutesCompleted > 0 ? `${preset.avgMinutesCompleted} min` : '—'}
              </span>
            </div>
          </div>

          <div className="analytics-admin__tools-detail-subtitle">Top 5 cvičení (all-time)</div>
          {levelsLoading
            ? <div className="analytics-admin__skeleton" style={{ height: 100 }} />
            : topPresetExercises.length === 0
              ? <div className="analytics-admin__empty" style={{ fontSize: 12, padding: '12px 0' }}>Zatím žádná preset data</div>
              : (
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
                        <td><CompletionBar rate={ex.completionRate} /></td>
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
              <span className="analytics-admin__tools-stat-label">Minuty poslechu ({periodLabel})</span>
              <span className="analytics-admin__tools-stat-value analytics-admin__tools-stat-value--gold">
                {isLoading ? '—' : formatMinutes(audio.periodMinutes)}
              </span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Unikátní posluchači ({periodLabel})</span>
              <span className="analytics-admin__tools-stat-value">
                {isLoading ? '—' : formatNumber(audio.uniqueListenersInPeriod)}
              </span>
              <span className="analytics-admin__tools-stat-sub">různých uživatelů</span>
            </div>
            <div className="analytics-admin__tools-stat">
              <span className="analytics-admin__tools-stat-label">Dokončení ({periodLabel})</span>
              {isLoading
                ? <span className="analytics-admin__tools-stat-value">—</span>
                : <CompletionBar rate={audio.completionRate} />}
            </div>
            <div className="analytics-admin__tools-stat" style={{ opacity: 0.4 }}>
              <span className="analytics-admin__tools-stat-label" style={{ fontSize: 11 }}>
                Top lekce → viz sekce Obsah výše
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
