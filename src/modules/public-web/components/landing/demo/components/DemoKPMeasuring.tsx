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
import { MiniTip } from '@/platform/components/shared/MiniTip';
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
      
      case 'result':
        return (
          <div className="kp-center__final-value">
            {engine.averageKP}s
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
        const isLastAttempt = engine.currentAttempt >= engine.totalAttempts;
        
        // Dynamic button text
        const getButtonText = () => {
          if (isLastAttempt) return 'Hotovo';
          
          const nextAttempt = engine.currentAttempt + 1;
          if (nextAttempt === 2) return 'Začít druhé měření';
          if (nextAttempt === 3) return 'Začít poslední měření';
          return 'Další měření';
        };
        
        return (
          <>
            {/* Help Link - "Ukončit měření" only after first measurement */}
            {!isLastAttempt && engine.currentAttempt === 1 && (
              <div className="demo-kp-center__help">
                <TextLink onClick={engine.finishEarly}>
                  Ukončit měření
                </TextLink>
              </div>
            )}
            
            {/* Primary button - ALWAYS in same position */}
            <Button 
              variant="primary" 
              fullWidth 
              size="lg"
              onClick={isLastAttempt ? engine.finishEarly : engine.continueNext}
            >
              {getButtonText()}
            </Button>
          </>
        );
      }
      
      case 'result':
        return (
          <Button 
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              // Conversion will be triggered by onComplete callback
              // This button just ensures UI consistency
            }}
          >
            Uložit a registrovat se
          </Button>
        );
      
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
      
      {/* Result message (when phase === 'result') - ABOVE measurement area */}
      {engine.phase === 'result' && (() => {
        const validCount = engine.attempts.filter((a): a is number => a !== null && a > 0).length;
        const isSingleMeasurement = validCount === 1;
        
        return (
          <p className="demo-kp-center__result-message">
            <strong>Máš změřeno!</strong>
            {isSingleMeasurement 
              ? ' Toto je tvůj výsledek z jednoho měření. Pro přesnější hodnotu proveď tři měření.'
              : ' Toto číslo je průměr ze všech tří měření. Trénuj, změř znovu za týden a sleduj svůj pokrok.'
            }
          </p>
        );
      })()}
      
      {/* Measurement Area - ALWAYS same structure */}
      <div className="demo-kp-center__measurement-area">
        <BreathingCircle variant="static" size={280}>
          {renderCircleContent()}
        </BreathingCircle>
        
        {renderButton()}
        
        {/* Tip BELOW button (same as in instructions) - only for result view */}
        {engine.phase === 'result' && (() => {
          const now = new Date();
          const hour = now.getHours();
          const shouldShowTimeTip = hour >= 9 || hour < 4;
          
          if (!shouldShowTimeTip) return null;
          
          return (
            <MiniTip variant="absolute">
              <strong>Tip:</strong> Pro nejpřesnější výsledky měř KP ráno hned po probuzení.
            </MiniTip>
          );
        })()}
      </div>
    </>
  );
}
