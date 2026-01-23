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
import { Button, TextLink } from '@/platform/components';
import { 
  StaticBreathingCircle,
} from '@/components/kp';
import type { SaveKPData } from '@/platform/api';
import { formatSeconds, formatTrend, formatTimer, formatAttempts, getKPMeasurementsCount } from '@/utils/kp';
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
}

function MeasuringView({ 
  attemptsCount, 
  onComplete,
}: MeasuringViewProps) {
  const engine = useKPMeasurementEngine({
    attemptsCount,
    onComplete,
  });
  
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
          <div className="kp-center__intermediate">
            <div className="kp-center__intermediate-value">
              {engine.lastAttemptValue}s
            </div>
            <div className="kp-center__intermediate-progress">
              {engine.currentAttempt}/{engine.totalAttempts}
            </div>
          </div>
        );
      
      case 'result':
        return (
          <div className="kp-center__final">
            <div className="kp-center__final-value">
              {engine.averageKP}s
            </div>
            <div className="kp-center__final-label">Průměr</div>
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
            <p className="kp-center__hint">
              Stop při prvním signálu od těla
            </p>
          </>
        );
      
      case 'awaiting_next': {
        const isLastAttempt = engine.currentAttempt >= engine.totalAttempts;
        return (
          <div className="kp-center__actions">
            {!isLastAttempt ? (
              <>
                <Button 
                  variant="primary" 
                  fullWidth 
                  size="lg"
                  onClick={engine.continueNext}
                >
                  Další měření
                </Button>
                <Button 
                  variant="ghost" 
                  fullWidth 
                  size="md"
                  onClick={engine.finishEarly}
                  className="kp-center__finish-early"
                >
                  Hotovo (ukončit měření)
                </Button>
              </>
            ) : (
              <Button 
                variant="primary" 
                fullWidth 
                size="lg"
                onClick={engine.finishEarly}
              >
                Hotovo
              </Button>
            )}
          </div>
        );
      }
      
      case 'result':
        return (
          <>
            {/* Zobrazit jednotlivé pokusy */}
            {engine.attempts.length > 1 && (
              <p className="kp-center__attempts">
                Měření: {formatAttempts(engine.attempts)}
              </p>
            )}
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => onComplete({} as SaveKPData)} 
            >
              Zavřít
            </Button>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <>
      {/* Progress indicator (pokud measuring nebo awaiting) */}
      {(engine.phase === 'measuring' || engine.phase === 'awaiting_next') && (
        <div className="kp-center__progress-indicator">
          <p className="kp-center__progress-text">
            Měření {engine.currentAttempt}/{engine.totalAttempts}
          </p>
        </div>
      )}
      
      {/* Measurement Area - VŽDY stejná struktura */}
      <div className="kp-center__measurement-area">
        <StaticBreathingCircle>
          {renderCircleContent()}
        </StaticBreathingCircle>
        
        {renderButton()}
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
            
            {/* Current KP Display (if exists) */}
            {currentKP !== null && (
              <div className="kp-center__current">
                <div className="kp-center__value">{formatSeconds(currentKP)}</div>
                {previousKP !== null && (
                  <div className={`kp-center__trend kp-center__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                    {formatTrend(trend)}
                  </div>
                )}
              </div>
            )}
            
            {/* Static Breathing Circle + Start Button */}
            <div className="kp-center__measurement-area">
              <StaticBreathingCircle>
                <div className="kp-center__circle-placeholder">
                  {currentKP !== null ? formatSeconds(currentKP) : '--'}
                </div>
              </StaticBreathingCircle>
              
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
            
            {/* Help Link */}
            <div className="kp-center__help">
              <TextLink onClick={() => setViewMode('instructions')}>
                Jak měřit kontrolní pauzu?
              </TextLink>
            </div>
          </>
        )}
        
        {/* Instructions View - Fullscreen (nahradí circle) */}
        {viewMode === 'instructions' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza - návod</h2>
            
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
                  <strong>Kontrola:</strong> První nádech po zastavení by měl být tichý a jemný.
                </li>
                <li className="kp-center__instructions-tip">
                  <strong>Tip:</strong> Pro nejpřesnější výsledky a uložení relevantní hodnoty měř KP ráno hned po probuzení.
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
            </div>
          </>
        )}
        
        {/* Measuring View - Circle zůstává, mění se OBSAH */}
        {viewMode === 'measuring' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza</h2>
            
            {/* Current KP Display (if exists) */}
            {currentKP !== null && (
              <div className="kp-center__current">
                <div className="kp-center__value">{formatSeconds(currentKP)}</div>
                {previousKP !== null && (
                  <div className={`kp-center__trend kp-center__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                    {formatTrend(trend)}
                  </div>
                )}
              </div>
            )}
            
            <MeasuringView 
              attemptsCount={attemptsCount}
              onComplete={handleMeasurementComplete}
            />
            
            {/* Footer - Help Link */}
            <div className="kp-center__help">
              <TextLink onClick={() => setViewMode('instructions')}>
                Jak měřit kontrolní pauzu?
              </TextLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
