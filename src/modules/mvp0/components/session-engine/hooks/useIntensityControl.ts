/**
 * useIntensityControl — In-Session Breathing Intensity Management
 *
 * Controls the intensity multiplier (0.5×–1.5×) during active breathing sessions.
 * Multiplier changes apply at the START of the next breathing cycle (not mid-cycle)
 * to avoid jarring rhythm interruptions.
 *
 * Architecture:
 * - `multiplier` state → triggers UI re-render (dot indicator)
 * - `multiplierRef` → engine reads current committed value (no re-render side effects)
 * - `pendingMultiplierRef` → engine reads at cycle boundary, then promotes to multiplierRef
 * - `pendingEventsRef` → batch buffer (flushed after session save with session_id)
 *
 * Steps:  0=0.5×  1=0.75×  2=1.0× (default)  3=1.25×  4=1.5×
 *
 * @package DechBar_App
 * @subpackage MVP0/SessionEngine/Hooks
 */

import { useState, useRef, useCallback } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { insertIntensityEventsBatch, type IntensityEventInsert } from '../../../api/intensityEvents';
import { isNativePlatform } from '../../../utils/capacitorUtils';
import { useSessionSettings } from '../../../stores/sessionSettingsStore';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MULTIPLIER_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;
const DEFAULT_STEP = 2; // index of 1.0×

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PendingIntensityEvent {
  occurred_at_ms: number;
  action: 'up' | 'down';
  multiplier_from: number;
  multiplier_to: number;
}

interface UseIntensityControlOptions {
  userId?: string;
}

export interface IntensityControlReturn {
  /** Current multiplier value (0.5 | 0.75 | 1.0 | 1.25 | 1.5) — used by UI */
  multiplier: number;
  /** Current step index (0–4, 2 = center/default) — used by IntensityDots */
  intensityStep: number;
  canIncrease: boolean;
  canDecrease: boolean;
  handleIncrease: () => void;
  handleDecrease: () => void;
  /** Ref for committed multiplier — engine reads this without causing re-renders */
  multiplierRef: React.MutableRefObject<number>;
  /** Ref for pending multiplier — engine applies this at next cycle boundary */
  pendingMultiplierRef: React.MutableRefObject<number>;
  /** Call when 'active' state begins to start elapsed-time tracking */
  notifySessionStart: () => void;
  /** Batch-insert pending events after session save. Never throws. */
  flushEvents: (sessionId: string) => Promise<void>;
  /** Reset all state — call on session close or abandon */
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useIntensityControl(
  options: UseIntensityControlOptions = {}
): IntensityControlReturn {
  const { userId } = options;
  const { hapticsEnabled } = useSessionSettings();

  // UI state (triggers dot re-render)
  const [step, setStep] = useState(DEFAULT_STEP);

  // Engine refs (no re-render side effects)
  const multiplierRef = useRef<number>(MULTIPLIER_STEPS[DEFAULT_STEP]);
  const pendingMultiplierRef = useRef<number>(MULTIPLIER_STEPS[DEFAULT_STEP]);

  // Batch buffer: events collected during session, flushed after session_id available
  const pendingEventsRef = useRef<PendingIntensityEvent[]>([]);

  // Session start timestamp (for occurred_at_ms calculation)
  const sessionStartTimeRef = useRef<number | null>(null);

  // ─── Computed ───────────────────────────────────────────────────────────────

  const multiplier = MULTIPLIER_STEPS[step];
  const canIncrease = step < MULTIPLIER_STEPS.length - 1;
  const canDecrease = step > 0;

  // ─── Haptic feedback ────────────────────────────────────────────────────────

  const triggerTapHaptic = useCallback(async () => {
    if (!isNativePlatform || !hapticsEnabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Haptic failure is non-critical, silence it
    }
  }, [hapticsEnabled]);

  // ─── Step change logic ──────────────────────────────────────────────────────

  const applyStep = useCallback(
    (newStep: number, action: 'up' | 'down') => {
      const fromMultiplier = MULTIPLIER_STEPS[step];
      const toMultiplier = MULTIPLIER_STEPS[newStep];

      // Update UI state
      setStep(newStep);

      // Update pending ref — engine will apply at next cycle boundary
      pendingMultiplierRef.current = toMultiplier;

      // Log event in batch buffer
      const elapsed =
        sessionStartTimeRef.current !== null
          ? Math.round(Date.now() - sessionStartTimeRef.current)
          : 0;

      pendingEventsRef.current.push({
        occurred_at_ms: elapsed,
        action,
        multiplier_from: fromMultiplier,
        multiplier_to: toMultiplier,
      });

      // Haptic feedback (fire-and-forget)
      void triggerTapHaptic();
    },
    [step, triggerTapHaptic]
  );

  const handleIncrease = useCallback(() => {
    if (!canIncrease) return;
    applyStep(step + 1, 'up');
  }, [canIncrease, step, applyStep]);

  const handleDecrease = useCallback(() => {
    if (!canDecrease) return;
    applyStep(step - 1, 'down');
  }, [canDecrease, step, applyStep]);

  // ─── Session lifecycle ──────────────────────────────────────────────────────

  const notifySessionStart = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
  }, []);

  const flushEvents = useCallback(
    async (sessionId: string) => {
      const events = pendingEventsRef.current;
      if (events.length === 0 || !userId) return;

      const inserts: IntensityEventInsert[] = events.map((e) => ({
        ...e,
        session_id: sessionId,
        user_id: userId,
      }));

      await insertIntensityEventsBatch(inserts);
      pendingEventsRef.current = [];
    },
    [userId]
  );

  const reset = useCallback(() => {
    setStep(DEFAULT_STEP);
    multiplierRef.current = MULTIPLIER_STEPS[DEFAULT_STEP];
    pendingMultiplierRef.current = MULTIPLIER_STEPS[DEFAULT_STEP];
    pendingEventsRef.current = [];
    sessionStartTimeRef.current = null;
  }, []);

  // ─── Return ─────────────────────────────────────────────────────────────────

  return {
    multiplier,
    intensityStep: step,
    canIncrease,
    canDecrease,
    handleIncrease,
    handleDecrease,
    multiplierRef,
    pendingMultiplierRef,
    notifySessionStart,
    flushEvents,
    reset,
  };
}
