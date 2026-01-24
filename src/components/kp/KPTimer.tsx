/**
 * KPTimer - Visual Timer for KP Measurement
 * 
 * Static breathing circle + large time display.
 * "Zastavit měření" button.
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { Button } from '@/platform/components';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { formatTimer } from '@/utils/kp';

export interface KPTimerProps {
  /**
   * Elapsed time in milliseconds
   */
  elapsed: number;
  
  /**
   * Current attempt number (1-3)
   */
  currentAttempt: number;
  
  /**
   * Total attempts count
   */
  totalAttempts: number;
  
  /**
   * Callback pro zastavení měření
   */
  onStop: () => void;
}

/**
 * KPTimer Component
 * 
 * @example
 * <KPTimer 
 *   elapsed={35000} 
 *   currentAttempt={1} 
 *   totalAttempts={3}
 *   onStop={() => console.log('Stopped')} 
 * />
 */
export function KPTimer({ elapsed, currentAttempt, totalAttempts, onStop }: KPTimerProps) {
  const formattedTime = formatTimer(elapsed);
  
  return (
    <div className="kp-timer">
      {/* Header */}
      <div className="kp-timer__header">
        <h3 className="kp-timer__title">Měření {currentAttempt}/{totalAttempts}</h3>
        <p className="kp-timer__instruction">Zadrž dech do prvního signálu</p>
      </div>
      
      {/* Static Breathing Circle + Time */}
      <div className="kp-timer__circle-container">
        <BreathingCircle variant="static" size={280}>
          <div className="kp-timer__time">{formattedTime}</div>
        </BreathingCircle>
      </div>
      
      {/* Stop Button */}
      <div className="kp-timer__stop-container">
        <Button 
          variant="primary" 
          size="lg"
          onClick={onStop}
          className="kp-timer__stop-button"
        >
          Zastavit měření
        </Button>
      </div>
      
      {/* Hint */}
      <p className="kp-timer__hint">
        Stop při prvním signálu od těla
      </p>
    </div>
  );
}
