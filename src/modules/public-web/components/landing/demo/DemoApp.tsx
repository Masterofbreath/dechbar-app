/**
 * DemoApp - Interactive Demo Orchestrator
 * 
 * Main container for demo mockup with:
 * - Local state management (tab switching, modal)
 * - Analytics tracking (clicks, conversions)
 * - Error boundary protection
 * 
 * Architecture: Isolated from main app, reuses MVp0 components.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import { useState } from 'react';
import { DemoDnesView } from './views/DemoDnesView';
import { DemoCvicitView } from './views/DemoCvicitView';
import { DemoTopNav } from './components/DemoTopNav';
import { DemoBottomNav } from './components/DemoBottomNav';
import { LockedExerciseModal } from './components/LockedExerciseModal';
import { DemoSettingsDrawer } from './components/DemoSettingsDrawer';
import { DemoKPCenter } from './components/DemoKPCenter';
import { ToastProvider } from '@/platform/components/Toast';
import { useDemoAnalytics } from './hooks/useDemoAnalytics';
import type { DemoView, DemoState } from './types/demo.types';
import type { Exercise } from '@/shared/exercises/types';

/**
 * DemoApp - Main demo container
 * 
 * @example
 * <DemoApp />
 */
export function DemoApp() {
  const [state, setState] = useState<DemoState>({
    activeView: 'dnes',
    selectedExercise: null,
    isModalOpen: false,
    isSettingsOpen: false,
    isKPOpen: false,
    kpMeasurementData: null,
  });
  
  const { track } = useDemoAnalytics();
  
  /**
   * Handle tab switching
   */
  const handleViewChange = (view: DemoView) => {
    setState(prev => ({ ...prev, activeView: view }));
    
    track({
      action: 'tab_switch',
      view,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle exercise click - opens conversion modal
   */
  const handleExerciseClick = (exercise: Exercise, event?: React.MouseEvent) => {
    // Prevent scroll jump on mobile
    event?.preventDefault();
    event?.stopPropagation();
    
    setState(prev => ({
      ...prev,
      selectedExercise: exercise,
      isModalOpen: true,
    }));
    
    // Track click
    track({
      action: 'exercise_click',
      view: state.activeView,
      exercise,
      timestamp: Date.now(),
    });
    
    // Track modal open
    track({
      action: 'modal_open',
      exercise,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setState(prev => ({ ...prev, isModalOpen: false }));
    
    track({
      action: 'modal_close',
      exercise: state.selectedExercise || undefined,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle Google OAuth registration
   */
  const handleGoogleAuth = () => {
    track({
      action: 'registration_start',
      method: 'google',
      exercise: state.selectedExercise || undefined,
      timestamp: Date.now(),
    });
    
    // TODO: Integrate with real OAuth (Phase 2)
    // For now: Demo alert
    if (import.meta.env.DEV) {
      console.log('[Demo] Google OAuth clicked:', state.selectedExercise?.name);
      alert(`Demo: Google registrace pro cvičení "${state.selectedExercise?.name}"\n\nV produkci: redirect to /exercise/${state.selectedExercise?.id}`);
    } else {
      // Production: Redirect to real auth
      window.location.href = '/register';
    }
  };
  
  /**
   * Handle email registration
   */
  const handleEmailSubmit = (email: string) => {
    track({
      action: 'registration_start',
      method: 'email',
      exercise: state.selectedExercise || undefined,
      timestamp: Date.now(),
    });
    
    // TODO: Integrate with real auth (Phase 2)
    // For now: Demo alert
    if (import.meta.env.DEV) {
      console.log('[Demo] Email registration:', email, 'for:', state.selectedExercise?.name);
      alert(`Demo: Email registrace\n\nEmail: ${email}\nCvičení: ${state.selectedExercise?.name}\n\nV produkci: redirect to /exercise/${state.selectedExercise?.id}`);
    } else {
      // Production: Redirect to real auth with email pre-filled
      window.location.href = `/register?email=${encodeURIComponent(email)}`;
    }
  };
  
  /**
   * Handle Settings open
   */
  const handleSettingsOpen = (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();  // CRITICAL - stop event bubbling z foreignObject!
    
    setState(prev => ({ ...prev, isSettingsOpen: true }));
    
    track({
      action: 'settings_open',
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle Settings close
   */
  const handleSettingsClose = () => {
    setState(prev => ({ ...prev, isSettingsOpen: false }));
    
    track({
      action: 'settings_close',
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle KP measurement open
   */
  const handleKPOpen = (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();  // CRITICAL - stop event bubbling z foreignObject!
    
    setState(prev => ({ ...prev, isKPOpen: true }));
    
    track({
      action: 'kp_measurement_open',
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle KP measurement close
   */
  const handleKPClose = () => {
    setState(prev => ({ ...prev, isKPOpen: false }));
    
    track({
      action: 'kp_measurement_close',
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle KP measurement complete → trigger conversion
   */
  const handleKPConversion = (averageKP: number, attempts: number[]) => {
    // Store KP data
    setState(prev => ({ 
      ...prev, 
      kpMeasurementData: { averageKP, attempts },
      isModalOpen: true, // Open conversion modal
    }));
    
    track({
      action: 'kp_measurement_completed',
      kpValue: averageKP,
      attempts: attempts.length,
      timestamp: Date.now(),
    });
    
    track({
      action: 'kp_conversion_triggered',
      kpValue: averageKP,
      timestamp: Date.now(),
    });
  };
  
  return (
    <ToastProvider>
      <div className="demo-app">
        {/* Top navigation (fixed) */}
        <DemoTopNav 
          onSettingsClick={handleSettingsOpen}
          onKPClick={handleKPOpen}
        />
        
        {/* Content area (scrollable, with padding for top nav) */}
        <div className="demo-app__content">
          {state.activeView === 'dnes' && (
            <DemoDnesView onExerciseClick={handleExerciseClick} />
          )}
          
          {state.activeView === 'cvicit' && (
            <DemoCvicitView onExerciseClick={handleExerciseClick} />
          )}
        </div>
        
        {/* Bottom navigation (fixed) */}
        <DemoBottomNav 
          activeView={state.activeView} 
          onViewChange={handleViewChange} 
        />
        
        {/* Conversion modal */}
        <LockedExerciseModal
          isOpen={state.isModalOpen}
          onClose={handleModalClose}
          exercise={state.selectedExercise}
          kpMeasurement={state.kpMeasurementData}
          onGoogleAuth={handleGoogleAuth}
          onEmailSubmit={handleEmailSubmit}
        />
        
        {/* Settings drawer */}
        <DemoSettingsDrawer
          isOpen={state.isSettingsOpen}
          onClose={handleSettingsClose}
        />
        
        {/* KP Measurement modal */}
        <DemoKPCenter
          isOpen={state.isKPOpen}
          onClose={handleKPClose}
          onConversionTrigger={handleKPConversion}
        />
      </div>
    </ToastProvider>
  );
}
