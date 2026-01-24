/**
 * KPCenter - Kontrolní Pauza Measurement & History
 * 
 * Modal for:
 * - Starting new KP measurement test
 * - Viewing current KP value + trend
 * - History timeline
 * - Integration with Pokrok module stats
 * 
 * @package DechBar_App
 * @subpackage Platform/Components
 * @since 0.3.0
 */

import { useState, useEffect } from 'react';
import { useNavigation } from '@/platform/hooks';
import { useKPMeasurements } from '@/platform/api';
import { useKPMeasurementEngine } from '@/hooks/kp';
import { CloseButton } from '@/components/shared';
import { MiniTip } from './shared/MiniTip';
import { Button, TextLink } from '@/platform/components';
import { 
  StaticBreathingCircle,
} from '@/components/kp';
import type { SaveKPData } from '@/platform/api';
import { formatSeconds, formatTrend, formatTimer, getKPMeasurementsCount } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';

/**
 * View modes for KPCenter (v3 - stable layout)
 */
type ViewMode = 'ready' | 'instructions' | 'measuring';

/**
 * MeasuringView - Renders measurement UI in stable layout
 * Circle VŽDY na stejné pozici, mění se pouze OBSAH uvnitř
 */
interface MeasuringViewProps {
  attemptsCount: 1 | 3;
  onComplete: (data: SaveKPData) => void;
  onClose: () => void;  // ✅ Pro zavření modalu
}

function MeasuringView({ 
  attemptsCount, 
  onComplete,
  onClose,
}: MeasuringViewProps) {
  const engine = useKPMeasurementEngine({
    attemptsCount,
    onComplete,
  });
  
  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorovat pokud user píše do inputu
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
          
        case 'Escape': // Esc = Close modal (jen v result view)
          if (engine.phase === 'result') {
            onClose();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [engine, onClose]);
  
  // Helper: Render obsah UVNITŘ circle
  const renderCircleContent = () => {
    switch (engine.phase) {
      case 'measuring':
        return (
          <div className="kp-center__timer">
            {formatTimer(engine.elapsed)}
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
  
  // Helper: Render button POD circle
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
        
        // ✅ Dynamický text podle pokusu
        const getButtonText = () => {
          if (isLastAttempt) return 'Hotovo';
          
          // currentAttempt je nyní 0-based během measuring, 1-based po stop()
          // Po prvním stop(): currentAttempt = 1, chceme "Začít druhé měření"
          const nextAttempt = engine.currentAttempt + 1;
          if (nextAttempt === 2) return 'Začít druhé měření';
          if (nextAttempt === 3) return 'Začít poslední měření';
          return 'Další měření';  // Fallback
        };
        
        // Debug handler pro "Další měření"
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
            {/* Help Link - "Ukončit měření" jen po prvním měření */}
            {!isLastAttempt && engine.currentAttempt === 1 && (
              <div className="kp-center__help">
                <TextLink onClick={engine.finishEarly}>
                  Ukončit měření
                </TextLink>
              </div>
            )}
            
            {/* Primary button - VŽDY na stejné pozici */}
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
      {/* Progress indicator (pokud measuring nebo awaiting) */}
      {(engine.phase === 'measuring' || engine.phase === 'awaiting_next') && (() => {
        // Při awaiting_next zobrazit dokončený pokus, při measuring aktuální
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
      
      {/* ✅ Result message (když phase === 'result') - NAD measurement area */}
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
      
      {/* Measurement Area - VŽDY stejná struktura */}
      <div className="kp-center__measurement-area">
        <StaticBreathingCircle>
          {renderCircleContent()}
        </StaticBreathingCircle>
        
        {renderButton()}
        
        {/* ✅ Tip POD tlačítkem (stejně jako v instructions) - pouze pro result view */}
        {engine.phase === 'result' && (() => {
          // Detekce času měření: Zobraz tip pokud NENÍ mezi 4:00-8:59 (ideální čas)
          // Tip zobrazujeme: 9:00-23:59 + 0:00-3:59
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

/**
 * KPCenter Component
 */
export function KPCenter() {
  const { isKPDetailOpen, closeKPDetail } = useNavigation();
  const { currentKP, measurements, saveKP, isSaving } = useKPMeasurements();
  const { showToast } = useToast();
  
  // Always start in 'ready' mode (simplified flow)
  const [viewMode, setViewMode] = useState<ViewMode>('ready');
  
  // Get user preference from Settings (default 3x)
  const attemptsCount = getKPMeasurementsCount();
  
  /**
   * Reset viewMode when modal closes
   * Fixes: Auto-start bug when reopening modal
   */
  useEffect(() => {
    if (!isKPDetailOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewMode('ready');
    }
  }, [isKPDetailOpen]);
  
  /**
   * Handle start measurement (simplified - no warnings)
   */
  const handleStartMeasurement = () => {
    setViewMode('measuring');
  };
  
  /**
   * Handle measurement complete
   */
  const handleMeasurementComplete = async (data: SaveKPData) => {
    try {
      await saveKP(data);
      setViewMode('ready'); // Return to ready view
      
      // Toast notification zobrazí se automaticky v KPMeasurementEngine
    } catch (error) {
      console.error('Error saving KP:', error);
      showToast('Chyba při ukládání KP. Zkus to znovu.', 'error');
    }
  };
  
  /**
   * Calculate trend
   */
  const getPreviousKP = () => {
    if (measurements.length < 2) return null;
    const validMeasurements = measurements.filter(m => m.is_valid);
    return validMeasurements[1]?.value_seconds || null;
  };
  
  const previousKP = getPreviousKP();
  const trend = currentKP && previousKP ? currentKP - previousKP : 0;
  
  if (!isKPDetailOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={closeKPDetail}>
      <div className="kp-center" onClick={e => e.stopPropagation()}>
        <CloseButton onClick={closeKPDetail} />
        
        {/* Ready View - Static Circle + Start Button */}
        {viewMode === 'ready' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza</h2>
            
            {/* ✅ Popis KP */}
            <p className="kp-center__description">
              Změř svou dechovou kondici a sleduj svůj pokrok.
            </p>
            
            {/* Static Breathing Circle + Start Button */}
            <div className="kp-center__measurement-area">
              <StaticBreathingCircle>
                {currentKP !== null ? (
                  <>
                    <div className="kp-center__circle-value">{formatSeconds(currentKP)}</div>
                    {previousKP !== null && (
                      <div className={`kp-center__circle-trend kp-center__circle-trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                        {formatTrend(trend)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="kp-center__circle-empty">--</div>
                )}
              </StaticBreathingCircle>
              
              {/* Help Link - NAD buttonem */}
              <div className="kp-center__help">
                <TextLink onClick={() => setViewMode('instructions')}>
                  Jak měřit?
                </TextLink>
              </div>
              
              <Button 
                variant="primary" 
                size="lg"
                fullWidth 
                onClick={handleStartMeasurement}
                disabled={isSaving}
              >
                Začít měření
              </Button>
            </div>
          </>
        )}
        
        {/* Instructions View - Fullscreen (nahradí circle) */}
        {viewMode === 'instructions' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza - jak měřit?</h2>
            
            <div className="kp-center__instructions-fullscreen">
              <ol className="kp-center__instructions-list">
                <li>Proveď tři normální nádechy a výdechy</li>
                <li>Po třetím výdechu zadrž dech a spusť stopky</li>
                <li>Zacpi nos a zavři oči</li>
                <li>
                  Čekej na první signál potřeby se nadechnout
                  <br />
                  <span className="kp-center__instructions-detail">
                    (Kopnutí bránice, potřeba polknout či myšlenka na nádech)
                  </span>
                </li>
                <li>Zastav měření při prvním signálu</li>
                <li className="kp-center__instructions-check">
                  <strong>Kontrola:</strong> První nádech po zádrži by měl být tichý a jemný.
                </li>
              </ol>
              
              <Button 
                variant="primary" 
                fullWidth
                size="lg"
                onClick={() => setViewMode('ready')}
              >
                Zpět k měření
              </Button>
              
              <MiniTip variant="absolute">
                <strong>Tip:</strong> Pro nejpřesnější výsledky měř KP ráno hned po probuzení.
              </MiniTip>
            </div>
          </>
        )}
        
        {/* Measuring View - Circle zůstává, mění se OBSAH */}
        {viewMode === 'measuring' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza</h2>
            
            <MeasuringView 
              attemptsCount={attemptsCount}
              onComplete={handleMeasurementComplete}
              onClose={closeKPDetail}
            />
          </>
        )}
      </div>
    </div>
  );
}
