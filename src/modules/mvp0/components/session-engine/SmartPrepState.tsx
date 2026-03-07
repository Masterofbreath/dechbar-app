/**
 * SmartPrepState — SMART CVIČENÍ Preparation Screen
 *
 * Shown instead of SessionStartScreen when SessionEngineModal receives smartConfig.
 * Displays the recommended rhythm, duration, calibration progress.
 *
 * Auto-starts countdown after 5 seconds, or immediately on any tap.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { formatPatternRhythm } from '../../config/breathLevels';
import { CloseButton } from '@/components/shared';
import type { SmartSessionConfig } from '../../types/exercises';

// =====================================================
// TYPES
// =====================================================

export interface SmartPrepStateProps {
  smartConfig: SmartSessionConfig | null;
  onStart: () => void;
  onAdjustDuration: (deltaSeconds: number) => void;
  onClose: () => void;
  /** True when user has never measured KP */
  hasNoKP?: boolean;
  /** Play a start bell at a given volume — called at countdown 2s and 1s */
  onPlayBell?: (volume: number) => void;
}

// Fallback cold-start config used when BIE fails and config is null
const FALLBACK_CONFIG: SmartSessionConfig = {
  level: 3,
  totalDurationSeconds: 420,
  basePattern: {
    inhale_seconds: 4,
    hold_after_inhale_seconds: 0,
    exhale_seconds: 6,
    hold_after_exhale_seconds: 0,
  },
  isCalibrating: true,
  sessionCountSmart: 0,
};

// =====================================================
// HELPERS
// =====================================================

function formatDurationMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function getCalibrationText(sessionCount: number): string {
  const remaining = 10 - sessionCount;
  if (remaining <= 3) {
    return `Ještě ${remaining} ${remaining === 1 ? 'cvičení' : remaining < 5 ? 'cvičení' : 'cvičení'} a budu tě znát jako své boty.`;
  }
  return `Absolvuj ještě ${remaining} cvičení pro přesné doporučení.`;
}

// Waveform SVG icon (sinusoid / breath wave)
function WaveIcon() {
  return (
    <svg
      width="32"
      height="32"
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

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// =====================================================
// COMPONENT
// =====================================================

const AUTO_START_SECONDS = 5;
const MIN_DURATION_SECONDS = 300;
const MAX_DURATION_SECONDS = 900;
const DURATION_STEP = 60;

export function SmartPrepState({
  smartConfig: smartConfigProp,
  onStart,
  onAdjustDuration,
  onClose,
  hasNoKP = false,
  onPlayBell,
}: SmartPrepStateProps) {
  // Tiché použití fallback konfigurace pokud BIE selže
  const smartConfig = smartConfigProp ?? FALLBACK_CONFIG;
  const isFallback = smartConfigProp === null;
  const [countdown, setCountdown] = useState(AUTO_START_SECONDS);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  const triggerStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
    onStart();
  }, [onStart]);

  // Auto-countdown — plays bells at 2s and 1s, triggers start at 0
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next === 2) {
          onPlayBell?.(0.5);
        } else if (next === 1) {
          onPlayBell?.(1.0);
        } else if (next <= 0) {
          window.clearInterval(timerRef.current!);
          triggerStart();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [triggerStart, onPlayBell]);

  const handleScreenTap = useCallback(() => {
    triggerStart();
  }, [triggerStart]);

  const canDecrease = smartConfig.totalDurationSeconds - DURATION_STEP >= MIN_DURATION_SECONDS;
  const canIncrease = smartConfig.totalDurationSeconds + DURATION_STEP <= MAX_DURATION_SECONDS;

  const handleDecrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canDecrease) onAdjustDuration(-DURATION_STEP);
    },
    [canDecrease, onAdjustDuration],
  );

  const handleIncrease = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (canIncrease) onAdjustDuration(DURATION_STEP);
    },
    [canIncrease, onAdjustDuration],
  );

  const rhythm = formatPatternRhythm(smartConfig.basePattern);
  const durationLabel = formatDurationMin(smartConfig.totalDurationSeconds);

  if (started) return null;

  return (
    <div
      className="smart-prep"
      onClick={handleScreenTap}
      role="button"
      tabIndex={0}
      aria-label="Zahájit cvičení"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerStart(); }}
    >
      {/* Top bar — stejný pattern jako FullscreenModal: safe-area řeší top-bar, ne button */}
      <div className="smart-prep__top-bar">
        <CloseButton
          onClick={(e) => {
            e.stopPropagation();
            if (timerRef.current) window.clearInterval(timerRef.current);
            onClose();
          }}
          className="smart-prep__close"
        />
      </div>

      {/* Header */}
      <div className="smart-prep__header">
        <div className="smart-prep__icon">
          <WaveIcon />
        </div>
        <h2 className="smart-prep__title">SMART CVIČENÍ</h2>
      </div>

      {/* Recommendation card */}
      <div className="smart-prep__card">
        <div className="smart-prep__rhythm-label">Dnešní doporučení</div>
        <div className="smart-prep__rhythm" aria-label={`Rytmus: ${rhythm}`}>
          {rhythm}
        </div>
        <div className="smart-prep__duration-row">
          <button
            className="smart-prep__duration-btn"
            onClick={handleDecrease}
            disabled={!canDecrease}
            type="button"
            aria-label="Zkrátit o 1 minutu"
          >
            <MinusIcon />
            <span>1 min</span>
          </button>

          <span className="smart-prep__duration">{durationLabel}</span>

          <button
            className="smart-prep__duration-btn"
            onClick={handleIncrease}
            disabled={!canIncrease}
            type="button"
            aria-label="Prodloužit o 1 minutu"
          >
            <span>1 min</span>
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Calibration block */}
      {smartConfig.isCalibrating && (
        <div className="smart-prep__calibration" aria-live="polite">
          <p className="smart-prep__calibration-text">
            {getCalibrationText(smartConfig.sessionCountSmart)}
          </p>
          <div
            className="smart-prep__dots"
            role="progressbar"
            aria-valuenow={smartConfig.sessionCountSmart}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`Kalibrace: ${smartConfig.sessionCountSmart} z 10 cvičení`}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`smart-prep__dot${i < smartConfig.sessionCountSmart ? ' smart-prep__dot--filled' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* No KP hint */}
      {hasNoKP && (
        <div className="smart-prep__kp-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Změř si KP pro přesnější doporučení
        </div>
      )}

      {/* Fallback notice — shown when BIE computation failed */}
      {isFallback && (
        <div className="smart-prep__kp-hint" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Použijeme výchozí nastavení pro dnešní cvičení.
        </div>
      )}

      {/* Auto-start hint */}
      <div className="smart-prep__hint">
        Cvičení začne automaticky za <span className="smart-prep__hint-count">{countdown}</span>s
        <br />
        <span className="smart-prep__hint-sub">nebo dotkni se obrazovky</span>
      </div>
    </div>
  );
}
