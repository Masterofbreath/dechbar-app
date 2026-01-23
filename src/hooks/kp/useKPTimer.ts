/**
 * useKPTimer - Timer State Machine for KP Measurement
 * 
 * State machine řídící celý flow měření:
 * idle -> preparing -> measuring -> paused (15s) -> measuring -> ... -> completed
 * 
 * @package DechBar_App
 * @subpackage Hooks/KP
 * @since 0.3.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Timer phase states
 */
export type TimerPhase = 
  | 'idle'           // Neaktivní
  | 'preparing'      // Příprava (3 nádechy countdown)
  | 'measuring'      // Měření probíhá (stopky běží)
  | 'paused'         // Pauza mezi pokusy (15s countdown)
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
      // Start 15s pauzy před dalším pokusem
      const nextAttemptNum = state.currentAttempt + 1;
      setState({
        phase: 'paused',
        elapsed: 0,
        attempts: newAttempts,
        currentAttempt: nextAttemptNum,
        pauseCountdown: 15,
      });
      
      // Countdown pauzy
      pauseIntervalRef.current = setInterval(() => {
        setState(prev => {
          const newCountdown = prev.pauseCountdown - 1;
          
          // Auto-start dalšího měření po countdown
          if (newCountdown <= 0) {
            clearInterval(pauseIntervalRef.current!);
            pauseIntervalRef.current = null;
            
            // Auto-start dalšího pokusu
            setTimeout(() => startMeasuring(), 100);
            
            return {
              ...prev,
              pauseCountdown: 0,
            };
          }
          
          return {
            ...prev,
            pauseCountdown: newCountdown,
          };
        });
      }, 1000);
    }
  }, [state, attemptsCount, onComplete, onAttemptComplete, clearIntervals, startMeasuring]);
  
  /**
   * Start timer (initial call)
   */
  const start = useCallback(() => {
    if (state.phase !== 'idle') return;
    
    // Připravit state
    setState({
      phase: 'preparing',
      elapsed: 0,
      currentAttempt: 0,
      attempts: Array(attemptsCount).fill(null),
      pauseCountdown: 0,
    });
    
    // Auto-start measuring po 500ms (uživatel má čas se připravit)
    setTimeout(() => startMeasuring(), 500);
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
    currentAttempt: state.currentAttempt + 1, // 1-based for UI
    totalAttempts: attemptsCount,
  };
}
