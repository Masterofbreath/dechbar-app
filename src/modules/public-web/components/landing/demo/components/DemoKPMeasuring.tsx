/**
 * DemoKPMeasuring - Active KP Measurement View
 * 
 * Demo version of KPMeasuring with 3 phases:
 * 1. measuring - Timer běží
 * 2. awaiting_next - Intermediate result
 * 3. result - Final average
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { useEffect } from 'react';
import { Button, TextLink } from '@/platform/components';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { useDemoKPEngine } from '../hooks/useDemoKPEngine';

export interface DemoKPMeasuringProps {
  onComplete: (averageKP: number, attempts: number[]) => void;
}

/**
 * DemoKPMeasuring Component
 */
export function DemoKPMeasuring({ onComplete }: DemoKPMeasuringProps) {
  const engine = useDemoKPEngine({
    onComplete,
    onSaveResult: () => {}, // No-op (email modal opened by engine automatically)
  });
  
  // Keyboard shortcuts (match real app)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case ' ': // Space = Stop
          e.preventDefault();
          if (engine.phase === 'measuring') {
            engine.stop();
          }
          break;
          
        case 'Enter': // Enter = Continue/Finish
          e.preventDefault();
          if (engine.phase === 'awaiting_next') {
            const isLastAttempt = engine.currentAttempt >= engine.totalAttempts;
            if (isLastAttempt) {
              engine.finishEarly();
            } else {
              engine.continueNext();
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [engine]);
  
  // Helper: Render content INSIDE circle
  const renderCircleContent = () => {
    switch (engine.phase) {
      case 'measuring':
        return (
          <div className="kp-center__timer">
            {engine.formattedTime}
          </div>
        );
      
      case 'awaiting_next':
        return (
          <div className="kp-center__intermediate-value">
            {engine.lastAttemptValue}s
          </div>
        );
      
      default:
        return <div className="kp-center__circle-placeholder">--</div>;
    }
  };
  
  // Helper: Render button BELOW circle
  const renderButton = () => {
    switch (engine.phase) {
      case 'measuring':
        return (
          <>
            <p className="demo-kp-center__instruction">
              Zadrž dech do prvního signálu
            </p>
            <Button 
              variant="primary" 
              size="lg"
              fullWidth
              onClick={engine.stop}
            >
              Zastavit měření
            </Button>
          </>
        );
      
      case 'awaiting_next': {
        // Dynamic button text
        const getButtonText = () => {
          const nextAttempt = engine.currentAttempt + 1;
          if (nextAttempt === 2) return 'Začít druhé měření';
          if (nextAttempt === 3) return 'Začít poslední měření';
          return 'Další měření';
        };
        
        return (
          <>
            {/* Help Link - "Ukončit měření" only after first measurement */}
            {engine.currentAttempt === 1 && (
              <div className="demo-kp-center__help">
                <TextLink onClick={engine.finishEarly}>
                  Ukončit měření
                </TextLink>
              </div>
            )}
            
            {/* Primary button */}
            <Button 
              variant="primary" 
              fullWidth 
              size="lg"
              onClick={engine.continueNext}
            >
              {getButtonText()}
            </Button>
          </>
        );
      }
      
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Progress indicator (if measuring or awaiting) */}
      {(engine.phase === 'measuring' || engine.phase === 'awaiting_next') && (() => {
        // When awaiting_next show completed attempt, when measuring show current
        const displayAttempt = engine.phase === 'awaiting_next' 
          ? engine.currentAttempt 
          : engine.currentAttempt + 1;
        
        return (
          <div className="demo-kp-center__progress-indicator">
            <p className="demo-kp-center__progress-text">
              Měření {displayAttempt}/{engine.totalAttempts}
            </p>
          </div>
        );
      })()}
      
      {/* Measurement Area - ALWAYS same structure */}
      <div className="demo-kp-center__measurement-area">
        <BreathingCircle variant="static" size={280}>
          {renderCircleContent()}
        </BreathingCircle>
        
        {renderButton()}
      </div>
    </>
  );
}
