/**
 * useKPMeasurementEngine - Headless Hook
 * 
 * Vrací pouze STATE a ACTIONS, ne UI.
 * Umožňuje KPCenter plnou kontrolu nad renderováním.
 * 
 * @package DechBar_App
 * @subpackage Hooks/KP
 * @since 0.3.0
 */

import { useState, useEffect, useRef } from 'react';
import { useKPTimer } from './useKPTimer';
import { calculateAverage, detectDeviceType, validateKPMeasurement } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';
import type { SaveKPData } from '@/platform/api';

/**
 * Engine phase states
 */
export type EnginePhase = 
  | 'measuring'      // Měření probíhá
  | 'awaiting_next'  // Intermediate result - čeká na user
  | 'result';        // Finální výsledek

/**
 * Hook options
 */
export interface UseKPMeasurementEngineOptions {
  attemptsCount: 1 | 3;
  onComplete: (data: SaveKPData) => void;
  previousKP?: number | null;
  isFirst?: boolean;
}

/**
 * useKPMeasurementEngine Hook
 * 
 * @param options - Configuration options
 * @returns State + Actions pro měření
 */
export function useKPMeasurementEngine({ 
  attemptsCount, 
  onComplete, 
}: UseKPMeasurementEngineOptions) {
  const [enginePhase, setEnginePhase] = useState<EnginePhase>('measuring');
  const startTimeRef = useRef<Date>(new Date());
  const { showToast } = useToast();
  
  // MOVED BEFORE useKPTimer to fix temporal dead zone error
  const handleMeasurementComplete = (results: number[]) => {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTimeRef.current.getTime();
    
    const average = calculateAverage(results);
    const validation = validateKPMeasurement(endTime);
    
    const saveData: SaveKPData = {
      value_seconds: average,
      attempt_1_seconds: results[0] || 0,
      attempt_2_seconds: results[1] || undefined,
      attempt_3_seconds: results[2] || undefined,
      attempts_count: results.length as 1 | 2 | 3,
      time_of_day: validation.time_of_day,
      is_morning_measurement: validation.is_morning_measurement,
      is_valid: validation.is_valid,
      hour_of_measurement: validation.hour_of_measurement,
      device_type: detectDeviceType(),
      measurement_duration_ms: durationMs,
      measured_in_context: 'top_nav',
    };
    
    onComplete(saveData);
    setEnginePhase('result');
    
    setTimeout(() => {
      showToast('Hotovo! KP uložena.', 'success');
    }, 2000);
  };
  
  // NOW useKPTimer can safely use handleMeasurementComplete
  const timer = useKPTimer({
    attemptsCount,
    onComplete: (results) => {
      handleMeasurementComplete(results);
    },
    onAttemptComplete: (attemptNumber, value) => {
      console.log(`Attempt ${attemptNumber} complete: ${value}s`);
    },
  });
  
  // Auto-start measuring when hook initializes
  useEffect(() => {
    timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync engine phase with timer state
  useEffect(() => {
    if (timer.state.phase === 'awaiting_next' && enginePhase !== 'awaiting_next') {
      setEnginePhase('awaiting_next');
    }
  }, [timer.state.phase, enginePhase]);
  
  // Return STATE + ACTIONS (ne UI)
  return {
    phase: enginePhase,
    elapsed: timer.state.elapsed,
    currentAttempt: timer.currentAttempt,
    totalAttempts: timer.totalAttempts,
    attempts: timer.state.attempts,
    lastAttemptValue: timer.state.attempts[timer.state.currentAttempt - 1] || 0,
    averageKP: calculateAverage(
      timer.state.attempts.filter((a): a is number => a !== null)
    ),
    // Actions
    stop: timer.stop,
    continueNext: timer.continueNext,
    finishEarly: timer.finishEarly,
  };
}
