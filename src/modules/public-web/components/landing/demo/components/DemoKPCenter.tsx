/**
 * DemoKPCenter - Kontrolní Pauza Measurement Modal (Demo Version)
 * 
 * Demo version of KPCenter for unregistered users on landing page.
 * - Always 3 attempts (locked)
 * - No Supabase save
 * - Triggers conversion modal after measurement
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo/Components
 */

import { useState, useEffect } from 'react';
import { CloseButton } from '@/components/shared';
import { DemoKPReady } from './DemoKPReady';
import { DemoKPInstructions } from './DemoKPInstructions';
import { DemoKPMeasuring } from './DemoKPMeasuring';

/**
 * View modes for DemoKPCenter
 */
type DemoViewMode = 'ready' | 'instructions' | 'measuring';

/**
 * Props for DemoKPCenter
 */
export interface DemoKPCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onConversionTrigger: (averageKP: number, attempts: number[]) => void;
  onEmailModalOpen: () => void;
}

/**
 * DemoKPCenter Component - Orchestrator for demo KP measurement
 */
export function DemoKPCenter({ 
  isOpen, 
  onClose, 
  onConversionTrigger,
  onEmailModalOpen
}: DemoKPCenterProps) {
  const [viewMode, setViewMode] = useState<DemoViewMode>('ready');
  
  /**
   * Reset viewMode when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setViewMode('ready');
    }
  }, [isOpen]);
  
  /**
   * NO immersive mode in demo mockup
   * Demo is already isolated in 375x812px container (foreignObject)
   * Immersive mode would manipulate document.body → breaks foreignObject layout
   * Modal uses position: absolute (relative to demo-app-container)
   */
  
  /**
   * Handle start measurement
   */
  const handleStartMeasurement = () => {
    setViewMode('measuring');
  };
  
  /**
   * Handle measurement complete (stores data, opens email modal immediately)
   */
  const handleMeasurementComplete = (averageKP: number, attempts: number[]) => {
    // Store KP data in parent state
    onConversionTrigger(averageKP, attempts);
    
    // Open email modal immediately (no result screen)
    onEmailModalOpen();
  };
  
  /**
   * Handle close with cleanup
   */
  const handleClose = () => {
    // Force blur all focused elements
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // Force click on body to clear hover states
    document.body.click();
    
    setTimeout(() => {
      onClose();
    }, 100);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="demo-kp-center" onClick={e => e.stopPropagation()}>
        <CloseButton onClick={handleClose} />
        
        {/* Ready View */}
        {viewMode === 'ready' && (
          <DemoKPReady
            onStartMeasurement={handleStartMeasurement}
            onShowInstructions={() => setViewMode('instructions')}
          />
        )}
        
        {/* Instructions View */}
        {viewMode === 'instructions' && (
          <DemoKPInstructions onBack={() => setViewMode('ready')} />
        )}
        
        {/* Measuring View */}
        {viewMode === 'measuring' && (
          <>
            <h2 className="demo-kp-center__title">Kontrolní pauza</h2>
            
            <DemoKPMeasuring 
              onComplete={handleMeasurementComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}
