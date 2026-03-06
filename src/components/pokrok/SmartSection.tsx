/**
 * SmartSection — SMART DECH Progress Widget
 *
 * Displays on PokrokPage below KPSection.
 * Shows current SMART level, rhythm, progression sparkline, and CTA.
 * Matches KPSection visual language: glass card, Apple premium style.
 *
 * @package DechBar_App
 * @subpackage Components/Pokrok
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { formatPatternRhythm } from '@/modules/mvp0/config/breathLevels';
import '@/styles/components/smart-exercise.css';

// =====================================================
// TYPES
// =====================================================

// HELPERS
// =====================================================

function formatDate(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Inline SVG sinusoida icon
function SmartWaveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 16 C4 8, 8 8, 10 16 C12 24, 16 24, 18 16 C20 8, 24 8, 26 16 C28 24, 30 24, 30 16" />
    </svg>
  );
}

// Mini sparkline of level history
function LevelSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const width = 200;
  const height = 36;
  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const minVal = Math.max(1, Math.min(...data) - 1);
  const maxVal = Math.min(21, Math.max(...data) + 1);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((v - minVal) / range) * usableHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <svg
      className="smart-widget__sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Vývoj SMART levelu v čase"
    >
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-teal, #2CBEC6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {points.length > 0 && (() => {
        const last = points[points.length - 1]!.split(',');
        return (
          <circle
            cx={last[0]}
            cy={last[1]}
            r="3"
            fill="var(--color-teal, #2CBEC6)"
          />
        );
      })()}
    </svg>
  );
}

// =====================================================
// COMPONENT
// =====================================================

interface SmartSectionProps {
  userId: string | undefined;
  onStartSmart?: () => void;
}

export function SmartSection({ userId, onStartSmart }: SmartSectionProps) {
  // Fetch SMART recommendation row
  const { data: recRow, isLoading: recLoading } = useQuery({
    queryKey: ['smart-recommendation', userId ?? ''],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('smart_exercise_recommendations')
        .select('current_level, session_count_smart, recommended_inhale_s, recommended_exhale_s, recommended_hold_after_exhale_s, last_calculated_at')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch first SMART session date + level history from smart_context
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['smart-history-full', userId ?? ''],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('exercise_sessions')
        .select('started_at, smart_context')
        .eq('user_id', userId)
        .eq('session_type', 'smart')
        .eq('was_completed', true)
        .order('started_at', { ascending: true })
        .limit(50);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const isLoading = recLoading || sessionsLoading;

  // Build progress data
  const sessionCount = recRow?.session_count_smart ?? 0;
  const currentLevel = recRow?.current_level ?? 3;
  const firstDate = sessions && sessions.length > 0 ? sessions[0]?.started_at ?? null : null;

  // Level history from smart_context snapshots
  const levelHistory: number[] = (sessions ?? [])
    .map((s: { smart_context: { level?: number } | null }) => s.smart_context?.level ?? null)
    .filter((l: number | null): l is number => l !== null);

  const rhythm = recRow
    ? formatPatternRhythm({
        inhale_seconds: recRow.recommended_inhale_s ?? 4,
        hold_after_inhale_seconds: 0,
        exhale_seconds: recRow.recommended_exhale_s ?? 6,
        hold_after_exhale_seconds: recRow.recommended_hold_after_exhale_s ?? 0,
      })
    : '4 · 0 · 6 · 0';

  const hasData = sessionCount > 0;

  // =====================================================
  // SKELETON
  // =====================================================

  if (isLoading) {
    return (
      <div className="smart-widget">
        <div className="smart-widget__header">
          <div className="smart-widget__icon"><SmartWaveIcon /></div>
          <div className="smart-widget__title">SMART DECH</div>
        </div>
        <div className="smart-widget__skeleton smart-widget__skeleton--mid" />
        <div className="smart-widget__skeleton smart-widget__skeleton--wide" />
        <div className="smart-widget__skeleton smart-widget__skeleton--short" />
      </div>
    );
  }

  // =====================================================
  // EMPTY STATE
  // =====================================================

  if (!hasData) {
    return (
      <div className="smart-widget">
        <div className="smart-widget__header">
          <div className="smart-widget__icon"><SmartWaveIcon /></div>
          <div className="smart-widget__title">SMART DECH</div>
        </div>
        <div className="smart-widget__empty">
          <p className="smart-widget__empty-text">
            Zatím nemáš žádné SMART cvičení.
            <br />
            Začni a algoritmus se přizpůsobí tvému dechu.
          </p>
          {onStartSmart && (
            <button className="smart-widget__cta" onClick={onStartSmart} type="button">
              Začni první SMART cvičení
            </button>
          )}
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN WIDGET
  // =====================================================

  return (
    <div className="smart-widget">
      {/* Header */}
      <div className="smart-widget__header">
        <div className="smart-widget__icon"><SmartWaveIcon /></div>
        <div className="smart-widget__title">SMART DECH</div>
      </div>

      {/* Rhythm */}
      <div
        className="smart-widget__rhythm"
        aria-label={`Aktuální rytmus: ${rhythm}`}
      >
        {rhythm}
      </div>

      {/* Level section */}
      <div className="smart-widget__level-section">
        <div className="smart-widget__level-row">
          <span className="smart-widget__level-label">Level</span>
          <span className="smart-widget__level-value" aria-label={`Level ${currentLevel} z 21`}>
            {currentLevel} / 21
          </span>
        </div>
        <div
          className="smart-widget__level-bar"
          role="progressbar"
          aria-valuenow={currentLevel}
          aria-valuemin={1}
          aria-valuemax={21}
          aria-label={`Level ${currentLevel} z 21`}
        >
          {Array.from({ length: 21 }, (_, i) => (
            <div
              key={i}
              className={`smart-widget__level-segment${i < currentLevel ? ' smart-widget__level-segment--filled' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Sparkline */}
      {levelHistory.length >= 2 && (
        <LevelSparkline data={levelHistory} />
      )}

      {/* Info row */}
      <div className="smart-widget__info-row">
        <div className="smart-widget__info-item">
          <span className="smart-widget__info-label">Zahájil</span>
          <span className="smart-widget__info-value">{formatDate(firstDate)}</span>
        </div>
        <div className="smart-widget__info-item">
          <span className="smart-widget__info-label">Celkem</span>
          <span className="smart-widget__info-value">{sessionCount} cvičení</span>
        </div>
      </div>

      {/* CTA */}
      {onStartSmart && (
        <button className="smart-widget__cta" onClick={onStartSmart} type="button">
          Spustit SMART CVIČENÍ
        </button>
      )}
    </div>
  );
}
