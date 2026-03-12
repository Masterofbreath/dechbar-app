/**
 * TronPrepState — Cesta na Trůn Preparation Screen
 *
 * Shown when user starts a Trůn session. Displays the recommended
 * hold-exhale rhythm, session duration, and calibration progress.
 *
 * Key difference from SmartPrepState:
 * - No background music (audio-intentional — needs 100% attention)
 * - Fixed inhale/exhale (3s each), only holdExhale varies by level
 * - Teal color scheme (vs. gold for SMART)
 *
 * Auto-starts after 5 seconds, or immediately on tap.
 *
 * @package DechBar_App
 * @subpackage MVP0/Components/SessionEngine
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { CloseButton } from '@/components/shared';
import { formatTronRhythm } from '../../config/tronLevels';

// =====================================================
// TYPES
// =====================================================

export interface TronPrepConfig {
  level: number;
  /** holdExhale in seconds (base, before multiplier) */
  holdExhaleSeconds: number;
  totalDurationSeconds: number;
  sessionCount: number;
  isCalibrating: boolean;
}

export interface TronPrepStateProps {
  config: TronPrepConfig;
  onStart: () => void;
  onAdjustDuration: (deltaSeconds: number) => void;
  onClose: () => void;
  onScheduleBells?: (delay1Sec: number, delay2Sec: number) => (() => void);
  onUnlockAudio?: () => void;
  onRegisterCancelBells?: (cancelFn: () => void) => void;
}

// =====================================================
// CONSTANTS
// =====================================================

const AUTO_START_SECONDS = 5;
const MIN_DURATION_SECONDS = 300;  // 5 min
const MAX_DURATION_SECONDS = 900;  // 15 min
const DURATION_STEP = 60;          // 1 min

// =====================================================
// HELPERS
// =====================================================

function formatDurationMin(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function getCalibrationText(sessionCount: number): string {
  const remaining = 10 - sessionCount;
  if (remaining === 1) {
    return `Ještě poslední cestu a budu tě znát jako své boty.`;
  }
  if (remaining <= 4) {
    return `Ještě ${remaining} cesty a budu tě znát jako své boty.`;
  }
  return `Absolvuj ještě ${remaining} ${remaining >= 5 ? 'cest' : 'cesty'} pro přesné doporučení.`;
}

// =====================================================
// ICONS
// =====================================================

function WalkIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="4" r="1.5" />
      <path d="M9 9l1.5 4.5L9 18" />
      <path d="M15 9l-1.5 4.5L15 18" />
      <path d="M9 12h6" />
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

export function TronPrepState({
  config,
  onStart,
  onAdjustDuration,
  onClose,
  onScheduleBells,
  onUnlockAudio,
  onRegisterCancelBells,
}: TronPrepStateProps) {
  const [countdown, setCountdown] = useState(AUTO_START_SECONDS);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const cancelBellsRef = useRef<(() => void) | null>(null);

  const triggerStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
    cancelBellsRef.current?.();
    cancelBellsRef.current = null;
    onUnlockAudio?.();
    onStart();
  }, [onStart, onUnlockAudio]);

  // Schedule start bells synchronously at mount (Safari AudioContext fix)
  const scheduleBellsCalledRef = useRef(false);
  if (!scheduleBellsCalledRef.current && onScheduleBells) {
    scheduleBellsCalledRef.current = true;
    const cancelFn = onScheduleBells(
      AUTO_START_SECONDS - 2,
      AUTO_START_SECONDS - 1,
    ) ?? (() => { /* noop */ });
    cancelBellsRef.current = cancelFn;
    onRegisterCancelBells?.(cancelFn);
  }

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (next === 0) {
          window.clearInterval(timerRef.current!);
          window.setTimeout(() => { triggerStart(); }, 0);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScreenTap = useCallback(() => {
    triggerStart();
  }, [triggerStart]);

  const canDecrease = config.totalDurationSeconds - DURATION_STEP >= MIN_DURATION_SECONDS;
  const canIncrease = config.totalDurationSeconds + DURATION_STEP <= MAX_DURATION_SECONDS;

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

  const rhythm = formatTronRhythm(config.holdExhaleSeconds);
  const durationLabel = formatDurationMin(config.totalDurationSeconds);

  if (started) return null;

  return (
    <div
      className="tron-prep"
      onClick={handleScreenTap}
      role="button"
      tabIndex={0}
      aria-label="Zahájit cestu"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerStart(); }}
    >
      {/* Top bar */}
      <div className="tron-prep__top-bar">
        <CloseButton
          onClick={() => {
            startedRef.current = true;
            if (timerRef.current) window.clearInterval(timerRef.current);
            cancelBellsRef.current?.();
            cancelBellsRef.current = null;
            onClose();
          }}
          className="tron-prep__close"
        />
      </div>

      {/* Header */}
      <div className="tron-prep__header">
        <div className="tron-prep__icon">
          <WalkIcon />
        </div>
        <h2 className="tron-prep__title">CESTA NA TRŮN</h2>
      </div>

      {/* Recommendation card */}
      <div className="tron-prep__card">
        <div className="tron-prep__rhythm-label">Tvůj rytmus dnes</div>
        <div className="tron-prep__rhythm" aria-label={`Rytmus: ${rhythm}`}>
          {rhythm}
        </div>
        <div className="tron-prep__duration-row">
          <button
            className="tron-prep__duration-btn"
            onClick={handleDecrease}
            disabled={!canDecrease}
            type="button"
            aria-label="Zkrátit o 1 minutu"
          >
            <MinusIcon />
            <span>1 min</span>
          </button>
          <span className="tron-prep__duration">{durationLabel}</span>
          <button
            className="tron-prep__duration-btn"
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

      {/* Calibration */}
      {config.isCalibrating && (
        <div className="tron-prep__calibration" aria-live="polite">
          <p className="tron-prep__calibration-text">
            {getCalibrationText(config.sessionCount)}
          </p>
          <div
            className="tron-prep__dots"
            role="progressbar"
            aria-valuenow={config.sessionCount}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-label={`Kalibrace: ${config.sessionCount} z 10 cest`}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`tron-prep__dot${i < config.sessionCount ? ' tron-prep__dot--filled' : ''}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Auto-start hint */}
      <div className="tron-prep__hint">
        Cesta začne za <span className="tron-prep__hint-count">{countdown}</span>s
        <br />
        <span className="tron-prep__hint-sub">nebo dotkni se obrazovky</span>
      </div>
    </div>
  );
}
