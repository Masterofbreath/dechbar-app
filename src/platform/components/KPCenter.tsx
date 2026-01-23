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

import { useState } from 'react';
import { useNavigation } from '@/platform/hooks';
import { useKPMeasurements } from '@/platform/api';
import { CloseButton } from '@/components/shared';
import { Button, TextLink } from '@/platform/components';
import { 
  StaticBreathingCircle,
  KPMeasurementEngine,
} from '@/components/kp';
import type { SaveKPData } from '@/platform/api';
import { formatSeconds, formatTrend, getKPMeasurementsCount } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';

/**
 * View modes for KPCenter (simplified)
 */
type ViewMode = 'ready' | 'measuring';

/**
 * KPCenter Component
 */
export function KPCenter() {
  const { isKPDetailOpen, closeKPDetail } = useNavigation();
  const { currentKP, measurements, saveKP, isSaving } = useKPMeasurements();
  const { showToast } = useToast();
  
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Always start in 'ready' mode (simplified flow)
  const [viewMode, setViewMode] = useState<ViewMode>('ready');
  
  // Get user preference from Settings (default 3x)
  const attemptsCount = getKPMeasurementsCount();
  
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
  const isFirstMeasurement = measurements.length === 0;
  
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
            
            {/* Help Link (collapsible) */}
            <div className="kp-center__help">
              <TextLink onClick={() => setShowInstructions(!showInstructions)}>
                {showInstructions ? 'Skrýt instrukce' : 'Jak měřit kontrolní pauzu?'}
              </TextLink>
            </div>
            
            {/* Collapsible Instructions */}
            {showInstructions && (
              <div className="kp-center__instructions-inline">
                <ol>
                  <li>3 klidné nádechy a výdechy</li>
                  <li>Výdech + zádrž (spustí se stopky)</li>
                  <li>Ucpat nos + zavřít oči</li>
                  <li>Čekat na první signál (bránice/polknutí/myšlenka)</li>
                  <li>Zastavit měření při prvním signálu</li>
                  <li className="kp-center__instructions-tip">
                    <strong>Tip:</strong> Pro nejpřesnější výsledky měř ráno hned po probuzení (4-9h).
                  </li>
                </ol>
              </div>
            )}
          </>
        )}
        
        {/* Measuring View */}
        {viewMode === 'measuring' && (
          <KPMeasurementEngine 
            attemptsCount={attemptsCount}
            onComplete={handleMeasurementComplete}
            previousKP={previousKP}
            isFirst={isFirstMeasurement}
          />
        )}
      </div>
    </div>
  );
}
