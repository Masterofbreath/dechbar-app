/**
 * KPDistributionBlock — Admin KP Distribution Chart Block
 *
 * Zobrazuje distribuci kontrolních pauz uživatelů v admin analytice.
 * - Coverage tiles (kolik uživatelů si změřilo KP)
 * - Inline SVG histogram (10 bucketů po 5s + 41–60s + 60s+, milníkové čáry, průměr)
 * - Empty state (ikona plic + text)
 * - Loading state (skeleton)
 *
 * Style: Apple Premium, dark theme, BEM CSS, no Tailwind, no external chart libs.
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/AnalyticsAdmin
 */

import type { KPBucket, KPCoverage } from '@/platform/analytics';
import './KPDistributionBlock.css';

// ── Konstanty milníků (fixní — vědecké/produktové hodnoty) ───

const KP_MILESTONE_SOCIETY    = 13;  // Průměr moderní společnosti (celosvětový)
const KP_MILESTONE_FUNCTIONAL = 25;  // První funkčnost dýchacího systému
const KP_MILESTONE_GOAL       = 40;  // Cílová destinace DechBar

// ── SVG layout konstanty ──────────────────────────────────────
// 10 bucketů: 1–5, 6–10, 11–15, 16–20, 21–25, 26–30, 31–35, 36–40, 41–60, 60s+
// Milestone čáry mapovány na rozsah 0–60s (x = value/60 * SVG_WIDTH)

const SVG_WIDTH      = 700;  // širší pro 10 sloupců
const SVG_HEIGHT     = 160;
const BAR_AREA_H     = 110; // výška sloupců
const LABEL_AREA_H   = 30;  // prostor pod sloupci pro labely
const CHART_TOP_PAD  = 20;  // prostor nahoře pro hodnoty nad sloupci
const BAR_GAP        = 8;   // menší gap pro více sloupců

// x pozice levého okraje bucketu (indexováno 0..n-1), dynamicky dle počtu bucketů
function barX(i: number, nBuckets: number): number {
  const barW = (SVG_WIDTH - BAR_GAP * (nBuckets + 1)) / nBuckets;
  return BAR_GAP * (i + 1) + barW * i;
}

// šířka jednoho sloupce — dynamicky dle počtu bucketů
function barWidth(nBuckets: number): number {
  return (SVG_WIDTH - BAR_GAP * (nBuckets + 1)) / nBuckets;
}

// x pozice milestone čáry — mapujeme 0–60s na celou šířku grafu
// Bucket 60s+ začíná na 60 → milestones vykreslujeme v rozsahu 0–60s
function milestoneX(seconds: number): number {
  return Math.min(seconds / 60, 1) * SVG_WIDTH;
}

// ── Ikona plic (custom SVG) ───────────────────────────────────

function LungsIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      className="kp-distribution__empty-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Trachea */}
      <path d="M12 4v4" />
      {/* Levá plíce */}
      <path d="M12 8C12 8 9 9 7 11c-2 2-3 5-2 8 .5 1.5 2 2 3 1.5L10 19v-6" />
      {/* Pravá plíce */}
      <path d="M12 8c0 0 3 1 5 3 2 2 3 5 2 8-.5 1.5-2 2-3 1.5L14 19v-6" />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface KPDistributionBlockProps {
  distribution: KPBucket[];
  coverage: KPCoverage | null;
  isLoading: boolean;
}

// ── Komponenta ────────────────────────────────────────────────

export function KPDistributionBlock({ distribution, coverage, isLoading }: KPDistributionBlockProps) {
  const measuredCount    = coverage?.measured_count      ?? 0;
  const notMeasuredCount = coverage?.not_measured_count  ?? 0;
  const coveragePct      = coverage?.coverage_pct        ?? 0;
  const overallMedian    = coverage?.overall_median_seconds ?? null;

  // Nejvyšší počet uživatelů v bucketu — pro normalizaci výšky sloupců
  const maxUserCount = distribution.length > 0
    ? Math.max(...distribution.map((b) => b.user_count))
    : 1;

  // Index nejplnějšího bucketu (gold barva)
  const peakIndex = distribution.length > 0
    ? distribution.reduce((maxI, b, i) => b.user_count > distribution[maxI].user_count ? i : maxI, 0)
    : -1;

  // Render loading state
  if (isLoading) {
    return (
      <div className="kp-distribution">
        <div className="kp-distribution__header">
          <div className="kp-distribution__title-row">
            <span className="kp-distribution__title">Distribuce KP</span>
          </div>
        </div>
        <div className="kp-distribution__chart-loading">
          <div className="analytics-admin__skeleton" style={{ height: 20, width: '40%' }} />
          <div className="analytics-admin__skeleton" style={{ height: 120, width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="kp-distribution">
      {/* ── Header ── */}
      <div className="kp-distribution__header">
        <div className="kp-distribution__title-row">
          <span className="kp-distribution__title">Distribuce KP</span>
          {measuredCount > 0 && (
            <span className="kp-distribution__badge">{measuredCount} změřeno</span>
          )}
        </div>

        {/* Milníková legenda */}
        <div className="kp-distribution__legend">
          <span className="kp-distribution__legend-item kp-distribution__legend-item--society">
            <span className="kp-distribution__legend-dot" />
            Průměr spol. {KP_MILESTONE_SOCIETY} s
          </span>
          <span className="kp-distribution__legend-item kp-distribution__legend-item--functional">
            <span className="kp-distribution__legend-dot" />
            První funkčnost {KP_MILESTONE_FUNCTIONAL} s
          </span>
          <span className="kp-distribution__legend-item kp-distribution__legend-item--goal">
            <span className="kp-distribution__legend-dot" />
            Cíl DechBar {KP_MILESTONE_GOAL} s
          </span>
        </div>
      </div>

      {/* ── Coverage tiles ── */}
      <div className="kp-distribution__tiles">
        <div className="kp-distribution__tile">
          <span className="kp-distribution__tile-value kp-distribution__tile-value--teal">
            {measuredCount}
          </span>
          <span className="kp-distribution__tile-label">členů změřilo KP</span>
        </div>
        <div className="kp-distribution__tile">
          <span className="kp-distribution__tile-value">
            {notMeasuredCount}
          </span>
          <span className="kp-distribution__tile-label">ještě nezměřilo</span>
        </div>
        <div className="kp-distribution__tile">
          <span className="kp-distribution__tile-value kp-distribution__tile-value--gold">
            {coveragePct} %
          </span>
          <span className="kp-distribution__tile-label">coverage</span>
        </div>
      </div>

      {/* ── Histogram nebo empty state ── */}
      {distribution.length === 0 ? (
        <div className="kp-distribution__empty">
          <LungsIcon size={48} />
          <span>Zatím žádná měření</span>
        </div>
      ) : (
        <svg
          className="kp-distribution__chart"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Histogram distribuce kontrolní pauzy uživatelů"
          role="img"
        >
          {/* ── Milestone dashed čáry (za sloupci, aby nebyly překryty) ── */}

          {/* 13s — průměr společnosti (šedá) */}
          <line
            x1={milestoneX(KP_MILESTONE_SOCIETY)}
            y1={CHART_TOP_PAD}
            x2={milestoneX(KP_MILESTONE_SOCIETY)}
            y2={BAR_AREA_H + CHART_TOP_PAD}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />

          {/* 25s — první funkčnost (teal) */}
          <line
            x1={milestoneX(KP_MILESTONE_FUNCTIONAL)}
            y1={CHART_TOP_PAD}
            x2={milestoneX(KP_MILESTONE_FUNCTIONAL)}
            y2={BAR_AREA_H + CHART_TOP_PAD}
            stroke="#2CBEC6"
            strokeWidth={1}
            strokeDasharray="4,3"
          />

          {/* 40s — cíl DechBar (gold) */}
          <line
            x1={milestoneX(KP_MILESTONE_GOAL)}
            y1={CHART_TOP_PAD}
            x2={milestoneX(KP_MILESTONE_GOAL)}
            y2={BAR_AREA_H + CHART_TOP_PAD}
            stroke="#D6A23A"
            strokeWidth={1}
            strokeDasharray="4,3"
          />

          {/* ── Sloupce bucketů ── */}
          {distribution.map((bucket, i) => {
            const nBuckets   = distribution.length;
            const BAR_W      = barWidth(nBuckets);
            const heightPct  = maxUserCount > 0 ? bucket.user_count / maxUserCount : 0;
            const barH       = Math.max(heightPct * BAR_AREA_H, bucket.user_count > 0 ? 3 : 0);
            const x          = barX(i, nBuckets);
            const y          = CHART_TOP_PAD + BAR_AREA_H - barH;
            const isPeak     = i === peakIndex;
            const fill       = isPeak ? '#D6A23A' : 'rgba(44,190,198,0.65)';
            const labelY     = SVG_HEIGHT - LABEL_AREA_H + 13;
            const subLabelY  = SVG_HEIGHT - LABEL_AREA_H + 24;
            const centerX    = x + BAR_W / 2;

            return (
              <g key={bucket.bucket_label}>
                {/* Sloupec */}
                <rect
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  fill={fill}
                  rx={3}
                  title={`${bucket.bucket_label}: ${bucket.user_count} uživatelů · ø ${bucket.avg_seconds} s`}
                >
                  <title>{`${bucket.bucket_label}: ${bucket.user_count} uživatelů · ø ${bucket.avg_seconds} s`}</title>
                </rect>

                {/* Počet uživatelů nad sloupcem */}
                {bucket.user_count > 0 && (
                  <text
                    x={centerX}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize={9}
                    fill="rgba(255,255,255,0.5)"
                  >
                    {bucket.user_count}
                  </text>
                )}

                {/* Bucket label pod sloupcem */}
                <text
                  x={centerX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize={9}
                  fill="rgba(255,255,255,0.4)"
                >
                  {bucket.bucket_label}
                </text>

                {/* Průměr bucketu */}
                {bucket.user_count > 0 && (
                  <text
                    x={centerX}
                    y={subLabelY}
                    textAnchor="middle"
                    fontSize={8}
                    fill="rgba(255,255,255,0.25)"
                  >
                    ø {bucket.avg_seconds} s
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Mediánová čára (solid gold) ── */}
          {overallMedian !== null && overallMedian > 0 && (
            <g>
              <line
                x1={milestoneX(overallMedian)}
                y1={CHART_TOP_PAD}
                x2={milestoneX(overallMedian)}
                y2={BAR_AREA_H + CHART_TOP_PAD}
                stroke="#D6A23A"
                strokeWidth={1.5}
              />
              <text
                x={milestoneX(overallMedian) + 4}
                y={CHART_TOP_PAD + 10}
                fontSize={9}
                fill="#D6A23A"
              >
                Medián: {overallMedian} s
              </text>
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
