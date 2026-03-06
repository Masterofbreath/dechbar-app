/**
 * SmartSection — SMART DECH Progress Widget
 *
 * Displays on PokrokPage below KPSection.
 * Shows current SMART base rhythm, level bar with motivational milestones,
 * KPSparkline-compatible level history chart, and CTA.
 * Matches KPSection visual language exactly: glass card, Apple premium style.
 *
 * Design rules:
 * - Rhythm displayed = base rhythm from BREATH_LEVELS[level-1] (never night override)
 * - Sparkline = KPSparkline component, teal color, same height as KPSection
 * - Milestones = same visual language as LungProgress milestones (KP 13/25/40s)
 * - KP limit badge = teal pill top-right when user is capped by their KP
 *
 * @package DechBar_App
 * @subpackage Components/Pokrok
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/api/supabase';
import { getBreathLevel, formatBreathRhythm } from '@/modules/mvp0/config/breathLevels';
import { KPSparkline } from '@/components/kp/KPSparkline';
import '@/styles/components/smart-exercise.css';

// =====================================================
// CONSTANTS
// =====================================================

// Milestone levels matching KPSection milestones (KP 13s → avg, 25s → functional, 40s → goal)
// Derived from KP_CAP_TABLE in BIE: maxLevel for KP<20=5, KP<30=9, KP<50=16
const LEVEL_MILESTONES = [
  { level: 5,  label: 'Průměr' },
  { level: 9,  label: 'Funkčnost' },
  { level: 16, label: 'Tvůj cíl' },
] as const;

// KP_CAP_TABLE mirrored here for badge logic (single source of truth stays in BIE,
// but SmartSection needs it for display only — no algorithm logic)
const KP_CAP_TABLE_DISPLAY: Array<{ maxKP: number; maxLevel: number }> = [
  { maxKP: 10,  maxLevel: 3 },
  { maxKP: 20,  maxLevel: 5 },
  { maxKP: 30,  maxLevel: 9 },
  { maxKP: 40,  maxLevel: 13 },
  { maxKP: 50,  maxLevel: 16 },
  { maxKP: Infinity, maxLevel: 21 },
];

function getKPMaxLevel(kp: number | null): number | null {
  if (kp === null) return null;
  const entry = KP_CAP_TABLE_DISPLAY.find((row) => kp < row.maxKP);
  return entry?.maxLevel ?? 21;
}

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

// Level bar with milestone markers — matches KPSection milestone visual language
function LevelBarWithMilestones({ currentLevel }: { currentLevel: number }) {
  return (
    <div className="smart-widget__level-bar-wrap">
      {/* Bar itself */}
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

      {/* Milestone markers — positioned absolutely over bar, same style as KPSection */}
      {LEVEL_MILESTONES.map((m) => {
        const pct = ((m.level - 1) / 20) * 100;
        const reached = currentLevel >= m.level;
        return (
          <div
            key={m.level}
            className={`smart-widget__milestone${reached ? ' smart-widget__milestone--reached' : ''}`}
            style={{ left: `${pct}%` }}
            aria-label={`Milník ${m.label} — level ${m.level}`}
          >
            <div className="smart-widget__milestone-tick" />
            <span className="smart-widget__milestone-label">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// TYPES
// =====================================================

interface SmartSectionProps {
  userId: string | undefined;
  latestKP?: number | null;
  onStartSmart?: () => void;
  onMeasureKP?: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function SmartSection({ userId, latestKP, onStartSmart, onMeasureKP }: SmartSectionProps) {
  // Fetch SMART recommendation row
  const { data: recRow, isLoading: recLoading } = useQuery({
    queryKey: ['smart-recommendation', userId ?? ''],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('smart_exercise_recommendations')
        .select('current_level, session_count_smart, last_calculated_at')
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

  const sessionCount = sessions ? sessions.length : (recRow?.session_count_smart ?? 0);
  const currentLevel = recRow?.current_level ?? 3;
  const firstDate = sessions && sessions.length > 0 ? sessions[0]?.started_at ?? null : null;

  // Base rhythm — always from BREATH_LEVELS, never from DB cached (which may have night override)
  const baseLevel = getBreathLevel(currentLevel);
  const rhythm = formatBreathRhythm(baseLevel.inhale, 0, baseLevel.exhale, baseLevel.holdExhale);

  // Level history for sparkline — use level from smart_context snapshot
  const levelHistory: number[] = (sessions ?? [])
    .map((s: { smart_context: { level?: number } | null }) => s.smart_context?.level ?? null)
    .filter((l: number | null): l is number => l !== null);

  const hasData = sessionCount > 0;

  // KP limit badge: show when user is capped by their KP and hasn't reached level 21
  const kpMaxLevel = getKPMaxLevel(latestKP ?? null);
  const showKPBadge =
    kpMaxLevel !== null &&
    currentLevel >= kpMaxLevel &&
    currentLevel < 21 &&
    hasData;

  // =====================================================
  // SKELETON
  // =====================================================

  if (isLoading) {
    return (
      <div className="smart-widget">
        <span className="smart-widget__label">Smart cvičení</span>
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
        <span className="smart-widget__label">Smart cvičení</span>
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
      {/* Label — absolute top-left, teal, matches KPSection */}
      <span className="smart-widget__label">Smart cvičení</span>

      {/* KP limit badge — absolute top-right */}
      {showKPBadge && onMeasureKP && (
        <button
          className="smart-widget__kp-badge"
          onClick={onMeasureKP}
          type="button"
          aria-label="Změř si KP pro odemčení dalšího levelu"
        >
          Chceš růst? Změř si KP →
        </button>
      )}

      {/* Base rhythm — padded top for label */}
      <div className="smart-widget__rhythm-wrap">
        <div
          className="smart-widget__rhythm"
          aria-label={`Základní rytmus: ${rhythm}`}
        >
          {rhythm}
        </div>
        <span className="smart-widget__rhythm-sublabel">základní rytmus</span>
      </div>

      {/* Level section with milestone bar */}
      <div className="smart-widget__level-section">
        <div className="smart-widget__level-row">
          <span className="smart-widget__level-label">Level</span>
          <span className="smart-widget__level-value" aria-label={`Level ${currentLevel} z 21`}>
            {currentLevel} / 21
          </span>
        </div>
        <LevelBarWithMilestones currentLevel={currentLevel} />
      </div>

      {/* Sparkline — KPSparkline component, teal color, identical to KPSection */}
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
            {levelHistory[0] !== undefined && `L${levelHistory[0]} → L${currentLevel} · ${sessionCount} cvičení`}
          </div>
        </div>
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
