/**
 * useKPTimer - Timer State Machine for KP Measurement
 * 
 * State machine řídící celý flow měření (v2 - user control):
 * idle -> measuring -> awaiting_next -> measuring -> ... -> completed
 * 
 * @package DechBar_App
 * @subpackage Hooks/KP
 * @since 0.3.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Timer phase states (v2 - user control)
 */
export type TimerPhase = 
  | 'idle'           // Neaktivní
  | 'measuring'      // Měření probíhá (stopky běží)
  | 'awaiting_next'  // Čeká na user akci (místo auto-countdown)
  | 'completed';     // Všechny pokusy dokončeny

/**
 * Timer state interface
 */
export interface TimerState {
  phase: TimerPhase;
  elapsed: number;              // Uplynulý čas v ms (během measuring)
  currentAttempt: number;       // Aktuální pokus (1-3)
  attempts: (number | null)[];  // Výsledky pokusů [33, 36, null]
  pauseCountdown: number;       // Countdown pauzy (15 -> 0)
}

/**
 * Hook options
 */
export interface UseKPTimerOptions {
  /**
   * Kolik pokusů provést (1 nebo 3)
   * @default 3
   */
  attemptsCount: 1 | 3;
  
  /**
   * Callback po dokončení všech měření
   */
  onComplete?: (results: number[]) => void;
  
  /**
   * Callback po dokončení jednotlivého pokusu
   */
  onAttemptComplete?: (attemptNumber: number, value: number) => void;
}

/**
 * useKPTimer Hook
 * 
 * @param options - Configuration options
 * @returns Timer state and controls
 * 
 * @example
 * const timer = useKPTimer({
 *   attemptsCount: 3,
 *   onComplete: (results) => console.log('Done:', results),
 * });
 * 
 * timer.start(); // Začne měření
 * timer.stop();  // Zastaví aktuální pokus
 * timer.reset(); // Reset celého timeru
 */
export function useKPTimer({ 
  attemptsCount = 3, 
  onComplete,
  onAttemptComplete,
}: UseKPTimerOptions) {
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    elapsed: 0,
    currentAttempt: 0,
    attempts: Array(attemptsCount).fill(null),
    pauseCountdown: 0,
  });
  
  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pauseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  /**
   * Clear all intervals
   */
  const clearIntervals = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (pauseIntervalRef.current) {
      clearInterval(pauseIntervalRef.current);
      pauseIntervalRef.current = null;
    }
  }, []);
  
  /**
   * Start timer (measuring phase)
   */
  const startMeasuring = useCallback(() => {
    clearIntervals();
    startTimeRef.current = Date.now();
    
    setState(prev => ({
      ...prev,
      phase: 'measuring',
      elapsed: 0,
    }));
    
    // Update elapsed time každých 10ms
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setState(prev => ({
        ...prev,
        elapsed,
      }));
    }, 10);
  }, [clearIntervals]);
  
  /**
   * Stop current measurement attempt
   */
  const stop = useCallback(() => {
    if (state.phase !== 'measuring') return;
    
    clearIntervals();
    const finalElapsed = Math.floor(state.elapsed / 1000); // Convert to seconds
    const attemptNumber = state.currentAttempt + 1;
    
    // Update attempts array
    const newAttempts = [...state.attempts];
    newAttempts[state.currentAttempt] = finalElapsed;
    
    // Callback po dokončení pokusu
    onAttemptComplete?.(attemptNumber, finalElapsed);
    
    // Check if all attempts completed
    const isLastAttempt = attemptNumber >= attemptsCount;
    
    if (isLastAttempt) {
      // Všechny pokusy hotovo
      setState(prev => ({
        ...prev,
        phase: 'completed',
        attempts: newAttempts,
      }));
      
      // Callback s výsledky
      const validResults = newAttempts.filter((a): a is number => a !== null);
      onComplete?.(validResults);
    } else {
      // Přejít do 'awaiting_next' - čeká na user akci (manual start)
      const nextAttemptNum = state.currentAttempt + 1;
      setState({
        phase: 'awaiting_next',
        elapsed: 0,
        attempts: newAttempts,
        currentAttempt: nextAttemptNum,
        pauseCountdown: 0,
      });
    }
  }, [state, attemptsCount, onComplete, onAttemptComplete, clearIntervals]);
  
  /**
   * Start timer (initial call - begins measuring immediately)
   */
  const start = useCallback(() => {
    if (state.phase !== 'idle') return;
    
    // Připravit state
    setState({
      phase: 'idle', // Will transition to measuring immediately
      elapsed: 0,
      currentAttempt: 0,
      attempts: Array(attemptsCount).fill(null),
      pauseCountdown: 0,
    });
    
    // Start measuring okamžitě
    startMeasuring();
  }, [state.phase, attemptsCount, startMeasuring]);
  
  /**
   * Reset timer to idle
   */
  const reset = useCallback(() => {
    clearIntervals();
    setState({
      phase: 'idle',
      elapsed: 0,
      currentAttempt: 0,
      attempts: Array(attemptsCount).fill(null),
      pauseCountdown: 0,
    });
  }, [attemptsCount, clearIntervals]);
  
  /**
   * Continue to next measurement (manual user action)
   */
  const continueNext = useCallback(() => {
    if (state.phase !== 'awaiting_next') return;
    
    // Spustit další měření
    startMeasuring();
  }, [state.phase, startMeasuring]);
  
  /**
   * Finish measurements early (user doesn't want full count)
   */
  const finishEarly = useCallback(() => {
    if (state.phase !== 'awaiting_next') return;
    
    // Ukončit měření předčasně
    setState(prev => ({
      ...prev,
      phase: 'completed',
    }));
    
    // Callback s dosavadními výsledky
    const validResults = state.attempts
      .filter((a): a is number => a !== null);
    onComplete?.(validResults);
  }, [state, onComplete]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, [clearIntervals]);
  
  return {
    state,
    start,
    stop,
    reset,
    continueNext,
    finishEarly,
    currentAttempt: state.currentAttempt + 1, // 1-based for UI
    totalAttempts: attemptsCount,
  };
}
