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

import { useState, useEffect } from 'react';
import { DemoDnesView } from './views/DemoDnesView';
import { DemoCvicitView } from './views/DemoCvicitView';
import { DemoTopNav } from './components/DemoTopNav';
import { DemoBottomNav } from './components/DemoBottomNav';
import { LockedExerciseModal } from './components/LockedExerciseModal';
import { ChallengeRegistrationModal } from './components/ChallengeRegistrationModal';
import { DemoSettingsDrawer } from './components/DemoSettingsDrawer';
import { DemoKPCenter } from './components/DemoKPCenter';
import { DemoEmailModal } from './components/DemoEmailModal';
import { ToastProvider } from '@/platform/components/Toast';
import { useDemoAnalytics } from './hooks/useDemoAnalytics';
import { useChallengeMagicLink } from '@/hooks/useChallenge';
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
    isEmailModalOpen: false,
    kpMeasurementData: null,
  });
  
  const { track } = useDemoAnalytics();
  const { sendLink, loading: sendingMagicLink, success: magicLinkSent, error: magicLinkError, reset } = useChallengeMagicLink();
  
  /**
   * Detect if we're on challenge landing page (/vyzva)
   * Used for conditional modal rendering
   */
  const isChallengePage = typeof window !== 'undefined' && 
    window.location.pathname.includes('/vyzva');
  
  /**
   * FAILSAFE: Force unlock body scroll if stuck
   * Prevents iOS Safari foreignObject bug where cleanup doesn't run
   */
  useEffect(() => {
    const unlockBodyScroll = () => {
      // Force unlock body if stuck (defensive programming)
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };
    
    // Unlock on window focus (user returns to page)
    window.addEventListener('focus', unlockBodyScroll);
    
    // Cleanup: Always unlock on unmount
    return () => {
      window.removeEventListener('focus', unlockBodyScroll);
      unlockBodyScroll();
    };
  }, []);
  
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
    
    // Reset success state before opening new modal (defensive)
    reset();
    
    setState(prev => ({
      ...prev,
      selectedExercise: exercise,
      isModalOpen: true,
      kpMeasurementData: null, // CRITICAL: Clear old KP data (exercise click should NOT show KP)
    }));
    
    // Track exercise click (conversion trigger)
    track({
      action: 'exercise_click',
      view: state.activeView,
      exercise_name: exercise.name,
      exercise_id: exercise.id,
      page: isChallengePage ? '/vyzva' : '/',
      timestamp: Date.now(),
    });
    
    // Track modal open
    track({
      action: 'registration_modal_open',
      modal_type: isChallengePage ? 'challenge_registration' : 'locked_exercise',
      trigger: 'exercise_click',
      exercise_name: exercise.name,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    // Reset success state when closing modal
    if (magicLinkSent) {
      reset();
    }
    
    setState(prev => ({ 
      ...prev, 
      isModalOpen: false,
      kpMeasurementData: null, // CRITICAL: Clear KP data on modal close
    }));
    
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
   * UPDATED: Now sends magic link for challenge registration
   */
  const handleEmailSubmit = async (email: string) => {
    track({
      action: 'registration_start',
      method: 'email',
      exercise: state.selectedExercise || undefined,
      timestamp: Date.now(),
    });
    
    // On /vyzva page with KP measurement → Send magic link
    if (isChallengePage && state.kpMeasurementData) {
      const kpValue = state.kpMeasurementData.average || state.kpMeasurementData.lastValue;
      
      await sendLink(email, kpValue, 'demo_measurement_round_1');
      
      // Magic link hook handles success/error state
      // We just close the modal after send
      setTimeout(() => {
        setState(prev => ({ ...prev, isEmailModalOpen: false }));
      }, 2000); // Give user time to see success message
      
      return;
    }
    
    // Fallback for non-challenge pages (old behavior)
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
      action: 'kp_measurement_started',
      source: 'top_nav',
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
   * Handle KP measurement complete → open email modal
   */
  const handleKPConversion = (averageKP: number, attempts: number[]) => {
    // Store KP data
    setState(prev => ({ 
      ...prev, 
      kpMeasurementData: { averageKP, attempts },
    }));
    
    track({
      action: 'kp_measurement_completed',
      kpValue: averageKP,
      attempts: attempts.length,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle Email modal open (after KP measurement)
   */
  const handleEmailModalOpen = () => {
    // Reset success state before opening new modal (defensive)
    reset();
    
    setState(prev => ({ 
      ...prev, 
      isEmailModalOpen: true,
      isKPOpen: false, // CRITICAL: Close KP modal before opening email modal (prevents z-index conflict)
    }));
    
    track({
      action: 'email_modal_open',
      kpValue: state.kpMeasurementData?.averageKP,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle Email modal close (X button or ESC)
   * Also closes KP modal underneath
   */
  const handleEmailModalClose = () => {
    // Reset success state when closing modal
    if (magicLinkSent) {
      reset();
    }
    
    setState(prev => ({ 
      ...prev, 
      isEmailModalOpen: false,
      isKPOpen: false, // Close KP modal too
    }));
    
    track({
      action: 'email_modal_close',
      kpValue: state.kpMeasurementData?.averageKP,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle Email submit after KP measurement
   * UPDATED: Sends magic link for challenge registration
   */
  const handleKPEmailSubmit = async (email: string) => {
    // Track email submission
    track({
      action: 'email_submitted',
      email,
      kpValue: state.kpMeasurementData?.averageKP,
      timestamp: Date.now(),
    });
    
    // On /vyzva page → Send magic link
    if (isChallengePage && state.kpMeasurementData) {
      const kpValue = state.kpMeasurementData.averageKP || state.kpMeasurementData.attempts[0];
      
      await sendLink(email, kpValue, 'demo_measurement_complete');
      
      // Success modal now has "Rozumím" button - user closes it manually
      // No need for auto-close timeout
      
      return;
    }
    
    // Fallback for non-challenge pages (homepage)
    // Close both modals, open conversion modal
    setState(prev => ({
      ...prev,
      isEmailModalOpen: false,
      isKPOpen: false,
      isModalOpen: true, // Open conversion modal
    }));
    
    track({
      action: 'kp_conversion_triggered',
      kpValue: state.kpMeasurementData?.averageKP,
      timestamp: Date.now(),
    });
  };
  
  /**
   * Handle challenge registration (email submit on /vyzva page)
   * Used when clicking on protocols/exercises WITHOUT KP measurement
   */
  const handleChallengeRegistration = async (email: string) => {
    console.log('🎯 [DemoApp] handleChallengeRegistration called with email:', email);
    
    // Track challenge registration
    track({
      action: 'challenge_registration_submitted',
      email,
      exercise: state.selectedExercise?.name,
      kpValue: state.kpMeasurementData?.averageKP,
      source: 'challenge_landing_protocol',
      timestamp: Date.now(),
    });
    
    // If user clicked from protocol/exercise (no KP data), use default KP = 0
    // Real registration happens via magic link
    const kpValue = state.kpMeasurementData?.averageKP || 0;
    
    console.log('🎯 [DemoApp] Sending magic link with KP:', kpValue);
    
    // Send magic link with proper source tracking
    await sendLink(email, kpValue, 'post_protocol_exercise');
    
    console.log('🎯 [DemoApp] Magic link sent. Error:', magicLinkError, 'Success:', magicLinkSent);
    
    // Success modal now has "Rozumím" button - user closes it manually
    // No need for auto-close timeout
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
        
        {/* Conversion modal - Conditional based on page */}
        {isChallengePage ? (
          <ChallengeRegistrationModal
            isOpen={state.isModalOpen}
            onClose={handleModalClose}
            exercise={state.selectedExercise}
            kpMeasurement={state.kpMeasurementData}
            onSubmit={handleChallengeRegistration}
            isSubmitting={sendingMagicLink}
            successMessage={magicLinkSent ? 'Magic link odeslán! Zkontroluj svůj e-mail.' : ''}
            errorMessage={magicLinkError || ''}
          />
        ) : (
          <LockedExerciseModal
            isOpen={state.isModalOpen}
            onClose={handleModalClose}
            exercise={state.selectedExercise}
            kpMeasurement={state.kpMeasurementData}
            onGoogleAuth={handleGoogleAuth}
            onEmailSubmit={handleEmailSubmit}
          />
        )}
        
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
          onEmailModalOpen={handleEmailModalOpen}
        />
        
        {/* Email/Challenge Registration modal (after KP measurement) */}
        {/* Conditional: Challenge modal on /vyzva, Email modal on homepage */}
        {isChallengePage ? (
          <ChallengeRegistrationModal
            isOpen={state.isEmailModalOpen}
            onClose={handleEmailModalClose}
            exercise={null}
            kpMeasurement={state.kpMeasurementData}
            onSubmit={handleKPEmailSubmit}
            isSubmitting={sendingMagicLink}
            successMessage={magicLinkSent ? 'Magic link odeslán! Zkontroluj svůj e-mail.' : ''}
            errorMessage={magicLinkError || ''}
          />
        ) : (
          <DemoEmailModal
            isOpen={state.isEmailModalOpen}
            onClose={handleEmailModalClose}
            onSubmit={handleKPEmailSubmit}
            kpValue={state.kpMeasurementData?.averageKP ?? 0}
            validAttemptsCount={state.kpMeasurementData?.attempts.length ?? 0}
          />
        )}
      </div>
    </ToastProvider>
  );
}
