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
}

/**
 * DemoKPCenter Component - Orchestrator for demo KP measurement
 */
export function DemoKPCenter({ 
  isOpen, 
  onClose, 
  onConversionTrigger 
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
   * Immersive mode on mobile
   */
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      document.body.classList.add('immersive-mode');
    }
    return () => {
      document.body.classList.remove('immersive-mode');
    };
  }, [isOpen]);
  
  /**
   * Handle start measurement
   */
  const handleStartMeasurement = () => {
    setViewMode('measuring');
  };
  
  /**
   * Handle measurement complete
   */
  const handleMeasurementComplete = (averageKP: number, attempts: number[]) => {
    // Close KP modal first
    onClose();
    
    // Then trigger conversion modal with KP data
    setTimeout(() => {
      onConversionTrigger(averageKP, attempts);
    }, 300); // Slight delay for smooth transition
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
