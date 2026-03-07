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

// Milestone colors — identical pattern to LungProgress:
// markerColor = tlumená (vždy viditelná), glowColor = plná sytost při dosažení
const MILESTONE_DEFS = [
  { markerColor: 'rgba(200,200,220,0.45)', glowColor: 'rgba(200,200,220,0.9)' },   // Průměr — silver
  { markerColor: 'rgba(56,189,248,0.5)',   glowColor: 'rgba(56,189,248,1)' },       // Funkčnost — sky blue
  { markerColor: 'rgba(248,202,0,0.55)',   glowColor: 'rgba(248,202,0,1)' },        // Tvůj cíl — gold
] as const;

// Level bar with milestone markers — matches LungProgress milestone visual language exactly
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

      {/* Milestone markers — always colored (like LungProgress), full saturation when reached */}
      {LEVEL_MILESTONES.map((m, idx) => {
        const pct = ((m.level - 1) / 20) * 100;
        const reached = currentLevel >= m.level;
        const { markerColor, glowColor } = MILESTONE_DEFS[idx];
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
            <span
              className="smart-widget__milestone-label"
              style={{ color: labelColor }}
            >
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
        .select('current_level, session_count_smart, last_calculated_at, reset_at')
        .eq('user_id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch SMART sessions — only after the last reset_at (current epoch)
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['smart-history-full', userId ?? '', recRow?.reset_at ?? null],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from('exercise_sessions')
        .select('started_at, smart_context')
        .eq('user_id', userId)
        .eq('session_type', 'smart')
        .eq('was_completed', true)
        .order('started_at', { ascending: true })
        .limit(50);

      // Filter to current epoch only — sessions before reset_at belong to previous epoch
      if (recRow?.reset_at) {
        query = query.gte('started_at', recRow.reset_at);
      }

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const isLoading = recLoading || sessionsLoading;

  // Session count for display = sessions in current epoch (after last reset_at)
  // recRow.session_count_smart is the BIE internal counter — may differ after soft-reset
  const sessionCount = sessions ? sessions.length : 0;
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
      {/* Header row: label vlevo, rhythm (hero) vpravo — identická struktura jako KPSection */}
      <div className="smart-widget__hero-wrap">
        <div className="smart-widget__hero-left">
          <span className="smart-widget__label">Smart cvičení</span>
          {/* KP limit badge — pod labelem vlevo */}
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
        </div>

        {/* Rhythm vpravo — jako velká hodnota "38s" v KPSection */}
        <div className="smart-widget__hero-right">
          <div
            className="smart-widget__rhythm"
            aria-label={`Základní rytmus: ${rhythm}`}
          >
            {rhythm}
          </div>
          <span className="smart-widget__rhythm-sublabel">tvůj základní rytmus</span>
        </div>
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

      {/* Info row — jeden řádek: datum zahájení + počet cvičení */}
      <div className="smart-widget__info-row">
        <span className="smart-widget__info-inline">
          Zahájeno {formatDate(firstDate)}
        </span>
        <span className="smart-widget__info-sep" aria-hidden="true">·</span>
        <span className="smart-widget__info-inline">
          {sessionCount} cvičení
        </span>
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
