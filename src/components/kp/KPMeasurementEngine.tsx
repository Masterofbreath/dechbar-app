/**
 * KPMeasurementEngine - Main Measurement Flow Controller (V2 - User Control)
 * 
 * Orchestruje celý flow měření:
 * 1. Measuring (timer běží) - AUTO-START
 * 2. Awaiting Next (intermediate result - čeká na user)
 * 3. Result (zobrazení finálního výsledku)
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { useState, useEffect, useRef } from 'react';
import { useKPTimer } from '@/hooks/kp';
import { calculateAverage } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';
import type { SaveKPData } from '@/platform/api';
import { Button } from '@/platform/components';
import { KPTimer } from './KPTimer';
import { KPResult } from './KPResult';

export interface KPMeasurementEngineProps {
  /**
   * Number of attempts (from Settings / localStorage)
   */
  attemptsCount: 1 | 3;
  
  /**
   * Callback po dokončení měření s daty pro uložení
   */
  onComplete: (data: SaveKPData) => void;
  
  /**
   * Previous KP value (for trend calculation)
   */
  previousKP?: number | null;
  
  /**
   * Is this the first measurement ever?
   */
  isFirst?: boolean;
}

/**
 * Engine phase states (v2 - user control)
 */
type EnginePhase = 
  | 'measuring'      // Měření probíhá
  | 'awaiting_next'  // Intermediate result - čeká na user
  | 'result';        // Finální výsledek

/**
 * KPMeasurementEngine Component
 */
export function KPMeasurementEngine({ 
  attemptsCount, // Now from props (Settings/localStorage)
  onComplete, 
  previousKP = null,
  isFirst = false,
}: KPMeasurementEngineProps) {
  const [enginePhase, setEnginePhase] = useState<EnginePhase>('measuring');
  const startTimeRef = useRef<Date>(new Date()); // Use ref instead of state
  const { showToast } = useToast();
  
  const timer = useKPTimer({
    attemptsCount,
    onComplete: (results) => {
      // Všechna měření dokončena
      handleMeasurementComplete(results);
    },
    onAttemptComplete: (attemptNumber, value) => {
      console.log(`Attempt ${attemptNumber} complete: ${value}s`);
    },
  });
  
  /**
   * Auto-start measuring when component mounts
   */
  useEffect(() => {
    timer.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  /**
   * Sync engine phase with timer state (awaiting_next)
   */
  useEffect(() => {
    if (timer.state.phase === 'awaiting_next' && enginePhase !== 'awaiting_next') {
      setEnginePhase('awaiting_next');
    }
  }, [timer.state.phase, enginePhase]);
  
  /**
   * Sync engine phase with timer state (awaiting_next)
   */
  useEffect(() => {
    if (timer.state.phase === 'awaiting_next' && enginePhase !== 'awaiting_next') {
      setEnginePhase('awaiting_next');
    }
  }, [timer.state.phase, enginePhase]);
  
  /**
   * Handle measurement complete (all attempts done)
   */
  const handleMeasurementComplete = (results: number[]) => {
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTimeRef.current.getTime();
    
    // Vypočítat průměr
    const average = calculateAverage(results);
    
    // Validace času měření
    const validation = validateKPMeasurement(endTime);
    
    // Připravit data pro uložení
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
    
    // Zavolat onComplete callback
    onComplete(saveData);
    
    // Zobrazit result screen
    setEnginePhase('result');
    
    // Toast notification po 2s
    setTimeout(() => {
      showToast('Hotovo! KP uložena.', 'success');
    }, 2000);
  };
  
  // Render current phase
  switch (enginePhase) {
    case 'measuring':
      return (
        <KPTimer 
          elapsed={timer.state.elapsed}
          currentAttempt={timer.currentAttempt}
          totalAttempts={timer.totalAttempts}
          onStop={timer.stop}
        />
      );
    
    case 'awaiting_next': {
      // Intermediate result - zobrazit aktuální pokus + button "Další měření"
      const lastAttemptValue = timer.state.attempts[timer.state.currentAttempt - 1] || 0;
      const isLastAttempt = timer.currentAttempt >= timer.totalAttempts;
      
      return (
        <div className="kp-engine-intermediate-result">
          {/* Velké číslo - hodnota právě dokončeného pokusu */}
          <div className="kp-result__value">{lastAttemptValue}s</div>
          
          {/* Progress indicator */}
          <p className="kp-result__subtitle">
            {timer.currentAttempt}/{timer.totalAttempts} hotovo
          </p>
          
          {/* CTA - Další měření nebo Hotovo */}
          <div className="kp-result__actions">
            {!isLastAttempt ? (
              // Pokud není poslední pokus → "Další měření"
              <>
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="lg"
                  onClick={() => timer.continueNext()}
                >
                  Další měření
                </Button>
                
                {/* Optional: možnost ukončit předčasně */}
                <Button 
                  variant="ghost" 
                  fullWidth 
                  size="md"
                  onClick={() => timer.finishEarly()}
                  className="kp-result__finish-early"
                >
                  Hotovo (ukončit měření)
                </Button>
              </>
            ) : (
              // Poslední pokus → "Hotovo"
              <Button 
                variant="primary" 
                fullWidth 
                size="lg"
                onClick={() => timer.finishEarly()}
              >
                Hotovo
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    case 'result': {
      const validResults = timer.state.attempts.filter((a): a is number => a !== null);
      const finalValue = calculateAverage(validResults);
      
      return (
        <KPResult 
          value={finalValue}
          isFirst={isFirst}
          previousKP={previousKP}
          attempts={timer.state.attempts}
          onClose={onComplete as () => void}
        />
      );
    }
    
    default:
      return null;
  }
}
