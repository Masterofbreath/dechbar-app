/**
 * KPMeasurementEngine - Main Measurement Flow Controller
 * 
 * Orchestruje celý flow měření:
 * 1. Settings (1x vs 3x)
 * 2. Preparing (3 nádechy)
 * 3. Measuring (timer běží)
 * 4. Paused (15s countdown mezi pokusy)
 * 5. Result (zobrazení výsledku)
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { useState } from 'react';
import { useKPTimer } from '@/hooks/kp';
import { calculateAverage, detectDeviceType, validateKPMeasurement } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';
import type { SaveKPData } from '@/platform/api';
import { KPSettingsPanel } from './KPSettingsPanel';
import { KPTimer } from './KPTimer';
import { KPResult } from './KPResult';
import { Button } from '@/platform/components';

export interface KPMeasurementEngineProps {
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
 * Engine phase states
 */
type EnginePhase = 
  | 'settings'    // Výběr 1x vs 3x
  | 'preparing'   // Příprava (instrukce)
  | 'measuring'   // Měření probíhá
  | 'paused'      // Pauza mezi pokusy
  | 'result';     // Výsledek

/**
 * KPMeasurementEngine Component
 */
export function KPMeasurementEngine({ 
  onComplete, 
  previousKP = null,
  isFirst = false,
}: KPMeasurementEngineProps) {
  const [enginePhase, setEnginePhase] = useState<EnginePhase>('settings');
  const [attemptsCount, setAttemptsCount] = useState<1 | 3>(3);
  const [startTime, setStartTime] = useState<Date | null>(null);
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
   * Handle settings confirmed
   */
  const handleSettingsConfirm = (count: 1 | 3) => {
    setAttemptsCount(count);
    setEnginePhase('preparing');
  };
  
  /**
   * Handle start measurement
   */
  const handleStartMeasurement = () => {
    setStartTime(new Date());
    setEnginePhase('measuring');
    timer.start();
  };
  
  /**
   * Handle measurement complete (all attempts done)
   */
  const handleMeasurementComplete = (results: number[]) => {
    const endTime = new Date();
    const durationMs = startTime ? endTime.getTime() - startTime.getTime() : 0;
    
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
  
  /**
   * Sync engine phase with timer state
   * Removed: Causes cascading renders. Phase sync handled in timer callbacks.
   */
  
  // Render current phase
  switch (enginePhase) {
    case 'settings':
      return (
        <KPSettingsPanel 
          onStart={handleSettingsConfirm}
          defaultAttempts={3}
        />
      );
    
    case 'preparing':
      return (
        <div className="kp-engine-preparing">
          <h2 className="kp-engine-preparing__title">Připrav se</h2>
          <p className="kp-engine-preparing__instruction">
            Udělej 3 klidné nádechy a výdechy
          </p>
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleStartMeasurement}
          >
            Jsem ready
          </Button>
        </div>
      );
    
    case 'measuring':
      return (
        <KPTimer 
          elapsed={timer.state.elapsed}
          currentAttempt={timer.currentAttempt}
          totalAttempts={timer.totalAttempts}
          onStop={timer.stop}
        />
      );
    
    case 'paused': {
      const lastAttemptValue = timer.state.attempts[timer.state.currentAttempt - 1] || 0;
      return (
        <div className="kp-engine-paused">
          <h2 className="kp-engine-paused__title">
            {formatSeconds(lastAttemptValue)}
          </h2>
          <p className="kp-engine-paused__subtitle">
            {timer.currentAttempt}/{timer.totalAttempts} hotovo
          </p>
          <div className="kp-engine-paused__countdown">
            <p>Další měření za</p>
            <div className="kp-engine-paused__countdown-value">
              {timer.state.pauseCountdown}s
            </div>
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
