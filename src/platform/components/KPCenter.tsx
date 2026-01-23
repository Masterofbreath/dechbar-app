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
  KPOnboarding, 
  KPMeasurementEngine, 
  KPHistory,
} from '@/components/kp';
import type { SaveKPData } from '@/platform/api';
import { formatSeconds, formatTrend, isMorningWindow } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';

/**
 * View modes for KPCenter
 */
type ViewMode = 'dashboard' | 'onboarding' | 'measuring' | 'instructions';

/**
 * KPCenter Component
 */
export function KPCenter() {
  const { isKPDetailOpen, closeKPDetail } = useNavigation();
  const { currentKP, measurements, saveKP, isSaving } = useKPMeasurements();
  const { showToast } = useToast();
  
  // Local storage pro onboarding
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem('kp-onboarding-seen') === 'true';
  });
  
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Determine initial view mode based on onboarding state
  const getInitialViewMode = (): ViewMode => {
    if (!hasSeenOnboarding) return 'onboarding';
    return 'dashboard';
  };
  
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode());
  
  /**
   * Handle onboarding complete
   */
  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem('kp-onboarding-seen', 'true');
    setViewMode('dashboard');
  };
  
  /**
   * Handle start measurement
   */
  const handleStartMeasurement = () => {
    // Check morning window
    if (!isMorningWindow()) {
      showToast(
        'Pro relevantní data měř ráno hned po probuzení (4-9h)',
        'warning'
      );
      
      // Počkat 3s než zobrazí options
      setTimeout(() => {
        const confirmContinue = window.confirm(
          'Můžeš pokračovat jako vzorové měření, ale neuloží se do statistik.\n\nChceš pokračovat?'
        );
        
        if (confirmContinue) {
          setViewMode('measuring');
        }
      }, 3000);
    } else {
      setViewMode('measuring');
    }
  };
  
  /**
   * Handle measurement complete
   */
  const handleMeasurementComplete = async (data: SaveKPData) => {
    try {
      await saveKP(data);
      setViewMode('dashboard');
      
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
        
        {/* Onboarding View */}
        {viewMode === 'onboarding' && (
          <KPOnboarding onComplete={handleOnboardingComplete} />
        )}
        
        {/* Measuring View */}
        {viewMode === 'measuring' && (
          <KPMeasurementEngine 
            onComplete={handleMeasurementComplete}
            previousKP={previousKP}
            isFirst={isFirstMeasurement}
          />
        )}
        
        {/* Instructions View */}
        {viewMode === 'instructions' && (
          <div className="kp-center__instructions">
            <h2>Jak měřit KP?</h2>
            <ol>
              <li>3 klidné nádechy a výdechy</li>
              <li>Výdech + zádrž (spustí se stopky)</li>
              <li>Ucpat nos + zavřít oči</li>
              <li>Čekat na první signál (bránice, polknutí, myšlenka)</li>
              <li>Otevřít oči + zastavit</li>
            </ol>
            <Button onClick={() => setViewMode('dashboard')}>
              Zpět
            </Button>
          </div>
        )}
        
        {/* Dashboard View */}
        {viewMode === 'dashboard' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza</h2>
            
            {/* Current KP Display */}
            {currentKP !== null ? (
              <div className="kp-center__current">
                <div className="kp-center__value">{formatSeconds(currentKP)}</div>
                {previousKP !== null && (
                  <div className={`kp-center__trend kp-center__trend--${trend >= 0 ? 'positive' : 'negative'}`}>
                    {formatTrend(trend)}
                  </div>
                )}
              </div>
            ) : (
              <div className="kp-center__empty">
                <p>Zatím nemáš změřenou KP</p>
              </div>
            )}
            
            {/* CTA Button */}
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleStartMeasurement}
              disabled={isSaving}
            >
              Začít měření
            </Button>
            
            {/* Instructions Link */}
            <div className="kp-center__help">
              <TextLink onClick={() => setShowInstructions(!showInstructions)}>
                {showInstructions ? 'Skrýt instrukce' : 'Jak měřit?'}
              </TextLink>
            </div>
            
            {/* Collapsible Instructions */}
            {showInstructions && (
              <div className="kp-center__instructions-inline">
                <ol>
                  <li>3 klidné nádechy a výdechy</li>
                  <li>Výdech + zádrž (spustí se stopky)</li>
                  <li>Ucpat nos + zavřít oči</li>
                  <li>Čekat na první signál</li>
                  <li>Otevřít oči + zastavit</li>
                </ol>
              </div>
            )}
            
            {/* History */}
            <div className="kp-center__history">
              <KPHistory measurements={measurements} validOnly={true} limit={5} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
