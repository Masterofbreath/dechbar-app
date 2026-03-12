/**
 * TronSection — Cesta na Trůn Progress Widget
 *
 * Displays on PokrokPage below SmartSection.
 * Shows current Trůn hold-exhale rhythm, level bar, session sparkline, and CTA.
 * Matches SmartSection visual language — same glass card, same layout.
 *
 * Key differences vs SmartSection:
 * - Teal accent colors (not gold) — consistent with TronButton identity
 * - Rhythm displayed = 3 | 0 | 3 | holdExhale (only holdExhale progresses)
 * - Data from tron_recommendations + exercise_sessions WHERE session_type = 'tron'
 * - No KP-cap badge (KP gate is access gate, not progression gate for Trůn)
 *
 * @package DechBar_App
 * @subpackage Components/Pokrok
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { getTronLevel, formatTronRhythm } from '@/modules/mvp0/config/tronLevels';
import { KPSparkline } from '@/components/kp/KPSparkline';
import '@/styles/components/smart-exercise.css';

// =====================================================
// CONSTANTS
// =====================================================

// Milníky odpovídají přibližně 1/4, 1/2, 3/4 z 21 levelů
const TRON_LEVEL_MILESTONES = [
  { level: 5,  label: 'Začátek' },
  { level: 11, label: 'Střed' },
  { level: 17, label: 'Tvůj cíl' },
] as const;

const TRON_MILESTONE_DEFS = [
  { markerColor: 'rgba(44,190,198,0.3)',  glowColor: 'rgba(44,190,198,0.85)' },
  { markerColor: 'rgba(44,190,198,0.35)', glowColor: 'rgba(44,190,198,1)' },
  { markerColor: 'rgba(248,202,0,0.45)',  glowColor: 'rgba(248,202,0,1)' },
] as const;

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

// =====================================================
// SUB-COMPONENTS
// =====================================================

function TronLevelBar({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="smart-widget__level-bar-wrap">
      <div
        className="smart-widget__level-bar smart-widget__level-bar--tron"
        role="progressbar"
        aria-valuenow={currentLevel}
        aria-valuemin={1}
        aria-valuemax={21}
        aria-label={`Level ${currentLevel} z 21`}
      >
        {Array.from({ length: 21 }, (_, i) => (
          <div
            key={i}
            className={`smart-widget__level-segment smart-widget__level-segment--tron${i < currentLevel ? ' smart-widget__level-segment--filled' : ''}`}
          />
        ))}
      </div>

      {TRON_LEVEL_MILESTONES.map((m, idx) => {
        const pct = ((m.level - 1) / 20) * 100;
        const reached = currentLevel >= m.level;
        const { markerColor, glowColor } = TRON_MILESTONE_DEFS[idx];
        const tickColor = reached ? glowColor : markerColor;
        const labelColor = reached ? glowColor : markerColor;
        return (
          <div
            key={m.level}
            className={`smart-widget__milestone${reached ? ' smart-widget__milestone--reached' : ''}`}
            style={{ left: `${pct}%` }}
            aria-label={`Milník ${m.label} — level ${m.level}`}
          >
            <div
              className="smart-widget__milestone-tick"
              style={{
                background: tickColor,
                boxShadow: reached ? `0 0 4px ${glowColor}` : 'none',
              }}
            />
            <span className="smart-widget__milestone-label" style={{ color: labelColor }}>
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// TYPES
// =====================================================

interface TronSectionProps {
  userId: string | undefined;
  onStartTron?: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function TronSection({ userId, onStartTron }: TronSectionProps) {
  const { data: recRow, isLoading: recLoading } = useQuery({
    queryKey: ['tron-recommendation', userId ?? ''],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('tron_recommendations')
        .select('current_level, session_count, last_calculated_at')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['tron-history-full', userId ?? ''],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('exercise_sessions')
        .select('started_at, tron_context')
        .eq('user_id', userId)
        .eq('session_type', 'tron')
        .eq('was_completed', true)
        .order('started_at', { ascending: true })
        .limit(50);
      return data ?? [];
    },
    enabled: !!userId,
  });

  const isLoading = recLoading || sessionsLoading;
  const sessionCount = sessions ? sessions.length : 0;
  const currentLevel = recRow?.current_level ?? 3;
  const firstDate = sessions && sessions.length > 0 ? sessions[0]?.started_at ?? null : null;

  const tronLevel = getTronLevel(currentLevel);
  const rhythm = formatTronRhythm(tronLevel.holdExhale);

  const levelHistory: number[] = (sessions ?? [])
    .map((s: { tron_context: { level?: number } | null }) => s.tron_context?.level ?? null)
    .filter((l: number | null): l is number => l !== null);

  const hasData = sessionCount > 0;

  // =====================================================
  // SKELETON
  // =====================================================

  if (isLoading) {
    return (
      <div className="smart-widget smart-widget--tron">
        <span className="smart-widget__label">Cesta na Trůn</span>
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
      <div className="smart-widget smart-widget--tron">
        <span className="smart-widget__label">Cesta na Trůn</span>
        <div className="smart-widget__empty">
          <p className="smart-widget__empty-text">
            Zatím nemáš žádnou cestu.
            <br />
            Vydej se na první a začni trénovat CO₂ toleranci při chůzi.
          </p>
          {onStartTron && (
            <button className="smart-widget__cta smart-widget__cta--tron" onClick={onStartTron} type="button">
              Vyrazit na první cestu
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
    <div className="smart-widget smart-widget--tron">
      {/* Header row: label vlevo, rhythm (hero) vpravo */}
      <div className="smart-widget__hero-wrap">
        <div className="smart-widget__hero-left">
          <span className="smart-widget__label">Cesta na Trůn</span>
        </div>

        <div className="smart-widget__hero-right">
          <div
            className="smart-widget__rhythm smart-widget__rhythm--tron"
            aria-label={`Rytmus cesty: ${rhythm}`}
          >
            {rhythm}
          </div>
          <span className="smart-widget__rhythm-sublabel">tvůj rytmus cesty</span>
        </div>
      </div>

      {/* Level section */}
      <div className="smart-widget__level-section">
        <div className="smart-widget__level-row">
          <span className="smart-widget__level-label">Level</span>
          <span className="smart-widget__level-value" aria-label={`Level ${currentLevel} z 21`}>
            {currentLevel} / 21
          </span>
        </div>
        <TronLevelBar currentLevel={currentLevel} />
      </div>

      {/* Sparkline — teal barva */}
      {levelHistory.length >= 2 && (
        <div className="smart-widget__sparkline-wrap">
          <KPSparkline
            data={levelHistory}
            height={48}
            color="var(--color-teal, #2CBEC6)"
            startLabel={levelHistory.length > 0 ? `L${levelHistory[0]}` : undefined}
            endLabel={`L${currentLevel}`}
          />
          <div className="smart-widget__sparkline-meta">
            {levelHistory[0] !== undefined && `L${levelHistory[0]} → L${currentLevel} · ${sessionCount} cest`}
          </div>
        </div>
      )}

      {/* Info row */}
      <div className="smart-widget__info-row">
        <span className="smart-widget__info-inline">
          První cesta {formatDate(firstDate)}
        </span>
        <span className="smart-widget__info-sep" aria-hidden="true">·</span>
        <span className="smart-widget__info-inline">
          {sessionCount} {sessionCount === 1 ? 'cesta' : sessionCount < 5 ? 'cesty' : 'cest'}
        </span>
      </div>

      {/* CTA */}
      {onStartTron && (
        <button className="smart-widget__cta smart-widget__cta--tron" onClick={onStartTron} type="button">
          Spustit Cestu na Trůn
        </button>
      )}
    </div>
  );
}
