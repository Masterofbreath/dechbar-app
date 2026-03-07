/**
 * StickinessSection — DAU/MAU Stickiness metrika
 *
 * Stickiness = DAU / MAU × 100
 *
 * Interpretace:
 *   < 10%  — nízká (typický obsah, YouTube apod.)
 *   10–20% — průměrná (většina aplikací)
 *   20–50% — dobrá (silné utility nebo habituální nástroje)
 *   50%+   — výjimečná (WhatsApp, Instagram)
 *
 * Cíl DechBar: >20% (habituální každodenní cvičení)
 *
 * @package DechBar_App
 * @subpackage Platform/Pages/Admin/BusinessAdmin/sections
 */

import { useTotalUsers, useUniqueActiveUsers } from '@/platform/analytics';

function getRatingLabel(pct: number): { label: string; color: string } {
  if (pct >= 50) return { label: 'Výjimečná', color: '#30D158' };
  if (pct >= 20) return { label: 'Dobrá ✓', color: '#30D158' };
  if (pct >= 10) return { label: 'Průměrná', color: '#F8CA00' };
  return { label: 'Nízká', color: '#FF453A' };
}

export function StickinessSection() {
  const { count: totalUsers, isLoading: usersLoading } = useTotalUsers();
  const { count: dau, isLoading: dauLoading } = useUniqueActiveUsers('today');
  const { count: mau, isLoading: mauLoading } = useUniqueActiveUsers('month');

  const isLoading = usersLoading || dauLoading || mauLoading;

  const stickinessPct = mau > 0 ? Math.round((dau / mau) * 100) : 0;
  const dauMauRatio   = mau > 0 ? ((dau / mau) * 100).toFixed(1) : '—';
  const dauRegRatio   = totalUsers > 0 ? ((dau / totalUsers) * 100).toFixed(1) : '—';

  const rating = getRatingLabel(stickinessPct);

  return (
    <div className="business-admin__stickiness">
      <div className="business-admin__chart-title">DAU / MAU Stickiness</div>
      <div className="business-admin__chart-subtitle">
        kolik % měsíčně aktivních uživatelů přijde každý den
      </div>

      {isLoading ? (
        <div className="business-admin__empty">Načítám...</div>
      ) : (
        <>
          {/* Hlavní hodnota */}
          <div className="business-admin__stickiness-main">
            <div className="business-admin__stickiness-value" style={{ color: rating.color }}>
              {dauMauRatio}%
            </div>
            <div className="business-admin__stickiness-rating" style={{ color: rating.color }}>
              {rating.label}
            </div>
          </div>

          {/* Progress bar — 0–50% škála, cíl 20% */}
          <div className="business-admin__stickiness-bar-wrap">
            <div className="business-admin__stickiness-bar-bg">
              <div
                className="business-admin__stickiness-bar-fill"
                style={{
                  width: `${Math.min(stickinessPct * 2, 100)}%`,
                  background: rating.color,
                }}
              />
              {/* Cílový marker: 20% = 40% šířky baru */}
              <div
                className="business-admin__stickiness-goal-marker"
                title="Cíl DechBar: 20%"
              />
            </div>
            <div className="business-admin__stickiness-bar-labels">
              <span>0%</span>
              <span className="business-admin__stickiness-goal-label">cíl 20%</span>
              <span>50%+</span>
            </div>
          </div>

          {/* Dílčí metriky */}
          <div className="business-admin__stickiness-stats">
            <div className="business-admin__stickiness-stat">
              <span className="business-admin__stickiness-stat-value">{dau}</span>
              <span className="business-admin__stickiness-stat-label">DAU (dnes)</span>
            </div>
            <div className="business-admin__stickiness-stat">
              <span className="business-admin__stickiness-stat-value">{mau}</span>
              <span className="business-admin__stickiness-stat-label">MAU (tento měsíc)</span>
            </div>
            <div className="business-admin__stickiness-stat">
              <span className="business-admin__stickiness-stat-value">{dauRegRatio}%</span>
              <span className="business-admin__stickiness-stat-label">DAU / registrovaní</span>
            </div>
          </div>

          <div className="business-admin__stickiness-note">
            Benchmark: WhatsApp/Instagram ~50% · Utility apps ~20% · Obsah ~5–10%
          </div>
        </>
      )}
    </div>
  );
}
