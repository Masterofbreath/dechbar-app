/**
 * KPTimer - Visual Timer for KP Measurement
 * 
 * Circular progress bar s breathing animation + large time display.
 * STOP button pro zastavení měření.
 * 
 * @package DechBar_App
 * @subpackage Components/KP
 * @since 0.3.0
 */

import { useEffect, useState } from 'react';
import { Button } from '@/platform/components';
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
  const [breathScale, setBreathScale] = useState(1);
  
  // Breathing animation (pulsing circle)
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathScale(prev => prev === 1 ? 1.1 : 1);
    }, 2000); // 2s cycle (slow, calm)
    
    return () => clearInterval(interval);
  }, []);
  
  const formattedTime = formatTimer(elapsed);
  
  return (
    <div className="kp-timer">
      {/* Header */}
      <div className="kp-timer__header">
        <h3 className="kp-timer__title">Měření {currentAttempt}/{totalAttempts}</h3>
        <p className="kp-timer__instruction">Zadrž dech do prvního signálu</p>
      </div>
      
      {/* Breathing Circle + Time */}
      <div className="kp-timer__circle-container">
        {/* Animated breathing circle */}
        <div 
          className="kp-timer__circle"
          style={{ 
            transform: `scale(${breathScale})`,
            transition: 'transform 2s ease-in-out',
          }}
        >
          {/* Time Display */}
          <div className="kp-timer__time">
            {formattedTime}
          </div>
        </div>
      </div>
      
      {/* STOP Button */}
      <div className="kp-timer__stop-container">
        <Button 
          variant="primary" 
          size="lg"
          onClick={onStop}
          className="kp-timer__stop-button"
        >
          STOP
        </Button>
      </div>
      
      {/* Hint */}
      <p className="kp-timer__hint">
        Zastav při prvním pocitu potřeby nadechnout
      </p>
    </div>
  );
}
