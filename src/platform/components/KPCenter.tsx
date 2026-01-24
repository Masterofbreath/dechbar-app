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
import { CloseButton } from '@/components/shared';
import { KPReady, KPInstructions, KPMeasuring } from './kp/views';
import type { SaveKPData } from '@/platform/api';
import { getKPMeasurementsCount } from '@/utils/kp';
import { useToast } from '@/hooks/useToast';

/**
 * View modes for KPCenter
 */
type ViewMode = 'ready' | 'instructions' | 'measuring';

/**
 * KPCenter Component - Orchestrator for KP measurement views
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
   * Immersive mode on mobile
   */
  useEffect(() => {
    if (isKPDetailOpen && window.innerWidth <= 768) {
      document.body.classList.add('immersive-mode');
    }
    return () => {
      document.body.classList.remove('immersive-mode');
    };
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
        
        {/* Ready View */}
        {viewMode === 'ready' && (
          <KPReady
            currentKP={currentKP}
            previousKP={previousKP}
            trend={trend}
            isSaving={isSaving}
            onStartMeasurement={handleStartMeasurement}
            onShowInstructions={() => setViewMode('instructions')}
          />
        )}
        
        {/* Instructions View */}
        {viewMode === 'instructions' && (
          <KPInstructions onBack={() => setViewMode('ready')} />
        )}
        
        {/* Measuring View */}
        {viewMode === 'measuring' && (
          <>
            <h2 className="kp-center__title">Kontrolní pauza</h2>
            
            <KPMeasuring 
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
