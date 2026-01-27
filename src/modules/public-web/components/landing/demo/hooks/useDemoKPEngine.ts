/**
 * useDemoKPEngine - Demo Measurement Engine (No Supabase)
 * 
 * Simplified version of useKPMeasurementEngine for demo mockup.
 * - Always 3 attempts (locked, no user preference)
 * - No Supabase save (triggers conversion modal instead)
 * - Same logic, different outcome
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Hooks
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Timer state machine (simplified)
 */
interface TimerState {
  phase: 'idle' | 'measuring' | 'awaiting_next';
  elapsed: number;
  currentAttempt: number;
  attempts: (number | null)[];
}

/**
 * Engine phase (what UI shows)
 * Note: 'result' phase removed - user goes straight to email modal
 */
export type DemoKPPhase = 
  | 'measuring'      // Timer běží
  | 'awaiting_next'; // Intermediate result

/**
 * Hook options
 */
export interface UseDemoKPEngineOptions {
  onComplete: (averageKP: number, attempts: number[]) => void;
  onSaveResult: () => void;
}

/**
 * Calculate average from valid attempts
 */
function calculateAverage(attempts: (number | null)[]): number {
  const valid = attempts.filter((a): a is number => a !== null && a > 0);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / valid.length);
}

/**
 * Format milliseconds to seconds (35s format)
 */
function formatTimerSeconds(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
}

/**
 * useDemoKPEngine Hook
 */
export function useDemoKPEngine({ onComplete, onSaveResult }: UseDemoKPEngineOptions) {
  const [enginePhase, setEnginePhase] = useState<DemoKPPhase>('measuring');
  const [timerState, setTimerState] = useState<TimerState>({
    phase: 'idle',
    elapsed: 0,
    currentAttempt: 0,
    attempts: [null, null, null], // Always 3 attempts
  });
  
  const intervalRef = useRef<number | null>(null);
  
  const totalAttempts = 3; // Locked for demo
  
  /**
   * Start timer (auto-called on mount)
   */
  const start = () => {
    if (timerState.phase === 'measuring') return;
    
    setTimerState(prev => ({
      ...prev,
      phase: 'measuring',
      elapsed: 0,
    }));
    
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsed: Date.now() - startTime,
      }));
    }, 10); // 10ms precision
  };
  
  /**
   * Stop timer (user clicked "Zastavit měření")
   */
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const seconds = Math.round(timerState.elapsed / 1000);
    
    setTimerState(prev => {
      const newAttempts = [...prev.attempts];
      newAttempts[prev.currentAttempt] = seconds;
      
      const newCurrentAttempt = prev.currentAttempt + 1;
      
      // Check if this was the LAST attempt
      const isLastAttempt = newCurrentAttempt >= totalAttempts;
      
      return {
        ...prev,
        phase: isLastAttempt ? 'idle' : 'awaiting_next',
        attempts: newAttempts,
        currentAttempt: newCurrentAttempt,
      };
    });
    
    // ✅ OPTIMIZED FLOW: If last attempt, open email modal immediately (skip result screen)
    const isLastAttempt = timerState.currentAttempt + 1 >= totalAttempts;
    if (isLastAttempt) {
      // Store completion data
      const newAttempts = [...timerState.attempts];
      newAttempts[timerState.currentAttempt] = seconds;
      const validAttempts = newAttempts.filter((a): a is number => a !== null && a > 0);
      const average = calculateAverage(newAttempts);
      onComplete(average, validAttempts);
      
      // Open email modal immediately (no result screen)
      onSaveResult();
    } else {
      setEnginePhase('awaiting_next');
    }
  };
  
  /**
   * Continue to next attempt
   */
  const continueNext = () => {
    // Check if all attempts done (currentAttempt already incremented in stop())
    if (timerState.currentAttempt >= totalAttempts) {
      finishEarly();
      return;
    }
    
    // Reset for next attempt (currentAttempt is already correct)
    setTimerState(prev => ({
      ...prev,
      phase: 'measuring',
      elapsed: 0,
    }));
    
    setEnginePhase('measuring');
    
    // Start timer again
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      setTimerState(prev => ({
        ...prev,
        elapsed: Date.now() - startTime,
      }));
    }, 10);
  };
  
  /**
   * Finish early (user clicked "Ukončit měření")
   * ✅ OPTIMIZED FLOW: Open email modal immediately (skip result screen)
   */
  const finishEarly = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const validAttempts = timerState.attempts.filter((a): a is number => a !== null && a > 0);
    const average = calculateAverage(timerState.attempts);
    
    // Store completion data
    onComplete(average, validAttempts);
    
    // Open email modal immediately (no result screen)
    onSaveResult();
  };
  
  /**
   * Auto-start on mount
   */
  useEffect(() => {
    start();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Computed values
   */
  const lastAttemptValue = timerState.currentAttempt > 0 
    ? (timerState.attempts[timerState.currentAttempt - 1] ?? 0)
    : 0;
  
  const averageKP = calculateAverage(timerState.attempts);
  
  return {
    // State
    phase: enginePhase,
    elapsed: timerState.elapsed,
    currentAttempt: timerState.currentAttempt,
    totalAttempts,
    attempts: timerState.attempts,
    lastAttemptValue,
    averageKP,
    
    // Formatted values
    formattedTime: formatTimerSeconds(timerState.elapsed),
    
    // Actions
    stop,
    continueNext,
    finishEarly,
  };
}
