/**
 * KPMeasuring - Active KP measurement view
 * 
 * Handles the entire KP measurement flow with stable layout
 * 
 * @package DechBar_App
 * @subpackage Platform/Components/KP/Views
 * @since 0.3.0
 */

import { useEffect } from 'react';
import { useKPMeasurementEngine } from '@/hooks/kp';
import { BreathingCircle } from '@/components/shared/BreathingCircle';
import { MiniTip } from '../../shared/MiniTip';
import { Button, TextLink } from '@/platform/components';
import type { SaveKPData } from '@/platform/api';
import { formatTimerSeconds } from '@/utils/kp';

export interface KPMeasuringProps {
  attemptsCount: 1 | 3;
  onComplete: (data: SaveKPData) => void;
  onClose: () => void;
}

export function KPMeasuring({ 
  attemptsCount, 
  onComplete,
  onClose,
}: KPMeasuringProps) {
  const engine = useKPMeasurementEngine({
    attemptsCount,
    onComplete,
  });
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      switch (e.key) {
        case ' ': // Space = Start/Stop
          e.preventDefault();
          if (engine.phase === 'measuring') {
            engine.stop();
          }
          break;
          
        case 'Enter': // Enter = Continue next / Finish
          e.preventDefault();
          if (engine.phase === 'awaiting_next') {
            const isLastAttempt = engine.currentAttempt >= engine.totalAttempts;
            if (isLastAttempt) {
              engine.finishEarly();
            } else {
              engine.continueNext();
            }
          } else if (engine.phase === 'result') {
            onClose();
          }
          break;
          
        case 'Escape': // Esc = Close modal (only in result view)
          if (engine.phase === 'result') {
            onClose();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [engine, onClose]);
  
  // Helper: Render content INSIDE circle
  const renderCircleContent = () => {
    switch (engine.phase) {
      case 'measuring':
        return (
          <div className="kp-center__timer">
            {formatTimerSeconds(engine.elapsed)}
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
            <p className="kp-center__instruction">
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
          return 'Další měření';  // Fallback
        };
        
        const handleContinueNext = () => {
          console.log('[DEBUG] Další měření clicked');
          console.log('[DEBUG] Engine phase:', engine.phase);
          console.log('[DEBUG] Current attempt:', engine.currentAttempt);
          console.log('[DEBUG] Total attempts:', engine.totalAttempts);
          console.log('[DEBUG] Is last attempt:', isLastAttempt);
          console.log('[DEBUG] Next attempt will be:', engine.currentAttempt + 1);
          engine.continueNext();
        };
        
        return (
          <>
            {/* Help Link - "Ukončit měření" only after first measurement */}
            {!isLastAttempt && engine.currentAttempt === 1 && (
              <div className="kp-center__help">
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
              onClick={isLastAttempt ? engine.finishEarly : handleContinueNext}
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
            onClick={onClose}
          >
            Zavřít
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
          <div className="kp-center__progress-indicator">
            <p className="kp-center__progress-text">
              Měření {displayAttempt}/{engine.totalAttempts}
            </p>
          </div>
        );
      })()}
      
      {/* Result message (when phase === 'result') - ABOVE measurement area */}
      {engine.phase === 'result' && (() => {
        const validCount = engine.attempts.filter((a): a is number => a !== null).length;
        const isSingleMeasurement = validCount === 1;
        
        return (
          <p className="kp-center__result-message">
            <strong>Máš změřeno!</strong>
            {isSingleMeasurement 
              ? 'Toto je tvůj výsledek z jednoho měření. Pro přesnější hodnotu proveď tři měření.'
              : 'Toto číslo je průměr ze všech tří měření. Trénuj, změř znovu za týden a sleduj svůj pokrok.'
            }
          </p>
        );
      })()}
      
      {/* Measurement Area - ALWAYS same structure */}
      <div className="kp-center__measurement-area">
        <BreathingCircle variant="static" size={280}>
          {renderCircleContent()}
        </BreathingCircle>
        
        {renderButton()}
        
        {/* Tip BELOW button (same as in instructions) - only for result view */}
        {engine.phase === 'result' && (() => {
          // Time detection: Show tip if NOT between 4:00-8:59 (ideal time)
          // Show tip: 9:00-23:59 + 0:00-3:59
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
